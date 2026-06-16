import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Project, Order, ProjectStatus, OrderStatus } from '../types';
import { 
  FolderGit2, 
  Flame, 
  CircleDollarSign, 
  CheckCircle, 
  Users2, 
  Phone, 
  Mail, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Inbox,
  Sparkles,
  UserCheck,
  Ban,
  LayoutDashboard,
  Database,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Info
} from 'lucide-react';

interface DashboardHomeProps {
  onNavigate: (route: string) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const isDemoMode = db.isDemoMode();
  const supabaseSetupSql = `-- 1. SETUP TABEL 'projects'
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_name TEXT NOT NULL,
  client_wa TEXT,
  client_email TEXT,
  project_name TEXT NOT NULL,
  internal_notes TEXT,
  status TEXT DEFAULT 'ongoing' NOT NULL,
  start_date DATE,
  deadline DATE,
  total_price NUMERIC DEFAULT 0,
  dp_paid NUMERIC DEFAULT 0,
  tech_stack JSONB DEFAULT '[]'::jsonb NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  public_name TEXT,
  screenshot_url TEXT,
  live_url TEXT,
  description TEXT
);

-- 2. SETUP TABEL 'orders'
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  website_type TEXT,
  description TEXT,
  budget TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'new' NOT NULL
);

-- 3. AKTIFKAN RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public projects are readable" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;
DROP POLICY IF EXISTS "Anyone can submit orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Public site: only public portfolio rows are readable.
CREATE POLICY "Public projects are readable"
ON projects FOR SELECT
USING (is_public = true OR auth.role() = 'authenticated');

-- Dashboard: authenticated Supabase users can manage projects.
CREATE POLICY "Authenticated users can insert projects"
ON projects FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
ON projects FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
ON projects FOR DELETE TO authenticated
USING (true);

-- Public order form: visitors can submit leads.
CREATE POLICY "Anyone can submit orders"
ON orders FOR INSERT
WITH CHECK (true);

-- Dashboard: authenticated Supabase users can manage orders.
CREATE POLICY "Authenticated users can read orders"
ON orders FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
ON orders FOR DELETE TO authenticated
USING (true);`;

  // Stats calculation
  const [stats, setStats] = useState({
    totalProjects: 0,
    ongoingCount: 0,
    doneCount: 0,
    maintenanceCount: 0,
    totalRevenue: 0,
    totalDpPaid: 0,
    pendingBalance: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const projs = await db.getProjects();
        const ords = await db.getOrders();
        setProjects(projs);
        setOrders(ords);

        // Compute metrics
        let totalVal = 0;
        let dpPaidVal = 0;
        let ongoing = 0;
        let done = 0;
        let maintenance = 0;

        projs.forEach((p) => {
          totalVal += Number(p.total_price) || 0;
          dpPaidVal += Number(p.dp_paid) || 0;
          
          if (p.status === 'ongoing') ongoing++;
          else if (p.status === 'done') done++;
          else if (p.status === 'maintenance') maintenance++;
        });

        setStats({
          totalProjects: projs.length,
          ongoingCount: ongoing,
          doneCount: done,
          maintenanceCount: maintenance,
          totalRevenue: totalVal,
          totalDpPaid: dpPaidVal,
          pendingBalance: totalVal - dpPaidVal
        });

      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update order status directly on the dashboard
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await db.updateOrderStatus(id, status);
      if (updated) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-xs">Mengkalkulasikan rangkuman keuangan & proyek...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-home" className="space-y-10">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Admin Control</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ikhtisar Bisnis Portfolio</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Ringkasan penawaran closing, order, dan pelacakan anggaran piutang secara langsung.</p>
        </div>
        <button
          onClick={() => onNavigate('#/dashboard/projects/new')}
          className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-xs font-bold tracking-wide px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-brand-orange-600/10 flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buat Proyek Baru</span>
        </button>
      </div>

      {/* STATS ANALYTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Nilai Proyek</span>
              <CircleDollarSign className="w-4.5 h-4.5 text-brand-orange-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{rupiah(stats.totalRevenue)}</h2>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1 mt-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>DP Masuk: {rupiah(stats.totalDpPaid)}</span>
          </div>
        </div>

        {/* Card 2: Ongoing */}
        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sedang Proses</span>
              <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white font-mono">{stats.ongoingCount} <span className="text-xs font-sans font-normal text-slate-500">ongoing</span></h2>
          </div>
          <div className="text-[10px] text-amber-400 font-medium mt-3">
            <span>Sisa s/d Deadline Terlama</span>
          </div>
        </div>

        {/* Card 3: Selesai */}
        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Project Done</span>
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-white font-mono">{stats.doneCount} <span className="text-xs font-sans font-normal text-slate-500">beres</span></h2>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-3">
            <span>+{stats.maintenanceCount} dalam pemeliharaan</span>
          </div>
        </div>

        {/* Card 4: Piutang */}
        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sisa Tagihan Klien</span>
              <span className="text-xs font-mono font-bold text-red-500">INVOICE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{rupiah(stats.pendingBalance)}</h2>
          </div>
          <p className="text-[10px] text-amber-400 font-medium mt-3">
            Perlu ditagihkan pasca go-live
          </p>
        </div>
      </div>

      {/* INTERACTIVE SUPABASE INTEGRATION STATUS & ROADMAP GUIDE */}
      <div className="bg-[#0b0b0b] border border-orange-500/20 rounded-2xl overflow-hidden p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-orange-500/10 text-brand-orange-500 shrink-0">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Status Hubungan Database Supabase</h3>
              <p className="text-slate-400 text-xs mt-0.5">Konfigurasi Sinkronisasi Cloud, Skema SQL, dan Hosting Vercel.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {db.isSupabaseConfigured() && !isDemoMode ? (
              <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 border border-emerald-500/20 rounded-full font-mono text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AKTIF (TERHUBUNG KE SUPABASE)</span>
              </span>
            ) : isDemoMode ? (
              <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 px-3.5 py-1.5 border border-amber-500/20 rounded-full font-mono text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>DEMO MODE (LOCAL STORAGE)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 bg-red-500/10 text-red-400 px-3.5 py-1.5 border border-red-500/20 rounded-full font-mono text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>SUPABASE WAJIB DIKONFIGURASI</span>
              </span>
            )}
            
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-slate-300 border border-dark-600 cursor-pointer transition select-none"
            >
              {showGuide ? 'Sembunyikan Panduan' : 'Tampilkan Solusi & Petunjuk (FAQ)'}
            </button>
          </div>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* COLUMN 1: WHAT TO DO IN SUPABASE */}
            <div className="space-y-4 bg-dark-900/40 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center space-x-2.5">
                <span className="text-brand-orange-500 text-xs font-bold px-2 py-0.5 rounded bg-brand-orange-500/10 font-mono">STEP 1</span>
                <h4 className="text-sm font-bold text-white">Apa yang harus saya lakukan di Supabase?</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supabase membutuhkan tabel, policy RLS, dan user Auth. Jalankan SQL di bawah ini, lalu buat akun admin lewat Supabase Authentication untuk login dashboard.
              </p>
              
              <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1.5 pl-1.5 font-medium">
                <li>Buka dashboard proyek Anda di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-orange-400 hover:underline inline-flex items-center">Supabase <ExternalLink className="w-3 h-3 ml-0.5" /></a></li>
                <li>Klik menu <strong className="text-slate-200">SQL Editor</strong> di bilah navigasi sebelah kiri.</li>
                <li>Klik <strong className="text-slate-200">New Query</strong>, lalu paste-kan seluruh kode SQL di bawah ini.</li>
                <li>Klik tombol <strong className="text-emerald-400">Run</strong> di pojok kanan bawah.</li>
              </ol>

              {/* SQL box */}
              <div className="relative group">
                <div className="absolute top-2.5 right-2.5 z-10">
                  <button
                    onClick={() => handleCopy(supabaseSetupSql, 'sql')}
                    className="p-1.5 bg-dark-900 border border-dark-600 hover:bg-dark-850 rounded text-slate-400 hover:text-white transition flex items-center space-x-1.5 text-[10px] cursor-pointer"
                  >
                    {copiedText === 'sql' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SQL</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="p-3 bg-black/60 border border-white/5 rounded-xl font-mono text-[9px] text-slate-300 max-h-[180px] overflow-y-auto leading-relaxed scrollbar-thin whitespace-pre-wrap">
{supabaseSetupSql}
                </pre>
              </div>
              <div className="flex items-start space-x-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-amber-400 leading-relaxed font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>CATATAN RLS: RLS harus tetap aktif. Public site hanya membaca project yang ditandai publik, sedangkan data dashboard dibatasi untuk user Supabase yang sudah login.</p>
              </div>
            </div>

            {/* COLUMN 2: WHY VERCEL IS NOT CONNECTING */}
            <div className="space-y-4 bg-dark-900/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-2.5">
                  <span className="text-brand-orange-500 text-xs font-bold px-2 py-0.5 rounded bg-brand-orange-500/10 font-mono">STEP 2</span>
                  <h4 className="text-sm font-bold text-white">Kenapa ketika di-deploy ke Vercel tidak connect?</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ketika Anda mengunggah (deploy) aplikasi di Vercel, Vercel **tidak akan membaca file .env lokal Anda**. Anda harus memasukkan variabel lingkungan secara manual di panel Vercel. 
                </p>
                
                <h5 className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">Variabel Produksi Yang WAJIB Dimasukkan:</h5>
                
                <div className="space-y-2.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-lg border border-white/5">
                    <div>
                      <span className="text-brand-orange-400 font-bold block">VITE_SUPABASE_URL</span>
                      <span className="text-[9px] text-slate-500">Nilai URL Supabase proyek Anda</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VITE_SUPABASE_URL', 'v1')}
                      className="text-slate-500 hover:text-white transition px-2 py-0.5 rounded border border-white/5 hover:bg-dark-850 inline-flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedText === 'v1' ? 'Tersalin' : 'Copy Key'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-lg border border-white/5">
                    <div>
                      <span className="text-brand-orange-400 font-bold block">VITE_SUPABASE_ANON_KEY</span>
                      <span className="text-[9px] text-slate-500">Kunci anonim proyek Supabase Anda</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VITE_SUPABASE_ANON_KEY', 'v2')}
                      className="text-slate-500 hover:text-white transition px-2 py-0.5 rounded border border-white/5 hover:bg-dark-850 inline-flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedText === 'v2' ? 'Tersalin' : 'Copy Key'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-lg border border-white/5">
                    <div>
                      <span className="text-brand-orange-400 font-bold block">SUPABASE_SERVICE_ROLE_KEY</span>
                      <span className="text-[9px] text-slate-500">Opsional server-side untuk insert order yang lebih stabil</span>
                    </div>
                    <button
                      onClick={() => handleCopy('SUPABASE_SERVICE_ROLE_KEY', 'v3')}
                      className="text-slate-500 hover:text-white transition px-2 py-0.5 rounded border border-white/5 hover:bg-dark-850 inline-flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedText === 'v3' ? 'Tersalin' : 'Copy Key'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-lg border border-white/5">
                    <div>
                      <span className="text-brand-orange-400 font-bold block">OWNER_EMAIL</span>
                      <span className="text-[9px] text-slate-500">Alamat email owner penerima notifikasi Resend</span>
                    </div>
                    <button
                      onClick={() => handleCopy('OWNER_EMAIL', 'v4')}
                      className="text-slate-500 hover:text-white transition px-2 py-0.5 rounded border border-white/5 hover:bg-dark-850 inline-flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedText === 'v4' ? 'Tersalin' : 'Copy Key'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-black/50 rounded-lg border border-white/5">
                    <div>
                      <span className="text-brand-orange-400 font-bold block">VITE_DEMO_MODE</span>
                      <span className="text-[9px] text-slate-500">Biarkan false di produksi; true hanya untuk sandbox lokal</span>
                    </div>
                    <button
                      onClick={() => handleCopy('VITE_DEMO_MODE=false', 'v5')}
                      className="text-slate-500 hover:text-white transition px-2 py-0.5 rounded border border-white/5 hover:bg-dark-850 inline-flex items-center gap-1 cursor-pointer select-none"
                    >
                      {copiedText === 'v5' ? 'Tersalin' : 'Copy Value'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                <p className="text-[11px] text-emerald-400 leading-relaxed font-semibold">
                  ⚠️ PENTING: Vite membuang variabel environment dari client-side apabila tidak diawali dengan prefix <code className="bg-black/50 px-1 py-0.5 rounded text-white text-[10px]">VITE_</code>. 
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-2 font-medium">
                  Setelah menyimpan variabel-variabel tersebut di menu <strong className="text-slate-300">Settings &gt; Environment Variables</strong> proyek Vercel Anda, Anda <strong className="text-white">HARUS melakukan re-deploy</strong> (mengeklik tombol Deploy ulang di dashboard Vercel) agar Vercel membangun ulang file statis produksi React yang sudah diinjeksi dengan variabel tersebut!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: INCOMING LEADS/ORDERS FROM THE LANDING PAGE */}
      <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-dark-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-brand-orange-500 animate-bounce" />
            <h3 className="text-base font-bold text-white">Leads Masuk Dari Landing Page</h3>
          </div>
          <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
            {orders.length} TOTAL INBOX
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Belum ada order masuk</p>
            <p className="text-xs">Form order yang diisi pada halaman utama publik akan tercatat secara langsung di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                  <th className="p-4">Tanggal Masuk</th>
                  <th className="p-4">Profil Klien</th>
                  <th className="p-4">Layanan & Budget</th>
                  <th className="p-4">Deskripsi Request</th>
                  <th className="p-4">Status Leads</th>
                  <th className="p-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-650/40">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-dark-850/40 transition">
                    <td className="p-4 font-mono text-slate-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'Baru saja'}
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="font-bold text-white text-sm">{o.full_name}</div>
                      <div className="flex flex-col space-y-0.5 text-slate-400 text-[10px]">
                        <span className="flex items-center space-x-1.5">
                          <Phone className="w-3 h-3 text-brand-orange-500" />
                          <span>{o.whatsapp}</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{o.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="font-semibold text-white">{o.website_type}</div>
                      <div className="text-brand-orange-400 font-mono text-[10px] font-bold">{o.budget}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">{o.description}</p>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Deadline: {o.deadline}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                        o.status === 'new' 
                          ? 'bg-brand-orange-600/15 text-brand-orange-500' 
                          : o.status === 'contacted'
                          ? 'bg-amber-500/15 text-amber-500'
                          : o.status === 'deal'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-700/15 text-slate-400'
                      }`}>
                        {o.status === 'new' ? 'Baru' : o.status === 'contacted' ? 'Diskusi' : o.status === 'deal' ? 'Deal' : 'Rejected'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Interactive state actions */}
                      <div className="inline-flex items-center gap-1 bg-dark-900 border border-dark-600 p-1 rounded-lg">
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'contacted')}
                          title="Tandai Sedang Dihubungi"
                          className={`p-1.5 rounded transition cursor-pointer ${o.status === 'contacted' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'deal')}
                          title="Deal / Mulai Project"
                          className={`p-1.5 rounded transition cursor-pointer ${o.status === 'deal' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, 'rejected')}
                          title="Tolak Leads"
                          className={`p-1.5 rounded transition cursor-pointer ${o.status === 'rejected' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* WhatsApp trigger anchor */}
                      <a
                        href={`https://wa.me/${o.whatsapp.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(o.full_name)}%2C%20saya%20Owner%20dari%20Simpluse%20Web%20Project%20ingin%20mengonfirmasi%20kebutuhan%20website%20Anda...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-[10px] text-brand-orange-500 hover:underline hover:text-brand-orange-600 font-semibold"
                      >
                        Hubungi via WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: RECENT PROJECTS WITH QUICK VIEW EDIT */}
      <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-dark-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-orange-500" />
            <h3 className="text-base font-bold text-white">Daftar Proyek Klien Terbaru</h3>
          </div>
          <button
            onClick={() => onNavigate('#/dashboard/projects')}
            className="text-xs transition text-brand-orange-500 hover:text-brand-orange-650 flex items-center space-x-1 font-bold"
          >
            <span>Semua Proyek ({projects.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <LayoutDashboard className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Belum ada proyek ditambahkan</p>
            <p className="text-xs">Klik tombol "Buat Proyek Baru" di atas untuk menambahkan portofolio klien.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                  <th className="p-4">Klien/Perusahaan</th>
                  <th className="p-4">Nama Proyek</th>
                  <th className="p-4">Mulai & Deadline</th>
                  <th className="p-4">Nilai Project</th>
                  <th className="p-4">Status Proyek</th>
                  <th className="p-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-650/40 text-slate-300">
                {projects.slice(0, 5).map((p) => {
                  const sisa = p.total_price - p.dp_paid;
                  return (
                    <tr key={p.id} className="hover:bg-dark-850/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{p.client_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.client_wa}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{p.project_name}</div>
                        {p.is_public ? (
                          <span className="inline-block mt-1 text-[9px] font-mono tracking-wide bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20 rounded">
                            Tentu di Portfolio Publik
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] font-mono tracking-wide bg-dark-800 text-slate-500 px-1.5 py-0.5 border border-dark-600 rounded">
                            Hanya Internal
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1 font-mono">
                          <span className="text-slate-400">Dimulai: {p.start_date}</span>
                          <span className="text-slate-500">Deadline: {p.deadline}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-200 font-mono">{rupiah(p.total_price)}</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">DP: {rupiah(p.dp_paid)}</div>
                        {sisa > 0 && <div className="text-[10px] text-red-400 font-mono mt-0.5">Inv: {rupiah(sisa)}</div>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[9px] font-mono tracking-wide font-bold rounded uppercase ${
                          p.status === 'ongoing' 
                            ? 'bg-amber-500/15 text-amber-500' 
                            : p.status === 'done'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : p.status === 'maintenance'
                            ? 'bg-brand-orange-500/15 text-brand-orange-500'
                            : 'bg-slate-700/15 text-slate-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigate(`#/dashboard/projects/edit/${p.id}`)}
                          className="bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-600 transition text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Ubah Detil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
