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
const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const isRealSupabase =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServerKey) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_');
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

app.post('/api/orders', async (req, res) => {
  const { full_name, whatsapp, email, website_type, description, budget, deadline } = req.body;

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
        demoOnly: true
      });
    }

    return res.status(503).json({
      error: 'Supabase belum dikonfigurasi di server. Isi SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY atau VITE_SUPABASE_ANON_KEY.'
    });
  }

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
      status: 'new'
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
