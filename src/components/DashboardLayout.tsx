import React from 'react';
import { db } from '../lib/db';
import { 
  LayoutDashboard, 
  FolderGit2, 
  PlusCircle, 
  Home, 
  LogOut, 
  CloudCheck, 
  AlertTriangle,
  FlameKindling,
  Server
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function DashboardLayout({ children, currentRoute, onNavigate }: DashboardLayoutProps) {
  const user = db.getCurrentUser();
  const isSupabase = db.isSupabaseConfigured();
  const isDemoMode = db.isDemoMode();

  const handleLogout = () => {
    db.logout();
    onNavigate('#/dashboard/login');
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '#/dashboard' },
    { label: 'Kelola Project', icon: FolderGit2, path: '#/dashboard/projects' },
    { label: 'Tambah Baru', icon: PlusCircle, path: '#/dashboard/projects/new' },
  ];

  return (
    <div id="dashboard-shell" className="min-h-screen bg-[#070707] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-[#0C0C0C] border-r border-white/5 flex flex-col justify-between p-4 shrink-0 md:sticky md:top-0 md:h-screen">
        <div>
          {/* Header */}
          <div className="flex items-center space-x-2.5 px-3 py-5 border-b border-white/5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)] overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/d/1cAk12EZRnreW8c7SOc2V7rJO4M0c3Dq_" 
                alt="Simpluse Logo" 
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">Simpluse Admin</span>
              <span className="text-[9px] block font-mono text-[#F97316] uppercase tracking-widest leading-none mt-0.5">Console v1.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase transition cursor-pointer border ${
                    isActive 
                      ? 'bg-[#F97316] border-[#F97316] text-black shadow-[0_0_15px_rgba(249,115,22,0.25)] font-extrabold' 
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-6 select-none text-left">
          {/* Supabase Status Panel */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center space-x-2 mb-1.5">
              {isSupabase && !isDemoMode ? (
                <Server className="w-4 h-4 text-emerald-400" />
              ) : isDemoMode ? (
                <FlameKindling className="w-4 h-4 text-amber-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs font-bold text-slate-200">
                {isSupabase && !isDemoMode ? 'Supabase Connected' : isDemoMode ? 'Demo Mode' : 'Supabase Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {isSupabase && !isDemoMode
                ? 'Data dan auth berjalan melalui Supabase.'
                : isDemoMode
                ? 'Data contoh tersimpan di browser dan hanya aktif karena VITE_DEMO_MODE=true.'
                : 'Isi konfigurasi Supabase untuk menjalankan mode produksi.'}
            </p>
          </div>

          {/* Navigation Redirects */}
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('#/')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="font-semibold">Lihat Website Publik</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-full transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-semibold">Log Out Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
