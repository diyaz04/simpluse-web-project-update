import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { Project, ProjectScreenshot } from '../types';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Layers, 
  ExternalLink, 
  PhoneCall, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Monitor, 
  GraduationCap, 
  ShoppingBag,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  Users2,
  Workflow,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Images
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectImages, setActiveProjectImages] = useState<Record<string, number>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await db.getPublicProjects();
        const publics = data.slice(0, 3);
        setFeaturedProjects(publics);
      } catch (e) {
        console.error('Failed to load projects for landing page preview:', e);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

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

  const getProjectGallery = (project: Project): ProjectScreenshot[] => {
    if (project.screenshot_gallery && project.screenshot_gallery.length > 0) {
      return project.screenshot_gallery;
    }

    return project.screenshot_url
      ? [{ url: project.screenshot_url, caption: project.description || '' }]
      : [];
  };

  const openProjectDetail = (project: Project, imageIndex = 0) => {
    const gallery = getProjectGallery(project);
    setSelectedProject(project);
    setDetailImageIndex(Math.min(imageIndex, Math.max(gallery.length - 1, 0)));
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

  const services = [
    {
      title: 'Landing Page',
      icon: Monitor,
      desc: 'Satu halaman ultra-fokus, super cepat, didesain khusus untuk meningkatkan konversi penjualan dan leads bisnis Anda.',
      features: ['Modern Desain Satu Halaman', 'Integrasi WhatsApp & Kontak', 'Responsive Mobile-Optimized', 'SEO Friendly Dasar'],
      price: 'Mulai dari Rp 1.500.000',
      badge: 'Terpopuler'
    },
    {
      title: 'Company Profile',
      icon: Layers,
      desc: 'Situs multi-halaman profesional untuk memamerkan visi-misi, sejarah, dan nilai produk perusahaan Anda ke investor & klien.',
      features: ['Lengkap halaman Profile, Keunggulan', 'Galeri Portfolio / Proyek', 'Sertifikat & Mitra Bisnis', 'Domain & Keamanan Premium'],
      price: 'Mulai dari Rp 3.500.000',
      badge: 'Recomended'
    },
    {
      title: 'Web Sekolah',
      icon: GraduationCap,
      desc: 'Media portal informasi dan transparansi akademik, lengkap dengan profil sekolah, pengumuman, dan pendaftaran online (PPDB).',
      features: ['Portal Informasi & PPDB Mandiri', 'Download Modul Pembelajaran', 'Direktori Guru & Siswa', 'Akses Admin Operator'],
      price: 'Mulai dari Rp 6.000.000',
      badge: 'Instansi'
    },
    {
      title: 'Toko Online (E-Commerce)',
      icon: ShoppingBag,
      desc: 'Sistem e-commerce mandiri tanpa repot potongan biaya marketplace, lengkap dengan billing transaksi, payment gateway & ekspedisi.',
      features: ['Sistem Keranjang & Checkout', 'Kalkulasi Ongkir Otomatis', 'Integrasi QRIS & Virtual Account', 'Dashboard Penjualan Admin'],
      price: 'Mulai dari Rp 8.000.000',
      badge: 'Skala Menengah'
    }
  ];

  const valueProps = [
    {
      title: 'Premium & Bebas Templat Murahan',
      desc: 'Setiap baris kode ditulis rapi dan disesuaikan khusus dengan karakter bisnis Anda, bukan bersumber dari template salinan gratis yang lambat.',
      icon: Sparkles
    },
    {
      title: 'Sistem Administrasi Transparan',
      desc: 'Anda mendapatkan laporan teknis yang lengkap melalui dashboard kami mengenai tech stack, akun hosting, domain, data order, hingga sisa tagihan.',
      icon: FileSpreadsheet
    },
    {
      title: 'Dukungan WhatsApp 24 Jam',
      desc: 'Tidak perlu kesulitan mengajukan tiket dukungan yang rumit. Hubungi langsung kami via WhatsApp saat ada kendala serius pada situs Anda.',
      icon: PhoneCall
    },
    {
      title: 'Kecepatan & Performa Tinggi',
      desc: 'Kami menggunakan modern tech stack terbaik generasi saat ini (Next.js/React, Tailwind CSS) untuk memastikan load website instan.',
      icon: Flame
    }
  ];

  const steps = [
    {
      num: '1',
      title: 'Kirim Data & Kebutuhan',
      desc: 'Isi formulir order kami yang ringkas dan jelaskan seperti apa gambaran website impian Anda.'
    },
    {
      num: '2',
      title: 'Diskusi & Konsultasi Gratis',
      desc: 'Kami akan menghubungi Anda dalam waktu cepat lewat WhatsApp untuk meluruskan detail teknis bisnis Anda.'
    },
    {
      num: '3',
      title: 'Deal & Pembayaran DP',
      desc: 'Setelah sepakat mengenai estimasi harga dan jadwal rilis, proses pengerjaan dimulai setelah Anda membayar DP.'
    },
    {
      num: '4',
      title: 'Proses Coding & Feedback',
      desc: 'Kami memprogram website Anda di server staging kami sehingga Anda bisa memantau perkembangannya secara live.'
    },
    {
      num: '5',
      title: 'Pelunasan & Launching',
      desc: 'Setelah testing selesai dan sisa tagihan terlunasi, kami membantu proses hosting agar website resmi go-live.'
    }
  ];

  return (
    <div id="landing-page" className="relative pt-24 pb-16 overflow-hidden">
      
      {/* SECTION 1: HERO */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow absolute decorations */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[700px] h-[350px] md:h-[700px] bg-[#F97316]/10 rounded-full blur-[140px] pointer-events-none select-none animate-pulse-glow" />
        <div className="absolute top-[40%] right-[-100px] w-[300px] h-[300px] bg-[#FCD34D]/5 rounded-full blur-[100px] pointer-events-none select-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative inline-flex items-center space-x-2.5 bg-[#F97316]/10 border border-[#F97316]/20 px-4 py-1.5 rounded-full mb-8 cursor-pointer"
          onClick={() => onNavigate('#/order')}
        >
          <span className="w-2 h-2 bg-[#F97316] rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-[#F97316] font-mono tracking-widest uppercase">
            Promo website diskon up to 20% bulan ini
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] max-w-4xl"
        >
          Kami Membangun Website <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FCD34D] drop-shadow-[0_0_15px_rgba(249,115,22,0.15)]">Premium Berperforma Tinggi</span> Untuk Bisnis Anda
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed font-sans"
        >
          Bantu brand Anda tampil profesional, kredibel, dan mudah dijangkau calon pelanggan lewat produk karya digital yang mutakhir, elegan, dan siap merajai pasar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4 justify-center w-full sm:w-auto"
        >
          <button
            onClick={() => onNavigate('#/order')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-black font-extrabold tracking-wide shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.55)] transform hover:-translate-y-0.5 transition duration-200 cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>Order Sekarang</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <button
            onClick={() => onNavigate('#/portfolio')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-bold transform hover:-translate-y-0.5 transition duration-200 cursor-pointer"
          >
            Lihat Portfolio
          </button>
        </motion.div>
      </section>

      {/* SECTION 2: SERVICES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 relative">
        <div className="absolute top-0 left-1/4 w-[250px] h-[250px] bg-[#F97316]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[#F97316] font-mono text-xs font-bold tracking-[0.2em] uppercase block mb-3">Our Services</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Kategori Website Yang Kami Sediakan</h2>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-md mx-auto">
            Menyediakan beraneka variasi arsitektur website profesional kelas dunia dengan skema harga bersahabat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <div 
                key={idx}
                className="immersive-glass immersive-glass-hover p-6 sm:p-8 rounded-2xl relative group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-[#F97316]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FCD34D] bg-[#FCD34D]/10 border border-[#FCD34D]/25 px-2.5 py-1 rounded-full">
                      {svc.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{svc.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{svc.desc}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {svc.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Investasi Mulai</span>
                    <span className="text-base font-extrabold text-[#FCD34D] font-mono">{svc.price}</span>
                  </div>
                  <button 
                    onClick={() => onNavigate('#/order')}
                    className="w-full sm:w-auto bg-white/5 hover:bg-[#F97316] text-slate-300 hover:text-black text-xs px-5 py-3 rounded-full border border-white/10 hover:border-[#F97316] font-extrabold transition duration-200 cursor-pointer shadow-[0_0_15px_transparent] hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                  >
                    Pesan {svc.title}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: WHY CHOOSE US */}
      <section className="py-24 bg-[#0A0A0A]/50 border-y border-white/10 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#F97316]/5 via-transparent to-transparent opacity-80 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Context Header */}
            <div>
              <span className="text-[#F97316] font-mono text-xs font-bold tracking-[0.2em] uppercase block mb-3">Mengapa Kami?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.15]">
                Kami Berkomitmen Menghasilkan Karya Software Berkualitas Tinggi
              </h2>
              <p className="text-slate-400 mt-6 text-sm sm:text-base leading-relaxed">
                Kami peduli dengan pertumbuhan bisnis Anda. Website bukan sekedar pajangan online, tapi mesin utama penyedia konversi prospek pemasaran.
              </p>
              <div className="mt-8">
                <a
                  href="https://wa.me/6285121535821?text=Halo%20Simpluse%2C%20saya%20ingin%20konsultasi%20website..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-[#F97316] hover:text-[#ea580c] font-bold text-sm transition-colors group"
                >
                  <span>Chat dengan Web Consultant</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Grid Advantages */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {valueProps.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <div key={idx} className="immersive-glass p-6 rounded-2xl hover:border-white/10 transition duration-300">
                    <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20 mb-5">
                      <Icon className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 tracking-tight">{val.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{val.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PORTFOLIO PREVIEW */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="absolute right-10 bottom-10 w-[200px] h-[200px] bg-[#FCD34D]/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16">
          <div>
            <span className="text-[#F97316] font-mono text-xs font-bold tracking-[0.2em] uppercase block mb-3">Our Work</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Eksplorasi Portfolio Terbaru</h2>
            <p className="text-slate-400 mt-3 text-sm max-w-lg">
              Lihat proyek terbaru milik klien partner kami yang telah diselesaikan dengan standar performa dan visual paling top.
            </p>
          </div>
          <button
            onClick={() => onNavigate('#/portfolio')}
            className="text-xs font-bold uppercase tracking-wider text-[#F97316] hover:text-[#ea580c] transition flex items-center space-x-1.5 mt-6 sm:mt-0 bg-[#F97316]/10 border border-[#F97316]/20 px-4 py-2 rounded-full cursor-pointer"
          >
            <span>Semua Proyek</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-xs">Memuat karya portofolio...</p>
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="immersive-glass rounded-2xl p-16 text-center max-w-2xl mx-auto">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-bold mb-2">Belum ada portofolio publik</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">Portofolio Anda yang ditoggle Publik di Dashboard akan muncul secara real-time di sini untuk memikat klien Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((p) => {
              const gallery = getProjectGallery(p);
              const activeIndex = Math.min(activeProjectImages[p.id] || 0, Math.max(gallery.length - 1, 0));
              const activeImage = gallery[activeIndex] || {
                url: p.screenshot_url,
                caption: p.description || ''
              };

              return (
                <div 
                  key={p.id}
                  className="bg-[#111111]/70 backdrop-blur-md border border-white/10 hover:border-[#F97316]/40 rounded-2xl overflow-hidden group flex flex-col justify-between transition-all duration-300"
                >
                <div>
                  {/* Thumbnail */}
                  <button
                    type="button"
                    onClick={() => openProjectDetail(p, activeIndex)}
                    className="relative aspect-video w-full overflow-hidden bg-dark-800 cursor-pointer text-left"
                    title="Lihat detail portfolio"
                  >
                    <img 
                      src={activeImage.url} 
                      alt={activeImage.caption || p.public_name || p.project_name} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/10 to-transparent opacity-90 pointer-events-none" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-black/65 text-white text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-full border border-white/10">
                      <Images className="w-3.5 h-3.5 text-[#F97316]" />
                      {gallery.length} gambar
                    </span>
                  </button>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#F97316] transition-colors line-clamp-1 mb-2">
                      {p.public_name || p.project_name}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6">
                      {p.description || 'Tidak ada deskripsi publik.'}
                    </p>

                    {activeImage.caption && (
                      <p className="text-[11px] text-slate-300 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3 mb-4">
                        {activeImage.caption}
                      </p>
                    )}

                    {gallery.length > 1 && (
                      <div className="grid grid-cols-5 gap-1.5 mb-5">
                        {gallery.map((shot, shotIndex) => (
                          <button
                            key={`${shot.url}-${shotIndex}`}
                            type="button"
                            onClick={() => setActiveProjectImages((current) => ({ ...current, [p.id]: shotIndex }))}
                            title={shot.caption || `Gambar ${shotIndex + 1}`}
                            className={`aspect-video rounded-lg overflow-hidden border cursor-pointer transition ${
                              activeIndex === shotIndex
                                ? 'border-[#F97316] ring-2 ring-[#F97316]/20'
                                : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                            }`}
                          >
                            <img
                              src={shot.url}
                              alt={shot.caption || `Screenshot ${shotIndex + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {p.tech_stack.slice(0, 3).map((tech, tIdx) => (
                        <span 
                          key={tIdx} 
                          className="bg-white/5 text-[9px] text-slate-300 px-2 py-0.5 rounded-md border border-white/5 font-mono"
                        >
                          {tech.service}
                        </span>
                      ))}
                      {p.tech_stack.length > 3 && (
                        <span className="text-[9px] text-[#F97316] font-mono px-1">
                          +{p.tech_stack.length - 3}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openProjectDetail(p, activeIndex)}
                      className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F97316]/40 text-white text-xs font-extrabold px-4 py-2.5 transition cursor-pointer"
                    >
                      <Images className="w-4 h-4 text-[#F97316]" />
                      <span>Lihat Detail & Galeri</span>
                    </button>
                  </div>
                </div>

                {/* Footer Action link */}
                {p.live_url && (
                  <div className="p-6 pt-0 border-t border-white/5">
                    <a
                      href={p.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 text-xs bg-[#F97316] hover:bg-[#ea580c] text-black px-4 py-2.5 rounded-full font-extrabold transition mt-4"
                    >
                      <span>Buka Website</span>
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    </a>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: ORDERING FLOW DETAIL */}
      <section className="py-24 bg-[#0A0A0A]/30 border-t border-white/10 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[400px] h-[300px] bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#F97316] font-mono text-xs font-bold tracking-[0.2em] uppercase block mb-3">Step By Step</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Mekanisme & Cara Pemesanan</h2>
            <p className="text-slate-400 mt-4 text-sm max-w-md mx-auto leading-relaxed">
              Kami merancang sistem pengerjaan yang sederhana, transparan & bebas khawatir bagi orang awam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Visual connector lines for desktop */}
            <div className="hidden md:block absolute top-[26px] left-[10%] right-[10%] h-[1px] bg-white/10 z-0 pointer-events-none" />

            {steps.map((st, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F97316] to-[#FCD34D] text-black font-black text-sm tracking-wider flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:scale-105 transition-transform font-mono">
                  {st.num}
                </div>
                <h3 className="text-white font-extrabold text-base mb-2 tracking-tight">{st.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-[#121212]/90 to-[#050505]/95 border border-white/10 p-10 sm:p-16 rounded-3xl text-center relative overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)]">
          {/* Abstract backdrop glow shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#F97316]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-[#FCD34D] font-mono text-xs font-bold tracking-[0.21em] uppercase block mb-4">LETS COLLABORATE</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
              Kembangkan Bisnis Anda dengan Website Keren Berkelas Dunia Hari Ini!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mt-6 leading-relaxed">
              Pesan sekarang untuk mendapatkan domain (.com/.id) serta hosting gratis berkecepatan tinggi selama 1 tahun penuh.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => onNavigate('#/order')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-black font-extrabold transform hover:-translate-y-0.5 transition duration-200 cursor-pointer shadow-[0_0_25px_rgba(249,115,22,0.35)] flex items-center justify-center space-x-1.5"
              >
                <span>Mulai Isi Form Pemesanan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              
              <a
                href="https://wa.me/6285121535821?text=Halo%2520Simpluse%2520Web%2520Project%2520..."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-extrabold border border-white/10 hover:border-white/20 transform hover:-translate-y-0.5 transition duration-200 cursor-pointer flex items-center justify-center space-x-2"
              >
                <PhoneCall className="w-4 h-4 text-[#F97316]" />
                <span>Konsultasi Telegram/WA</span>
              </a>
            </div>
          </div>
        </div>
      </section>

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
