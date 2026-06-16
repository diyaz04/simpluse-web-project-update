import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Project } from '../types';
import { ExternalLink, Globe, LayoutGrid, Layers, Monitor, ShoppingBag, GraduationCap, ArrowLeft } from 'lucide-react';

interface PortfolioPageProps {
  onNavigate: (route: string) => void;
}

type FilterCategory = 'All' | 'Landing Page' | 'Company Profile' | 'Sekolah' | 'Toko Online';

export default function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const publics = await db.getPublicProjects();
        setProjects(publics);
        setFilteredProjects(publics);
      } catch (e) {
        console.error('Failed to load portfolio database:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const applyFilter = (filter: FilterCategory) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(p => {
        const nameAndDesc = ((p.public_name || p.project_name) + ' ' + p.description).toLowerCase();
        
        if (filter === 'Landing Page') {
          return nameAndDesc.includes('landing') || nameAndDesc.includes('landing page') || nameAndDesc.includes('promo');
        }
        if (filter === 'Company Profile') {
          return nameAndDesc.includes('company') || nameAndDesc.includes('profile') || nameAndDesc.includes('cv ') || nameAndDesc.includes('corporate');
        }
        if (filter === 'Sekolah') {
          return nameAndDesc.includes('sekolah') || nameAndDesc.includes('akademik') || nameAndDesc.includes('yayasan') || nameAndDesc.includes('sma') || nameAndDesc.includes('portal');
        }
        if (filter === 'Toko Online') {
          return nameAndDesc.includes('toko') || nameAndDesc.includes('online') || nameAndDesc.includes('boutique') || nameAndDesc.includes('commerce') || nameAndDesc.includes('shop');
        }
        return false;
      });
      setFilteredProjects(filtered);
    }
  };

  const categories: { label: FilterCategory; icon: any }[] = [
    { label: 'All', icon: LayoutGrid },
    { label: 'Landing Page', icon: Monitor },
    { label: 'Company Profile', icon: Layers },
    { label: 'Sekolah', icon: GraduationCap },
    { label: 'Toko Online', icon: ShoppingBag },
  ];

  return (
    <div id="portfolio-page" className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none select-none" />

      {/* Back button and page header */}
      <div className="mb-12 relative z-10">
        <button
          onClick={() => onNavigate('#/')}
          className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition cursor-pointer mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Kembali ke Home</span>
        </button>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Portfolio Proyek <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FCD34D]">Kami</span></h1>
        <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl leading-relaxed">
          Eksplorasi karya nyata terbaik kami dalam merancang dan memprogram situs konversi tinggi, aman, dan berkelas bagi para mitra klien kami.
        </p>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap items-center gap-2 mb-12 overflow-x-auto pb-2 select-none relative z-10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeFilter === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => applyFilter(cat.label)}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition cursor-pointer border ${
                isSelected 
                  ? 'bg-[#F97316] border-[#F97316] text-black shadow-[0_0_15px_rgba(249,115,22,0.35)] font-extrabold' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cat.label === 'All' ? 'Semua Proyek' : cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* PORTFOLIO GRID */}
      {loading ? (
        <div className="text-center py-24 relative z-10">
          <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-mono text-sm leading-6">Menyelaraskan data portfolio. Mohon tunggu...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#111111]/60 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center max-w-lg mx-auto relative z-10">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-1">Belum Ada Portfolio '{activeFilter}'</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Kategori ini belum terisi, silakan tambah project baru berkategori terkait lewat Dashboard Admin Simpluse.
          </p>
          <button
            onClick={() => applyFilter('All')}
            className="text-xs bg-white/5 hover:bg-[#F97316] text-[#F97316] hover:text-black border border-[#F97316]/30 font-bold px-4 py-2.5 rounded-full cursor-pointer transition"
          >
            Kembali ke Semua Proyek
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              className="bg-[#111111]/75 backdrop-blur-md border border-white/10 hover:border-[#F97316]/30 rounded-2xl overflow-hidden group flex flex-col justify-between transition-all duration-300 shadow-2xl"
            >
              <div>
                {/* Showcase Thumbnail */}
                <div className="relative aspect-video bg-dark-800 w-full overflow-hidden">
                  <img 
                    src={p.screenshot_url} 
                    alt={p.public_name} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-[#0A0A0A]/5 to-transparent pointer-events-none" />
                </div>

                {/* Body Content */}
                <div className="p-6">
                  {/* Public Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-[#F97316] transition-colors line-clamp-1 mb-2 tracking-tight">
                    {p.public_name || p.project_name}
                  </h3>
                  
                  {/* Detailed Description */}
                  <p className="text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                    {p.description || 'Proyek premium modern yang dirancang untuk memperkuat penetrasi marketing berbasis digital.'}
                  </p>

                  {/* Tech stack used tags */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold tracking-widest">Teknologi Tersemat</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech_stack && p.tech_stack.length > 0 ? (
                        p.tech_stack.map((t, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="bg-white/5 border border-white/5 text-slate-300 text-[10px] px-2.5 py-1 rounded-md font-mono"
                          >
                            {t.service}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">React + Tailwind v4 CSS</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action area */}
              {p.live_url && (
                <div className="p-6 pt-0 border-t border-white/5">
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#F97316] hover:text-[#ea580c] pt-4 transition-colors"
                  >
                    <span>Kunjungi Live Project</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
