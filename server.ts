import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const isRealSupabase = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder');
const supabaseServer = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'diyaznajib.93@gmail.com';

app.post('/api/orders', async (req, res) => {
  const { full_name, whatsapp, email, website_type, description, budget, deadline } = req.body;
  let savedOrder = null;

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
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
        }])
        .select()
        .single();

      if (!error && data) {
        savedOrder = data;
      } else {
        console.warn('Supabase DB error, order not saved to cloud database:', error);
      }
    } catch (dbError) {
      console.error('Failed to execute Supabase query:', dbError);
    }
  }

  if (resend) {
    try {
      const cleanWhatsapp = String(whatsapp || '').replace(/[^0-9]/g, '');
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FAFAFA;">
          <h2 style="color: #EA580C; margin-top: 0;">Simpluse Web Project - Notifikasi Order Baru</h2>
          <p>Halo Owner, Anda menerima pengajuan order pembuatan website baru dari calon klien.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Nama Lengkap</td><td style="padding: 10px; border: 1px solid #E5E7EB;">${full_name}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">No. WhatsApp</td><td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="https://wa.me/${cleanWhatsapp}" style="color: #ea580c;">${whatsapp}</a></td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Email</td><td style="padding: 10px; border: 1px solid #E5E7EB;"><a href="mailto:${email}" style="color: #ea580c;">${email}</a></td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Jenis Website</td><td style="padding: 10px; border: 1px solid #E5E7EB;">${website_type}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Budget</td><td style="padding: 10px; border: 1px solid #E5E7EB;">${budget}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB;">Deadline</td><td style="padding: 10px; border: 1px solid #E5E7EB;">${deadline}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #E5E7EB; vertical-align: top;">Deskripsi</td><td style="padding: 10px; border: 1px solid #E5E7EB; white-space: pre-wrap;">${description}</td></tr>
          </table>
        </div>
      `;

      await resend.emails.send({
        from: 'Simpluse Portal <onboarding@resend.dev>',
        to: OWNER_EMAIL,
        replyTo: email,
        subject: `[Order Baru] ${website_type} - ${full_name}`,
        html: emailHtml,
      });
    } catch (resendError) {
      console.error('Resend email sending failed:', resendError);
    }
  }

  return res.json(savedOrder || { success: true, localOnly: true });
});

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="(.*?)"/);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    let bodyText = bodyMatch ? bodyMatch[1] : html;

    bodyText = bodyText
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    res.json({
      title: titleMatch ? titleMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      bodyText,
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
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
