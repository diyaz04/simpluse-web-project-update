import { createClient } from '@supabase/supabase-js';

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

async function requireAdminRequest(req: any, res: any) {
  const { client, error } = getSupabaseAdmin();
  if (!client) {
    json(res, 503, { error });
    return null;
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    json(res, 401, { error: 'Token login admin tidak ditemukan.' });
    return null;
  }

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    json(res, 401, { error: authError?.message || 'Token login admin tidak valid.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    json(res, 403, { error: profileError?.message || 'Hanya admin utama yang bisa melakukan aksi ini.' });
    return null;
  }

  return { client, user: authData.user };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: `Method ${req.method} tidak didukung.` });
  }

  try {
    const auth = await requireAdminRequest(req, res);
    if (!auth) return;

    const { client, user: adminUser } = auth;
    const body = getJsonBody(req);
    const { name, email, whatsapp, password, notes } = body;
    const commissionRate = numberOrZero(body.commission_rate) || 10;
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!name || !email || !whatsapp || !password) {
      return json(res, 400, { error: 'Nama, email, WhatsApp, dan password awal reseller wajib diisi.' });
    }

    if (String(password).length < 6) {
      return json(res, 400, { error: 'Password awal reseller minimal 6 karakter.' });
    }

    const { data: createdUser, error: createUserError } = await client.auth.admin.createUser({
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
      return json(res, 400, { error: createUserError?.message || 'Gagal membuat akun Auth reseller.' });
    }

    const resellerUserId = createdUser.user.id;
    const { error: profileError } = await client
      .from('profiles')
      .upsert({
        id: resellerUserId,
        full_name: name,
        whatsapp,
        role: 'reseller',
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      await client.auth.admin.deleteUser(resellerUserId).catch(() => null);
      return json(res, 500, {
        error: 'Akun Auth dibuat tapi profile reseller gagal dibuat.',
        details: profileError.message
      });
    }

    const { data: reseller, error: resellerError } = await client
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
      await client.auth.admin.deleteUser(resellerUserId).catch(() => null);
      return json(res, 500, {
        error: 'Gagal menyimpan data reseller.',
        details: resellerError?.message || 'Supabase tidak mengembalikan row reseller.'
      });
    }

    return json(res, 200, reseller);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Gagal mendaftarkan akun reseller.');
    return json(res, 500, {
      error: 'Gagal mendaftarkan akun reseller.',
      details: message
    });
  }
}
