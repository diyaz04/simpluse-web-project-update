import React from 'react';
import { Rocket, Phone, Mail, MapPin, Globe, ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const env = (import.meta as any).env || {};
  const isDemoMode = String(env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
  const publicContactEmail = env.VITE_PUBLIC_CONTACT_EMAIL || (isDemoMode ? 'demo-contact@example.test' : '');

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="bg-[#050505] border-t border-white/10 pt-16 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: About */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4 cursor-pointer group" onClick={() => onNavigate('#/')}>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)] overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/d/1cAk12EZRnreW8c7SOc2V7rJO4M0c3Dq_" 
                  alt="Simpluse Logo" 
                  className="w-full h-full object-contain p-1"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white group-hover:text-[#F97316] transition-colors font-sans">Simpluse</span>
                <span className="text-[9px] block text-slate-500 -mt-1 font-mono tracking-wider uppercase">Web Project</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
              Kami menghadirkan solusi pembuatan website profesional terjangkau untuk bisnis, UMKM, sekolah, portofolio pribadi, dan perusahaan dengan desain modern & premium serta performa optimal yang siap bersaing di era digital.
            </p>
          </div>

          {/* Col 2: Services / Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-widest uppercase mb-4 font-mono">Layanan Kami</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('#/order')} className="hover:text-[#F97316] transition text-left cursor-pointer">
                  Landing Page UMKM
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('#/order')} className="hover:text-[#F97316] transition text-left cursor-pointer">
                  Company Profile Perusahaan
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('#/order')} className="hover:text-[#F97316] transition text-left cursor-pointer">
                  Website Sekolah & Portal Akademik
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('#/order')} className="hover:text-[#F97316] transition text-left cursor-pointer">
                  Toko Online Modern (E-Commerce)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-widest uppercase mb-4 font-mono">Hubungi Kami</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                <a href="https://wa.me/6285121535821" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  085121535821 (WA Partner)
                </a>
              </li>
              {publicContactEmail && (
                <li className="flex items-start space-x-2.5">
                  <Mail className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                  <a href={`mailto:${publicContactEmail}`} className="hover:text-white transition break-all">
                    {publicContactEmail}
                  </a>
                </li>
              )}
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                <span>Bandung, Jawa Barat, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-white/10 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Simpluse Web Project. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <button onClick={() => onNavigate('#/dashboard/login')} className="hover:text-slate-300 transition cursor-pointer font-mono text-[9px] tracking-wider">
              CONSOLE LOGIN
            </button>
            <button 
              onClick={handleScrollTop}
              className="p-2 rounded-full bg-white/5 hover:bg-[#F97316] hover:text-black transition cursor-pointer border border-[#111]"
              title="Kembali ke atas"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
