import React, { useState } from 'react';
import { db } from '../lib/db';
import { motion } from 'motion/react';
import { ArrowLeft, Send, CheckCircle, Smartphone, Mail, Sparkles, HelpCircle } from 'lucide-react';

interface OrderPageProps {
  onNavigate: (route: string) => void;
}

export default function OrderPage({ onNavigate }: OrderPageProps) {
  // Form Field State
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [websiteType, setWebsiteType] = useState('Landing Page');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('Rp 1.500.000 - Rp 3.500.000');
  const [deadline, setDeadline] = useState('14 Hari');

  // Submit flow UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const budgetOptions = [
    'Di bawah Rp 1.500.000',
    'Rp 1.500.000 - Rp 3.500.000',
    'Rp 3.500.000 - Rp 6.000.000',
    'Rp 6.000.000 - Rp 10.000.000',
    'Diatas Rp 10.000.000'
  ];

  const deadlineOptions = [
    '< 7 Hari (Sangat Mendesak)',
    '14 Hari (Standar)',
    '30 Hari (Rekomendasi)',
    '> 30 Hari (Pengembangan Skala Besar)'
  ];

  const websiteTypes = [
    'Landing Page',
    'Company Profile',
    'Website Sekolah',
    'Toko Online (E-Commerce)',
    'Sistem Informasi / Web App Custom',
    'Maintenance / Update Web Lama'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !whatsapp || !email || !description) {
      alert('Mohon lengkapi seluruh kolom input bertanda bintang (*) sebelum mengirim!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Unified client database API stores order + triggers server notifications
      await db.saveOrder({
        full_name: fullName,
        whatsapp,
        email,
        website_type: websiteType,
        description,
        budget,
        deadline,
        status: 'new'
      });

      // 2. Prepare structured WhatsApp text
      const waText = 
`*ORDER WEBSITE BARU - SIMPLUSE WEB*

Halo Admin Simpluse Web Project, saya telah melakukan pengiriman form order pemesanan website. Berikut ringkasan details kebutuhan saya:

👤 *Klien*  : ${fullName}
📞 *WA Klien*: ${whatsapp}
✉️ *Email*   : ${email}
🖥️ *Website* : ${websiteType}
💰 *Budget*  : ${budget}
📅 *Deadline*: ${deadline}

🗒️ *Kebutuhan & Deskripsi*:
_"${description}"_

Mohon dibantu konfirmasi kuotasinya ya admin, terimakasih!`;

      // Encoded WA redirect
      const encodedWa = encodeURIComponent(waText);
      const waUrl = `https://wa.me/6285121535821?text=${encodedWa}`;

      setIsSubmitting(false);
      setSuccess(true);

      // Delay redirect slightly so client sees the beautiful success card
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 2000);

    } catch (err) {
      console.error('Submit error:', err);
      setIsSubmitting(false);
      alert('Terjadi kendala pengiriman formulir. Tenang, Anda dapat mengirim order langsung ke WhatsApp cs kami: 085121535821');
    }
  };

  return (
    <div id="order-page" className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[10%] left-1/3 w-[550px] h-[550px] bg-[#F97316]/5 rounded-full blur-[130px] pointer-events-none select-none" />

      {/* Back to Home anchor */}
      <button
        onClick={() => onNavigate('#/')}
        className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition cursor-pointer mb-8 relative z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Kembali ke Home</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        {/* Left column: Explainer details */}
        <div className="lg:col-span-5 space-y-8 animate-fadeIn text-left">
          <div>
            <span className="text-[#F97316] font-mono text-xs font-bold tracking-[0.2em] uppercase block mb-3">Order Form</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">Mulai Proyek Website Anda</h1>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed font-sans font-normal">
              Isi data detail kebutuhan Anda di kolom form yang disediakan. Kami berkomitmen menjaga kerahasiaan data personal klien kami secara penuh.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 bg-white/5 border border-white/5 p-5 rounded-2xl immersive-glass">
              <CheckCircle className="w-5 h-5 text-[#F97316] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Konsultasi Tanpa Biaya</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed font-normal">Sesi tanya jawab strategi pemasaran digital dan pemilihan model interface 100% gratis.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 border border-white/5 p-5 rounded-2xl immersive-glass">
              <Smartphone className="w-5 h-5 text-[#F97316] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Fast Response Partner</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed font-normal">Setelah form dikirim, admin kami akan langsung mengontak WhatsApp Anda maksimal dalam waktu 2 jam kerja.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 border border-white/5 p-5 rounded-2xl immersive-glass">
              <Sparkles className="w-5 h-5 text-[#F97316] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Laporan Progress Live</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed font-normal">Proses modifikasi coding dan update interface dapat dipantau langsung kapan saja sefleksibel mungkin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form body */}
        <div className="lg:col-span-7 bg-[#111111]/75 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          {success ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#F97316]/15 border border-[#F97316]/25 flex items-center justify-center mx-auto text-[#F97316] shadow-[0_0_20px_rgba(249,115,22,0.15)] animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Pemesanan Berhasil Dikirim!</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                  Terima kasih, data kebutuhan website Anda telah diterima dan akan segera ditindaklanjuti oleh tim kami.
                </p>
                <div className="mt-8 p-4 bg-white/5 rounded-2xl max-w-sm mx-auto border border-white/5 flex items-center space-x-3 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <p className="text-[11px] font-mono text-slate-300 leading-normal">
                    Mengalihkan browser Anda ke partner official WhatsApp kami untuk diskusi teknis spesifik berikutnya...
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full name input */}
                <div>
                  <label htmlFor="fullname" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                    Nama Lengkap <span className="text-[#F97316] font-sans">*</span>
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition duration-150 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  />
                </div>

                {/* WhatsApp number */}
                <div>
                  <label htmlFor="whatsapp" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                    No. WhatsApp Aktif <span className="text-[#F97316] font-sans">*</span>
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition duration-150 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                  Alamat Email Aktif <span className="text-[#F97316] font-sans">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: budi.corp@gmail.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition duration-150 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                />
              </div>

              {/* Website Type Dropdown */}
              <div>
                <label htmlFor="websitetype" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                  Kategori Website Yang Diinginkan <span className="text-[#F97316] font-sans">*</span>
                </label>
                <select
                  id="websitetype"
                  value={websiteType}
                  onChange={(e) => setWebsiteType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition duration-150 appearance-none cursor-pointer"
                >
                  {websiteTypes.map((type) => (
                    <option key={type} className="bg-[#111111] text-white" value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget and Deadline sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                    Estimasi Anggaran (Budget) <span className="text-[#F97316] font-sans">*</span>
                  </label>
                  <select
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-slate-305 outline-none transition duration-150 cursor-pointer"
                  >
                    {budgetOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#111111] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                    Estimasi Batas Waktu (Deadline) <span className="text-[#F97316] font-sans">*</span>
                  </label>
                  <select
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-slate-305 outline-none transition duration-150 cursor-pointer"
                  >
                    {deadlineOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#111111] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requirements Description Textarea */}
              <div>
                <label htmlFor="description" className="block text-xs font-bold text-slate-300 font-mono tracking-widest uppercase mb-2">
                  Deskripsi Kebutuhan & Gambaran Kasus <span className="text-[#F97316] font-sans">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan fitur apa saja yang wajib ada (contoh: 'saya ingin web laundry online yg punya kriteria form input berat laundry, deteksi otomatis total tagihan, dsb.')"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition duration-150 resize-y"
                />
              </div>

              {/* Submit CTA button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-[#F97316] hover:bg-[#ea580c] disabled:bg-white/5 disabled:text-slate-600 text-black font-extrabold tracking-wide shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.55)] transform hover:-translate-y-0.5 disabled:transform-none transition duration-150 flex items-center justify-center space-x-2 cursor-pointer border-0"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Mengonfigurasi Order & Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Kirim Formulir Order & Hubungi WA</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 leading-normal select-none">
                Dengan menekan tombol, order Anda akan dicatat dan browser akan membuka WhatsApp untuk diskusi lanjutan.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
