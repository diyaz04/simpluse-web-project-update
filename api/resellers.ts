import { allowMethod, getJsonBody, numberOrZero, requireAdminRequest, sendServerError } from './_shared';

export default async function handler(req: any, res: any) {
  if (!allowMethod(req, res, 'POST')) return;

  try {
    const auth = await requireAdminRequest(req, res);
    if (!auth) return;

    const { client, user: adminUser } = auth;
    const body = getJsonBody(req);
    const { name, email, whatsapp, password, notes } = body;
    const commissionRate = numberOrZero(body.commission_rate) || 10;
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ error: 'Nama, email, WhatsApp, dan password awal reseller wajib diisi.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password awal reseller minimal 6 karakter.' });
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
      return res.status(400).json({ error: createUserError?.message || 'Gagal membuat akun Auth reseller.' });
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
      return res.status(500).json({
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
      return res.status(500).json({
        error: 'Gagal menyimpan data reseller.',
        details: resellerError?.message || 'Supabase tidak mengembalikan row reseller.'
      });
    }

    return res.status(200).json(reseller);
  } catch (error) {
    return sendServerError(res, error, 'Gagal mendaftarkan akun reseller.');
  }
}
