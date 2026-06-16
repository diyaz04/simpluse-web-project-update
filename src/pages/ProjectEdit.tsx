import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { Project, TechStackCategory, TechStackItem, ProjectStatus } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Settings, 
  Briefcase, 
  Info, 
  FileText,
  User,
  HeartCrack,
  Link,
  Laptop
} from 'lucide-react';

interface ProjectEditProps {
  projectId?: string; // If undefined, we are in CREATE mode
  onNavigate: (route: string) => void;
}

export default function ProjectEdit({ projectId, onNavigate }: ProjectEditProps) {
  const isEditMode = !!projectId;
  const [loading, setLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // SECTION 1: Client Info
  const [clientName, setClientName] = useState('');
  const [clientWa, setClientWa] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // SECTION 2: Project Info
  const [projectName, setProjectName] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ongoing');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [dpPaid, setDpPaid] = useState<number>(0);

  // SECTION 3: Tech Stack List items
  const [techStack, setTechStack] = useState<TechStackItem[]>([]);

  // SECTION 4: Portfolio Settings
  const [isPublic, setIsPublic] = useState(false);
  const [publicName, setPublicName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [description, setDescription] = useState('');

  // Drag and drop uploader state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: TechStackCategory[] = [
    'Frontend',
    'Auth',
    'Database',
    'Storage',
    'Hosting',
    'Email Service',
    'Payment',
    'Other'
  ];

  // Load existing project details if in Edit mode
  useEffect(() => {
    if (isEditMode && projectId) {
      async function loadProjectDetails() {
        try {
          const p = await db.getProjectById(projectId);
          if (p) {
            setClientName(p.client_name || '');
            setClientWa(p.client_wa || '');
            setClientEmail(p.client_email || '');
            setProjectName(p.project_name || '');
            setInternalNotes(p.internal_notes || '');
            setStatus(p.status || 'ongoing');
            setStartDate(p.start_date || '');
            setDeadline(p.deadline || '');
            setTotalPrice(p.total_price || 0);
            setDpPaid(p.dp_paid || 0);
            setTechStack(p.tech_stack || []);
            setIsPublic(p.is_public || false);
            setPublicName(p.public_name || '');
            setScreenshotUrl(p.screenshot_url || '');
            setLiveUrl(p.live_url || '');
            setDescription(p.description || '');
          } else {
            alert('Proyek tidak ditemukan di database.');
            onNavigate('#/dashboard/projects');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
      loadProjectDetails();
    } else {
      // Create Mode: Set default dates to today + 30 days
      const today = new Date().toISOString().substring(0, 10);
      const limit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      setStartDate(today);
      setDeadline(limit);
    }
  }, [projectId, isEditMode]);

  // Handle tech stack dynamic rows modifiers
  const handleAddTechRow = () => {
    const newItem: TechStackItem = {
      category: 'Frontend',
      service: '',
      email: '',
      notes: ''
    };
    setTechStack([...techStack, newItem]);
  };

  const handleRemoveTechRow = (index: number) => {
    setTechStack(techStack.filter((_, idx) => idx !== index));
  };

  const handleTechChange = (index: number, field: keyof TechStackItem, value: string) => {
    const updated = [...techStack];
    updated[index] = { ...updated[index], [field]: value } as TechStackItem;
    setTechStack(updated);
  };

  // Drag and Drop implementation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    // Read to Base64 to offer instant offline fidelity for local preview + local storage serialization.
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form submission dispatcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientName.trim()) {
      alert('Nama proyek dan nama klien wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Project> = {
        ...(isEditMode ? { id: projectId } : {}),
        client_name: clientName,
        client_wa: clientWa,
        client_email: clientEmail,
        project_name: projectName,
        internal_notes: internalNotes,
        status: status,
        start_date: startDate,
        deadline: deadline,
        total_price: Number(totalPrice),
        dp_paid: Number(dpPaid),
        tech_stack: techStack,
        is_public: isPublic,
        public_name: publicName || projectName,
        screenshot_url: screenshotUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        live_url: liveUrl,
        description: description
      };

      await db.saveProject(payload);
      setIsSaving(false);
      onNavigate('#/dashboard/projects');
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setIsSaving(false);
      alert(`Gagal menyimpan project: ${err.message || err || 'Cek logs console'}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-sm leading-relaxed">Menyiapkan formulir modifikasi. Mohon tunggu...</p>
      </div>
    );
  }

  return (
    <div id="project-edit-container" className="space-y-6">
      
      {/* Upper header back shortcut */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onNavigate('#/dashboard/projects')}
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0 border border-dark-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-brand-orange-500 font-mono text-[10px] font-bold uppercase tracking-wider block">Input Studio</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {isEditMode ? 'Edit Informasi Proyek' : 'Daftarkan Proyek Klien Baru'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        
        {/* SECTION 1: CLIENT INFORMATION CARD */}
        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-dark-650 pb-4">
            <User className="w-5 h-5 text-brand-orange-500 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">1. Informasi Detail Klien Partner</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Nama Klien / Instansi *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Yayasan Abdi Negara"
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">No. WhatsApp Aktif</label>
              <input
                type="tel"
                value={clientWa}
                onChange={(e) => setClientWa(e.target.value)}
                placeholder="Ex: 0812XXXXXXXX"
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Alamat Email Klien</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Ex: client@domain.com"
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: INTERNAL PROJECT WORK INFORMATION BRAND */}
        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-dark-650 pb-4">
            <Briefcase className="w-5 h-5 text-brand-orange-500 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">2. Rincian Pengerjaan Internal Proyek</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Nama Proyek Internal *</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Web Profile SMA 1 - PPDB Terbuka"
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Status Kerja Saat Ini</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              >
                <option value="ongoing">Ongoing (Sedang Diprogram)</option>
                <option value="done">Done (Selesai Serah Terima)</option>
                <option value="maintenance">Maintenance (Masa Garansi / Update)</option>
                <option value="cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>
          </div>

          {/* Dates, Budget scales */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Mulai Kontrak</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Deadline Lapor</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Total Harga Kontrak (IDR)</label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">DP Terbayar (IDR)</label>
              <input
                type="number"
                value={dpPaid}
                onChange={(e) => setDpPaid(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none font-mono transition"
              />
            </div>
          </div>

          {/* Sisa Piutang Info Display */}
          <div className="p-4 bg-dark-900 rounded-xl border border-dark-650 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Sisa Outstanding Yang Belum Dibayar: </span>
            <span className={`font-bold font-mono text-sm ${totalPrice - dpPaid > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              Rp {new Intl.NumberFormat('id-ID').format(totalPrice - dpPaid)}
            </span>
          </div>

          {/* Internal notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Catatan Tambahan & Kendala Kerja</label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ex: Domain dicarikan klien secara mandiri. Integrasi gateway nggunain Midtrans."
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition resize-y"
            />
          </div>
        </div>

        {/* SECTION 3: DYNAMIC TECH STACK LIST BUILDER */}
        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-dark-650 pb-4">
            <div className="flex items-center space-x-2">
              <Laptop className="w-5 h-5 text-brand-orange-500 shrink-0" />
              <h2 className="text-base font-bold text-white tracking-wide">3. Detail Tech Stack & Credentials Layanan</h2>
            </div>
            
            <button
              type="button"
              onClick={handleAddTechRow}
              className="bg-dark-800 hover:bg-dark-750 text-brand-orange-500 text-xs font-bold border border-dark-600 px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Layanan</span>
            </button>
          </div>

          {techStack.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Belum ada baris teknologi terdaftar. Klik "+ Tambah Baris" untuk mendaftarkan database, hosting, auth, dsb.
            </div>
          ) : (
            <div className="space-y-4">
              {techStack.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-dark-900 border border-dark-650 p-4 rounded-xl relative grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
                >
                  {/* Category select dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono tracking-wide uppercase text-slate-400 mb-1.5">Kategori</label>
                    <select
                      value={item.category}
                      onChange={(e) => handleTechChange(index, 'category', e.target.value)}
                      className="w-full bg-dark-800 border border-dark-600 focus:border-brand-orange-500 text-xs text-slate-300 rounded-lg p-2.5 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Layanan Name */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono tracking-wide uppercase text-slate-400 mb-1.5">Nama Layanan / Provider</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vercel, Supabase, Midtrans"
                      value={item.service}
                      onChange={(e) => handleTechChange(index, 'service', e.target.value)}
                      className="w-full bg-dark-800 border border-dark-600 focus:border-brand-orange-500 text-xs text-white rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  {/* Account credentials */}
                  <div>
                    <label className="block text-[10px] font-bold font-mono tracking-wide uppercase text-slate-400 mb-1.5">Akun/Email Login Layanan</label>
                    <input
                      type="text"
                      placeholder="Ex: billing@client-org.id"
                      value={item.email}
                      onChange={(e) => handleTechChange(index, 'email', e.target.value)}
                      className="w-full bg-dark-800 border border-dark-600 focus:border-brand-orange-500 text-xs text-white rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  {/* Notes & Actions */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold font-mono tracking-wide uppercase text-slate-400 mb-1.5 font-medium">Catatan Tambahan (Sandi / Info)</label>
                      <input
                        type="text"
                        placeholder="Ex: Server Singapore"
                        value={item.notes || ''}
                        onChange={(e) => handleTechChange(index, 'notes', e.target.value)}
                        className="w-full bg-dark-800 border border-dark-600 focus:border-brand-orange-500 text-xs text-white rounded-lg p-2.5 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTechRow(index)}
                      className="p-2.5 bg-red-950/10 border border-red-900/20 hover:bg-red-500/10 text-red-400 rounded-lg transition shrink-0 self-end mb-[1px] cursor-pointer"
                      title="Hapus baris teknis ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: SHOWCASE PORTFOLIO CONFIGURATION SETTINGS */}
        <div className="bg-[#111] border border-t border-dark-600 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-dark-650 pb-4">
            <Settings className="w-5 h-5 text-brand-orange-500 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">4. Pengaturan Publikasi Portfolio Halaman Utama</h2>
          </div>

          {/* Toggle status portfolio display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-900 rounded-2xl border border-dark-650">
            <div>
              <span className="font-bold text-white text-sm block">Tampilkan Ke Portfolio Publik?</span>
              <span className="text-slate-400 text-xs">Jika 'Aktif', project ini akan muncul di web utama publik sehingga orang lain bisa melihat hasil screenshot dan tech stacknya.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer select-none ${
                isPublic 
                  ? 'bg-emerald-500 text-white shadow shadow-emerald-500/10' 
                  : 'bg-dark-800 text-slate-400 border border-dark-600'
              }`}
            >
              {isPublic ? 'YA, PUBLIKASIKAN' : 'TIDAK (DRAFT/ARSIP)'}
            </button>
          </div>

          {isPublic && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Public Title customization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Nama Project Untuk Publik</label>
                  <input
                    type="text"
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    placeholder="Ex: Nusantara Residence Web Portal"
                    className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Boleh berbeda atau dibuat lebih eksotis dari nama internal.</span>
                </div>

                {/* Direct live URL link */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">URL Live Proyek (Link)</label>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="Ex: https://nusantara.example.id"
                    className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Public description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase mb-2">Deskripsi Tampilan Untuk Publik</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Gambarkan keunikan website (contoh: 'Portal real estate interaktif dengan responsive 3D tour gallery, optimal mobile, dan integrasi WhatsApp')"
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition resize-y"
                />
              </div>

              {/* Drag and Drop Screenshot Uploader with Fallback Text Link Input */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-400 font-mono tracking-wide uppercase">Screenshot Visual Proyek (Cloudinary / Sandbox Local)</label>
                
                {/* Drag and drop active layout */}
                <div 
                  id="screenshot-dropzone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                    dragActive 
                      ? 'border-brand-orange-600 bg-brand-orange-650/10' 
                      : 'border-dark-650 bg-dark-900/60 hover:bg-dark-900 hover:border-dark-600'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {screenshotUrl ? (
                    <div className="space-y-4 w-full max-w-sm">
                      <div className="aspect-video w-full rounded-xl overflow-hidden relative border border-dark-600 bg-black mx-auto">
                        <img 
                          src={screenshotUrl} 
                          alt="Showcase Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-[11px] text-brand-orange-400 font-semibold font-mono">✓ Screenshot Berhasil Dipasang. Klik untuk Ubah Gambar.</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-brand-orange-500 animate-pulse shrink-0" />
                      <div>
                        <p className="text-white font-bold text-xs sm:text-sm">Seret & Taruh Screenshot ke Sini atau Klik untuk Telusuri File</p>
                        <p className="text-slate-500 text-[10px] mt-1">Mendukung format gambar JPEG, PNG, WEBP s/d resolusi Full High Definition.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Direct text link copy fallback input */}
                <div>
                  <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
                    Atau Paste Direct URL Screenshot (Cloudinary) Secara Manual:
                  </label>
                  <input
                    type="text"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="Ex: https://res.cloudinary.com/demo/image/upload/..."
                    className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 text-xs sm:text-sm text-slate-300 rounded-xl px-4 py-3 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Save Trigger action button */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => onNavigate('#/dashboard/projects')}
            className="px-6 py-3.5 rounded-xl border border-dark-600 hover:bg-dark-800 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-orange-600 hover:bg-brand-orange-700 disabled:bg-dark-750 text-white text-xs font-bold px-6 py-3.5 rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-lg shadow-brand-orange-600/10"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Proyek...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Proyek Klien</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
