import { allowMethod, getJsonBody, getSupabaseAdmin, numberOrZero, sendServerError } from './_shared';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function digitsOnly(value: unknown) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

function normalizePaymentFields(body: Record<string, any>) {
  const paymentScheme = body.payment_scheme === 'per_user_contract' ? 'per_user_contract' : 'one_time';
  const dealPrice = numberOrZero(body.deal_price);
  const pricePerUser = numberOrZero(body.price_per_user);
  const userCount = numberOrZero(body.user_count);
  const monthlyAmount = paymentScheme === 'per_user_contract'
    ? pricePerUser * userCount
    : numberOrZero(body.monthly_amount);
  const commissionRate = numberOrZero(body.commission_rate);
  const commissionBase = paymentScheme === 'per_user_contract' ? monthlyAmount : dealPrice;

  return {
    source_channel: body.source_channel === 'reseller' ? 'reseller' : 'direct',
    submitted_by: body.submitted_by || null,
    reseller_id: body.reseller_id || null,
    reseller_name: body.reseller_name || null,
    payment_scheme: paymentScheme,
    deal_price: dealPrice,
    price_per_user: pricePerUser,
    user_count: userCount,
    monthly_amount: monthlyAmount,
    support_scope: body.support_scope || '',
    maintenance_terms: body.maintenance_terms || '',
    commission_rate: commissionRate,
    estimated_commission: numberOrZero(body.estimated_commission) || Math.round(commissionBase * commissionRate) / 100
  };
}

async function resolveOrderSourceFields(req: any, res: any, client: any, paymentFields: ReturnType<typeof normalizePaymentFields>) {
  if (paymentFields.source_channel !== 'reseller') {
    return {
      ...paymentFields,
      source_channel: 'direct',
      submitted_by: null,
      reseller_id: null,
      reseller_name: null,
      commission_rate: 0,
      estimated_commission: 0
    };
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Order reseller wajib dikirim dari akun reseller yang sedang login.' });
    return null;
  }

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: authError?.message || 'Session reseller tidak valid. Silakan login ulang.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'reseller') {
    res.status(403).json({ error: profileError?.message || 'Hanya akun reseller yang bisa mengirim order afiliasi.' });
    return null;
  }

  const { data: reseller, error: resellerError } = await client
    .from('resellers')
    .select('id, name, commission_rate, status')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (resellerError || !reseller) {
    res.status(403).json({ error: resellerError?.message || 'Akun reseller belum terhubung ke data reseller.' });
    return null;
  }

  if (reseller.status !== 'active') {
    res.status(403).json({ error: 'Akun reseller sedang nonaktif.' });
    return null;
  }

  const commissionRate = numberOrZero(reseller.commission_rate);
  const commissionBase = paymentFields.payment_scheme === 'per_user_contract'
    ? paymentFields.monthly_amount
    : paymentFields.deal_price;

  return {
    ...paymentFields,
    source_channel: 'reseller',
    submitted_by: authData.user.id,
    reseller_id: reseller.id,
    reseller_name: reseller.name,
    commission_rate: commissionRate,
    estimated_commission: Math.round(commissionBase * commissionRate) / 100
  };
}

function isSchemaInsertError(error: any) {
  const text = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`;
  return /PGRST204|schema cache|column .* does not exist|Could not find .* column|column .* of relation .* does not exist/i.test(text);
}

function buildLegacyOrderDescription(description: string, paymentFields: ReturnType<typeof normalizePaymentFields>) {
  if (paymentFields.source_channel !== 'reseller') return description;

  return [
    description,
    '',
    '--- Metadata Order Afiliasi ---',
    `Reseller: ${paymentFields.reseller_name || '-'}`,
    `Reseller ID: ${paymentFields.reseller_id || '-'}`,
    `Submitted By: ${paymentFields.submitted_by || '-'}`,
    `Skema: ${paymentFields.payment_scheme === 'per_user_contract' ? 'Kontrak per user / bulan' : 'Sekali bayar'}`,
    `Deal Price: ${paymentFields.deal_price}`,
    `Harga Per User: ${paymentFields.price_per_user}`,
    `Jumlah User: ${paymentFields.user_count}`,
    `Monthly Amount: ${paymentFields.monthly_amount}`,
    `Rate Komisi: ${paymentFields.commission_rate}%`,
    `Estimasi Komisi: ${paymentFields.estimated_commission}`,
    paymentFields.support_scope ? `Support Scope: ${paymentFields.support_scope}` : '',
    paymentFields.maintenance_terms ? `Maintenance Terms: ${paymentFields.maintenance_terms}` : ''
  ].filter(Boolean).join('\n');
}

function buildLegacyOrderBudget(budget: string, paymentFields: ReturnType<typeof normalizePaymentFields>) {
  if (paymentFields.source_channel !== 'reseller') return budget;
  return [
    budget || '-',
    `Affiliate ${paymentFields.reseller_name || '-'}`,
    `Komisi ${paymentFields.commission_rate}% = ${paymentFields.estimated_commission}`
  ].join(' | ');
}

async function sendOwnerNotification(params: {
  resendApiKey: string;
  ownerEmail: string;
  resendSender: string;
  full_name: string;
  whatsapp: string;
  email: string;
  website_type: string;
  budget: string;
  deadline: string;
  description: string;
}) {
  const { Resend } = await import('resend');
  const resend = new Resend(params.resendApiKey);
  const whatsappNumber = digitsOnly(params.whatsapp);
  const replyText = encodeURIComponent(`Halo ${params.full_name}, saya dari Simpluse Web Project terkait order website ${params.website_type}.`);
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FAFAFA;">
      <h2 style="color: #EA580C; margin-top: 0;">Simpluse Web Project - Notifikasi Order Baru</h2>
      <p>Halo Owner, ada pengajuan order pembuatan website baru dari calon klien.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; font-weight: bold; width: 180px; border: 1px solid #E5E7EB;">Nama Lengkap</td>
          <td style="padding: 10px; border: 1px solid #E5E7EB;">${escapeHtml(params.full_name)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">No. WhatsApp</td>
          <td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="https://wa.me/${whatsappNumber}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${escapeHtml(params.whatsapp)}</a></td>
        </tr>
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Email</td>
          <td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="mailto:${escapeHtml(params.email)}" style="color: #ea580c; text-decoration: none;">${escapeHtml(params.email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Jenis Website</td>
          <td style="padding: 10px; font-weight: bold; color: #111827; border: 1px solid #E5E7EB;">${escapeHtml(params.website_type)}</td>
        </tr>
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Estimasi Budget</td>
          <td style="padding: 10px; color: #047857; font-weight: 600; border: 1px solid #E5E7EB;">${escapeHtml(params.budget)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Deadline</td>
          <td style="padding: 10px; border: 1px solid #E5E7EB;">${escapeHtml(params.deadline)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB; vertical-align: top;">Kebutuhan & Deskripsi</td>
          <td style="padding: 10px; border: 1px solid #E5E7EB; white-space: pre-wrap;">${escapeHtml(params.description)}</td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://wa.me/${whatsappNumber}?text=${replyText}" style="background-color: #EA580C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hubungi via WhatsApp</a>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: `Simpluse Portal <${params.resendSender}>`,
    to: params.ownerEmail,
    replyTo: params.email,
    subject: `[Order Baru] ${params.website_type} - ${params.full_name}`,
    html: emailHtml
  });
}

export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const { client, error } = getSupabaseAdmin();
    if (!client) {
      return res.status(503).json({ error });
    }

    const body = getJsonBody(req);
    const { full_name, whatsapp, email, website_type, description, budget, deadline } = body;
    if (!full_name || !whatsapp || !email || !description) {
      return res.status(400).json({ error: 'Nama, WhatsApp, email, dan deskripsi wajib diisi.' });
    }

    const paymentFields = await resolveOrderSourceFields(req, res, client, normalizePaymentFields(body));
    if (!paymentFields) return;

    const fullOrderPayload = {
      full_name,
      whatsapp,
      email,
      website_type,
      description,
      budget,
      deadline,
      status: 'new',
      ...paymentFields
    };

    let { data: savedOrder, error: saveError } = await client
      .from('orders')
      .insert([fullOrderPayload])
      .select()
      .single();

    if (saveError && isSchemaInsertError(saveError)) {
      console.warn('Supabase order insert used legacy fallback because schema columns are missing:', saveError);
      const legacyOrderPayload = {
        full_name,
        whatsapp,
        email,
        website_type,
        description: buildLegacyOrderDescription(description, paymentFields),
        budget: buildLegacyOrderBudget(budget, paymentFields),
        deadline,
        status: 'new'
      };

      const fallbackResult = await client
        .from('orders')
        .insert([legacyOrderPayload])
        .select()
        .single();

      savedOrder = fallbackResult.data;
      saveError = fallbackResult.error;
    }

    if (saveError || !savedOrder) {
      return res.status(500).json({
        error: 'Order gagal disimpan ke Supabase.',
        details: saveError?.message || 'Supabase tidak mengembalikan row order.'
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const ownerEmail = process.env.OWNER_EMAIL || '';
    const resendSender = process.env.RESEND_FROM_EMAIL || '';

    if (resendApiKey && ownerEmail && resendSender) {
      sendOwnerNotification({
        resendApiKey,
        ownerEmail,
        resendSender,
        full_name,
        whatsapp,
        email,
        website_type,
        budget,
        deadline,
        description
      }).catch((resendError) => {
        console.error('Resend email sending failed:', resendError);
      });
    }

    return res.status(200).json(savedOrder);
  } catch (error) {
    return sendServerError(res, error, 'Gagal menyimpan order.');
  }
}
