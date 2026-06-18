import { createClient } from '@supabase/supabase-js';

export function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    return { client: null, error: 'SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di environment server.' };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey),
    error: ''
  };
}

export async function requireAdminRequest(req: any, res: any) {
  const { client, error } = getSupabaseAdmin();
  if (!client) {
    res.status(503).json({ error });
    return null;
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Token login admin tidak ditemukan.' });
    return null;
  }

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: authError?.message || 'Token login admin tidak valid.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    res.status(403).json({ error: profileError?.message || 'Hanya admin utama yang bisa melakukan aksi ini.' });
    return null;
  }

  return { client, user: authData.user };
}

export function allowMethod(req: any, res: any, method: string) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  if (req.method !== method) {
    res.setHeader('Allow', method);
    res.status(405).json({ error: `Method ${req.method} tidak didukung.` });
    return false;
  }

  return true;
}

export function getJsonBody(req: any) {
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

export function sendServerError(res: any, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error || fallback);
  return res.status(500).json({
    error: fallback,
    details: message
  });
}
