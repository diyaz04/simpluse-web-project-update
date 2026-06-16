import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { Project, ProjectScreenshot, WebsiteCategory } from '../types';
import { ExternalLink, Globe, LayoutGrid, Layers, Monitor, ShoppingBag, GraduationCap, ArrowLeft, Images, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PortfolioPageProps {
  onNavigate: (route: string) => void;
}

type FilterCategory = 'All' | WebsiteCategory;

export default function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  const getProjectGallery = (project: Project): ProjectScreenshot[] => {
    if (project.screenshot_gallery && project.screenshot_gallery.length > 0) {
      return project.screenshot_gallery;
    }

    return project.screenshot_url
      ? [{ url: project.screenshot_url, caption: project.description || '' }]
      : [];
  };

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailImageIndex(0);
  };

  const shiftDetailImage = (direction: 1 | -1) => {
    if (!selectedProject) return;

    const gallery = getProjectGallery(selectedProject);
    if (gallery.length <= 1) return;

    setDetailImageIndex((current) => (current + direction + gallery.length) % gallery.length);
  };

  const handleDetailTouchEnd = (x: number) => {
    if (touchStartX.current === null) return;

    const diff = touchStartX.current - x;
    touchStartX.current = null;

    if (Math.abs(diff) < 40) return;
    shiftDetailImage(diff > 0 ? 1 : -1);
  };

  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedProject(null);
      } else if (event.key === 'ArrowRight') {
        shiftDetailImage(1);
      } else if (event.key === 'ArrowLeft') {
        shiftDetailImage(-1);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject, detailImageIndex]);

  const applyFilter = (filter: FilterCategory) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(p => {
        if (p.website_category) {
          return p.website_category === filter;
        }

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
          {filteredProjects.map((p) => {
            const gallery = getProjectGallery(p);

            return (
              <div 
                key={p.id}
                className="bg-[#111111]/75 backdrop-blur-md border border-white/10 hover:border-[#F97316]/30 rounded-2xl overflow-hidden group flex flex-col justify-between transition-all duration-300 shadow-2xl"
              >
              <div>
                {/* Showcase Thumbnail */}
                <button
                  type="button"
                  onClick={() => openProjectDetail(p)}
                  className="relative aspect-video bg-dark-800 w-full overflow-hidden cursor-pointer text-left"
                  title="Lihat detail portfolio"
                >
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
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-black/65 text-white text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-full border border-white/10">
                    <Images className="w-3.5 h-3.5 text-[#F97316]" />
                    {gallery.length} gambar
                  </span>
                </button>

                {/* Body Content */}
                <div className="p-6">
                  {/* Public Title */}
                  <h3 className="text-xl font-bold text-white group-hover:text-[#F97316] transition-colors line-clamp-1 mb-2 tracking-tight">
                    {p.public_name || p.project_name}
                  </h3>
                  {p.website_category && (
                    <span className="inline-block mb-3 bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 text-[9px] font-mono tracking-wide px-2 py-1 rounded uppercase font-bold">
                      {p.website_category}
                    </span>
                  )}
                  
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

                  <button
                    type="button"
                    onClick={() => openProjectDetail(p)}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F97316]/40 text-white text-xs font-extrabold px-4 py-2.5 transition cursor-pointer"
                  >
                    <Images className="w-4 h-4 text-[#F97316]" />
                    <span>Lihat Detail & Galeri</span>
                  </button>
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
            );
          })}
        </div>
      )}

      {selectedProject && (() => {
        const gallery = getProjectGallery(selectedProject);
        const activeImage = gallery[detailImageIndex] || {
          url: selectedProject.screenshot_url,
          caption: selectedProject.description || ''
        };

        return (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md px-4 py-6 sm:p-8 flex items-center justify-center"
            onClick={() => setSelectedProject(null)}
          >
            <div
              className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-20 bg-[#0b0b0b]/95 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-[0.2em]">Detail Portfolio</p>
                  <h3 className="text-white text-base sm:text-xl font-extrabold tracking-tight truncate">
                    {selectedProject.public_name || selectedProject.project_name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Tutup detail"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-0">
                <div className="bg-black">
                  <div
                    className="relative aspect-[16/10] sm:aspect-video min-h-[260px] max-h-[68vh] overflow-hidden"
                    onTouchStart={(event) => {
                      touchStartX.current = event.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(event) => {
                      handleDetailTouchEnd(event.changedTouches[0]?.clientX ?? 0);
                    }}
                  >
                    <img
                      src={activeImage.url}
                      alt={activeImage.caption || selectedProject.public_name || selectedProject.project_name}
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      referrerPolicy="no-referrer"
                    />

                    {gallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => shiftDetailImage(-1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-[#F97316] text-white hover:text-black transition cursor-pointer"
                          title="Gambar sebelumnya"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => shiftDetailImage(1)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-[#F97316] text-white hover:text-black transition cursor-pointer"
                          title="Gambar berikutnya"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <div className="absolute left-4 bottom-4 right-4 flex items-end justify-between gap-3 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 bg-black/75 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border border-white/10">
                        <Images className="w-3.5 h-3.5 text-[#F97316]" />
                        {detailImageIndex + 1} / {Math.max(gallery.length, 1)}
                      </span>
                    </div>
                  </div>

                  {gallery.length > 1 && (
                    <div className="p-4 border-t border-white/10 bg-[#050505] overflow-x-auto">
                      <div className="flex gap-2 min-w-max">
                        {gallery.map((shot, index) => (
                          <button
                            key={`${shot.url}-${index}`}
                            type="button"
                            onClick={() => setDetailImageIndex(index)}
                            title={shot.caption || `Gambar ${index + 1}`}
                            className={`w-24 sm:w-28 aspect-video rounded-lg overflow-hidden border transition cursor-pointer ${
                              detailImageIndex === index
                                ? 'border-[#F97316] ring-2 ring-[#F97316]/25'
                                : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                            }`}
                          >
                            <img
                              src={shot.url}
                              alt={shot.caption || `Screenshot ${index + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside className="p-5 sm:p-6 space-y-5 bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-white/10">
                  <div>
                    <h4 className="text-white font-extrabold text-lg tracking-tight mb-2">
                      {selectedProject.public_name || selectedProject.project_name}
                    </h4>
                    {selectedProject.website_category && (
                      <span className="inline-block mb-3 bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 text-[9px] font-mono tracking-wide px-2 py-1 rounded uppercase font-bold">
                        {selectedProject.website_category}
                      </span>
                    )}
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {selectedProject.description || 'Tidak ada deskripsi publik.'}
                    </p>
                  </div>

                  {activeImage.caption && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Keterangan Gambar</p>
                      <p className="text-slate-200 text-sm leading-relaxed">{activeImage.caption}</p>
                    </div>
                  )}

                  {selectedProject.tech_stack.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Teknologi</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech_stack.map((tech, index) => (
                          <span
                            key={`${tech.service}-${index}`}
                            className="bg-white/5 border border-white/10 text-slate-300 text-[10px] px-2.5 py-1 rounded-md font-mono"
                          >
                            {tech.service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 pt-2">
                    {selectedProject.live_url && (
                      <a
                        href={selectedProject.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-black text-xs font-extrabold px-5 py-3 transition"
                      >
                        <span>Buka Website</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProject(null)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-extrabold px-5 py-3 transition cursor-pointer"
                    >
                      Tutup Detail
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
