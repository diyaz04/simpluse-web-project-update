import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

const isDemoMode = String(process.env.DEMO_MODE || process.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseServerKey = supabaseServiceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || '';
const isRealSupabase =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServerKey) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_');
const hasServiceRoleKey = Boolean(supabaseServiceRoleKey) && !supabaseServiceRoleKey.includes('placeholder') && !supabaseServiceRoleKey.includes('YOUR_');
const supabaseServer = isRealSupabase ? createClient(supabaseUrl, supabaseServerKey) : null;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const ownerEmail = process.env.OWNER_EMAIL || (isDemoMode ? 'demo-owner@example.test' : '');
const resendSender = process.env.RESEND_FROM_EMAIL || (isDemoMode ? 'onboarding@resend.dev' : '');

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

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

async function resolveOrderSourceFields(req: express.Request, res: express.Response, paymentFields: ReturnType<typeof normalizePaymentFields>) {
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

  if (!hasServiceRoleKey) {
    res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk menerima order afiliasi reseller.' });
    return null;
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Order reseller wajib dikirim dari akun reseller yang sedang login.' });
    return null;
  }

  const { data: authData, error: authError } = await supabaseServer!.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: authError?.message || 'Session reseller tidak valid. Silakan login ulang.' });
    return null;
  }

  const { data: profile, error: profileError } = await supabaseServer!
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'reseller') {
    res.status(403).json({ error: profileError?.message || 'Hanya akun reseller yang bisa mengirim order afiliasi.' });
    return null;
  }

  const { data: reseller, error: resellerError } = await supabaseServer!
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

async function requireAdminRequest(req: express.Request, res: express.Response) {
  if (!supabaseServer || !hasServiceRoleKey) {
    res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk mendaftarkan akun reseller dari dashboard.' });
    return null;
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Token login admin tidak ditemukan.' });
    return null;
  }

  const { data: authData, error: authError } = await supabaseServer.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: authError?.message || 'Token login admin tidak valid.' });
    return null;
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    res.status(403).json({ error: profileError?.message || 'Hanya admin utama yang bisa mendaftarkan reseller.' });
    return null;
  }

  return authData.user;
}

app.post('/api/resellers', async (req, res) => {
  try {
    const adminUser = await requireAdminRequest(req, res);
    if (!adminUser) return;

    const { name, email, whatsapp, password, notes } = req.body;
    const commissionRate = numberOrZero(req.body.commission_rate) || 10;
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';

    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ error: 'Nama, email, WhatsApp, dan password awal reseller wajib diisi.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password awal reseller minimal 6 karakter.' });
    }

    const { data: createdUser, error: createUserError } = await supabaseServer!.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        whatsapp,
        created_by: adminUser.id
      }
    });

    if (createUserError || !createdUser.user) {
      return res.status(400).json({ error: createUserError?.message || 'Gagal membuat akun Auth reseller.' });
    }

    const resellerUserId = createdUser.user.id;
    const { error: profileError } = await supabaseServer!
      .from('profiles')
      .upsert({
        id: resellerUserId,
        full_name: name,
        whatsapp,
        role: 'reseller',
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      await supabaseServer!.auth.admin.deleteUser(resellerUserId).catch(() => null);
      return res.status(500).json({
        error: 'Akun Auth dibuat tapi profile reseller gagal dibuat.',
        details: profileError.message
      });
    }

    const { data: reseller, error: resellerError } = await supabaseServer!
      .from('resellers')
      .insert([{
        user_id: resellerUserId,
        name,
        email,
        whatsapp,
        commission_rate: commissionRate,
        status,
        notes: notes || ''
      }])
      .select()
      .single();

    if (resellerError || !reseller) {
      await supabaseServer!.auth.admin.deleteUser(resellerUserId).catch(() => null);
      return res.status(500).json({
        error: 'Gagal menyimpan data reseller.',
        details: resellerError?.message || 'Supabase tidak mengembalikan row reseller.'
      });
    }

    return res.json(reseller);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Gagal mendaftarkan akun reseller.');
    return res.status(500).json({
      error: 'Gagal mendaftarkan akun reseller.',
      details: message
    });
  }
});

app.post('/api/orders', async (req, res) => {
  const { full_name, whatsapp, email, website_type, description, budget, deadline } = req.body;
  const rawPaymentFields = normalizePaymentFields(req.body);

  if (!full_name || !whatsapp || !email || !description) {
    return res.status(400).json({ error: 'Nama, WhatsApp, email, dan deskripsi wajib diisi.' });
  }

  if (!supabaseServer) {
    if (isDemoMode) {
      return res.json({
        id: 'demo-order-' + Date.now().toString(36),
        created_at: new Date().toISOString(),
        full_name,
        whatsapp,
        email,
        website_type,
        description,
        budget,
        deadline,
        status: 'new',
        ...rawPaymentFields,
        demoOnly: true
      });
    }

    return res.status(503).json({
      error: 'Supabase belum dikonfigurasi di server. Isi SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY atau VITE_SUPABASE_ANON_KEY.'
    });
  }

  const paymentFields = await resolveOrderSourceFields(req, res, rawPaymentFields);
  if (!paymentFields) return;

  const { data: savedOrder, error: saveError } = await supabaseServer
    .from('orders')
    .insert([{
      full_name,
      whatsapp,
      email,
      website_type,
      description,
      budget,
      deadline,
      status: 'new',
      ...paymentFields
    }])
    .select()
    .single();

  if (saveError || !savedOrder) {
    console.error('Supabase order insert failed:', saveError);
    return res.status(500).json({ error: saveError?.message || 'Order gagal disimpan ke Supabase.' });
  }

  if (resend && ownerEmail && resendSender) {
    try {
      const safeName = escapeHtml(full_name);
      const safeWhatsapp = escapeHtml(whatsapp);
      const safeEmail = escapeHtml(email);
      const safeWebsiteType = escapeHtml(website_type);
      const safeBudget = escapeHtml(budget);
      const safeDeadline = escapeHtml(deadline);
      const safeDescription = escapeHtml(description);
      const whatsappNumber = digitsOnly(whatsapp);
      const replyText = encodeURIComponent(`Halo ${full_name}, saya dari Simpluse Web Project terkait order website ${website_type}.`);

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FAFAFA;">
          <h2 style="color: #EA580C; margin-top: 0;">Simpluse Web Project - Notifikasi Order Baru</h2>
          <p>Halo Owner, ada pengajuan order pembuatan website baru dari calon klien.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #F3F4F6;">
              <td style="padding: 10px; font-weight: bold; width: 180px; border: 1px solid #E5E7EB;">Nama Lengkap</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">No. WhatsApp</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="https://wa.me/${whatsappNumber}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${safeWhatsapp}</a></td>
            </tr>
            <tr style="background-color: #F3F4F6;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Email</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="mailto:${safeEmail}" style="color: #ea580c; text-decoration: none;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Jenis Website</td>
              <td style="padding: 10px; font-weight: bold; color: #111827; border: 1px solid #E5E7EB;">${safeWebsiteType}</td>
            </tr>
            <tr style="background-color: #F3F4F6;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Estimasi Budget</td>
              <td style="padding: 10px; color: #047857; font-weight: 600; border: 1px solid #E5E7EB;">${safeBudget}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Deadline</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${safeDeadline}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB; vertical-align: top;">Kebutuhan & Deskripsi</td>
              <td style="padding: 10px; border: 1px solid #E5E7EB; white-space: pre-wrap;">${safeDescription}</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://wa.me/${whatsappNumber}?text=${replyText}" style="background-color: #EA580C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hubungi via WhatsApp</a>
          </div>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 25px 0;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Email dikirim otomatis oleh integrasi server Resend dari web app Simpluse Web.</p>
        </div>
      `;

      await resend.emails.send({
        from: `Simpluse Portal <${resendSender}>`,
        to: ownerEmail,
        replyTo: email,
        subject: `[Order Baru] ${website_type} - ${full_name}`,
        html: emailHtml,
      });
      console.log(`Notification email dispatched to owner: ${ownerEmail}`);
    } catch (resendError) {
      console.error('Resend email sending failed:', resendError);
    }
  } else {
    console.warn('Resend notification skipped. Configure RESEND_API_KEY, RESEND_FROM_EMAIL, and OWNER_EMAIL to enable email alerts.');
  }

  return res.json(savedOrder);
});

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Simpluse Server] Running on http://localhost:${PORT}`);
  });
}

setupServer();
