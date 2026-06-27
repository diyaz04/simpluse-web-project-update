import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, payload: Record<string, unknown>) {
  res.status(status).json(payload);
}

function getJsonBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    return {
      client: null,
      error: 'SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di environment server.'
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey),
    error: ''
  };
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
    json(res, 401, { error: 'Order reseller wajib dikirim dari akun reseller yang sedang login.' });
    return null;
  }

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    json(res, 401, { error: authError?.message || 'Session reseller tidak valid. Silakan login ulang.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'reseller') {
    json(res, 403, { error: profileError?.message || 'Hanya akun reseller yang bisa mengirim order afiliasi.' });
    return null;
  }

  const { data: reseller, error: resellerError } = await client
    .from('resellers')
    .select('id, name, commission_rate, status')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (resellerError || !reseller) {
    json(res, 403, { error: resellerError?.message || 'Akun reseller belum terhubung ke data reseller.' });
    return null;
  }

  if (reseller.status !== 'active') {
    json(res, 403, { error: 'Akun reseller sedang nonaktif.' });
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

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: `Method ${req.method} tidak didukung.` });
    }

    const { client, error } = getSupabaseAdmin();
    if (!client) {
      return json(res, 503, { error });
    }

    const body = getJsonBody(req);
    const { full_name, whatsapp, email, website_type, description, budget, deadline } = body;
    if (!full_name || !whatsapp || !email || !description) {
      return json(res, 400, { error: 'Nama, WhatsApp, email, dan deskripsi wajib diisi.' });
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
      return json(res, 500, {
        error: 'Order gagal disimpan ke Supabase.',
        details: saveError?.message || 'Supabase tidak mengembalikan row order.'
      });
    }

    return json(res, 200, savedOrder);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Gagal menyimpan order.');
    return json(res, 500, {
      error: 'Gagal menyimpan order.',
      details: message
    });
  }
}
