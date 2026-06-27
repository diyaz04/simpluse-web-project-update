import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/db';
import { Order, PaymentScheme, Reseller } from '../types';
import {
  ArrowLeft,
  BadgePercent,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Send,
  UserRound
} from 'lucide-react';

interface ResellerOrderPageProps {
  orderId?: string;
  onNavigate: (route: string) => void;
}

export default function ResellerOrderPage({ orderId, onNavigate }: ResellerOrderPageProps) {
  const isEditMode = Boolean(orderId);
  const currentUser = db.getCurrentUser();
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [sourceOrder, setSourceOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [websiteType, setWebsiteType] = useState('Company Profile');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('30 Hari');
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>('one_time');
  const [dealPrice, setDealPrice] = useState(5000000);
  const [pricePerUser, setPricePerUser] = useState(5000);
  const [userCount, setUserCount] = useState(1000);
  const [supportScope, setSupportScope] = useState('Bug fixing dan perubahan minor selama kontrak aktif.');
  const [maintenanceTerms, setMaintenanceTerms] = useState('Jika sekali bayar, maintenance/perubahan lanjutan dihitung sebagai biaya tambahan sesuai keputusan admin.');

  const websiteTypes = [
    'Landing Page',
    'Company Profile',
    'Website Sekolah',
    'Toko Online (E-Commerce)',
    'Sistem Informasi / Web App Custom',
    'Maintenance / Update Web Lama'
  ];

  const deadlineOptions = [
    '14 Hari',
    '30 Hari',
    '45 Hari',
    '60 Hari',
    '> 60 Hari'
  ];

  useEffect(() => {
    async function loadReseller() {
      try {
        setLoading(true);
        const [resellers, orders] = await Promise.all([
          db.getResellers(),
          orderId ? db.getOrders() : Promise.resolve([] as Order[])
        ]);
        const ownReseller = resellers.find((item) => item.id === currentUser?.reseller_id || item.user_id === currentUser?.id) || null;
        setReseller(ownReseller);

        if (orderId) {
          const editableOrder = orders.find((item) => item.id === orderId && (item.reseller_id === ownReseller?.id || item.reseller_id === currentUser?.reseller_id)) || null;
          if (!editableOrder) {
            setErrorMsg('Order afiliasi tidak ditemukan atau bukan milik akun reseller ini.');
            return;
          }

          setSourceOrder(editableOrder);
          setFullName(editableOrder.full_name || '');
          setWhatsapp(editableOrder.whatsapp || '');
          setEmail(editableOrder.email || '');
          setWebsiteType(editableOrder.website_type || 'Company Profile');
          setDescription(editableOrder.description || '');
          setDeadline(editableOrder.deadline || '30 Hari');
          setPaymentScheme(editableOrder.payment_scheme || 'one_time');
          setDealPrice(Number(editableOrder.deal_price || 0));
          setPricePerUser(Number(editableOrder.price_per_user || 0));
          setUserCount(Number(editableOrder.user_count || 0));
          setSupportScope(editableOrder.support_scope || 'Bug fixing dan perubahan minor selama kontrak aktif.');
          setMaintenanceTerms(editableOrder.maintenance_terms || 'Jika sekali bayar, maintenance/perubahan lanjutan dihitung sebagai biaya tambahan sesuai keputusan admin.');

          if (!['new', 'contacted'].includes(editableOrder.status)) {
            setErrorMsg('Order ini sudah diproses admin, jadi tidak bisa diedit lagi.');
          }
        }
      } catch (err: any) {
        console.error('Failed to load reseller order context:', err);
        setErrorMsg(err?.message || 'Gagal memuat data reseller.');
      } finally {
        setLoading(false);
      }
    }

    loadReseller();
  }, [currentUser?.id, currentUser?.reseller_id, orderId]);

  const monthlyAmount = useMemo(() => {
    return paymentScheme === 'per_user_contract' ? pricePerUser * userCount : 0;
  }, [paymentScheme, pricePerUser, userCount]);

  const commissionBase = paymentScheme === 'per_user_contract' ? monthlyAmount : dealPrice;
  const commissionRate = Number(reseller?.commission_rate || 0);
  const estimatedCommission = Math.round(commissionBase * commissionRate) / 100;
  const canEditOrder = !isEditMode || ['new', 'contacted'].includes(sourceOrder?.status || 'new');

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reseller) {
      setErrorMsg('Akun ini belum terhubung ke data reseller. Hubungi admin utama.');
      return;
    }

    if (!fullName || !whatsapp || !email || !description) {
      setErrorMsg('Nama klien, WhatsApp, email, dan deskripsi kebutuhan wajib diisi.');
      return;
    }

    if (!canEditOrder) {
      setErrorMsg('Order ini sudah diproses admin, jadi tidak bisa diedit lagi.');
      return;
    }

    setIsSubmitting(true);

    try {
      await db.saveOrder({
        ...(isEditMode ? { id: orderId } : {}),
        full_name: fullName,
        whatsapp,
        email,
        website_type: websiteType,
        description,
        budget: paymentScheme === 'per_user_contract'
          ? `${rupiah(pricePerUser)} x ${userCount} user = ${rupiah(monthlyAmount)} / bulan`
          : rupiah(dealPrice),
        deadline,
        status: sourceOrder?.status || 'new',
        source_channel: 'reseller',
        submitted_by: currentUser?.id || null,
        reseller_id: reseller.id,
        reseller_name: reseller.name,
        payment_scheme: paymentScheme,
        deal_price: paymentScheme === 'one_time' ? dealPrice : monthlyAmount,
        price_per_user: paymentScheme === 'per_user_contract' ? pricePerUser : 0,
        user_count: paymentScheme === 'per_user_contract' ? userCount : 0,
        monthly_amount: paymentScheme === 'per_user_contract' ? monthlyAmount : 0,
        support_scope: supportScope,
        maintenance_terms: maintenanceTerms,
        commission_rate: commissionRate,
        estimated_commission: estimatedCommission
      });

      setSuccess(true);
      setTimeout(() => onNavigate('#/reseller'), 1200);
    } catch (err: any) {
      console.error('Failed to submit reseller order:', err);
      setErrorMsg(err?.message || 'Gagal mengirim order afiliasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-xs">Memuat form order reseller...</p>
      </div>
    );
  }

  return (
    <div id="reseller-order-form" className="space-y-8">
      <button
        type="button"
        onClick={() => onNavigate('#/reseller')}
        className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Dashboard Reseller</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Affiliate Order</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditMode ? 'Edit Order Afiliasi' : 'Input Order Afiliasi'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            {isEditMode
              ? 'Perbarui data lead selama order belum dikunci oleh admin.'
              : 'Masukkan lead klien dari jaringanmu. Estimasi komisi dihitung otomatis dari rate reseller.'}
          </p>
        </div>
      </div>

      {(errorMsg || success) && (
        <div className={`border rounded-lg p-4 text-xs font-semibold ${errorMsg ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {errorMsg || (isEditMode ? 'Order afiliasi berhasil diperbarui.' : 'Order afiliasi berhasil dikirim ke admin.')}
        </div>
      )}

      {!reseller && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg p-5 text-xs leading-relaxed">
          Data reseller belum terhubung. Admin utama perlu menghubungkan akun ini ke tabel resellers sebelum order bisa dikirim.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center space-x-2">
            <UserRound className="w-5 h-5 text-brand-orange-500" />
            <h3 className="text-base font-bold text-white">Data Klien dan Kebutuhan</h3>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Nama Klien</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  placeholder="Nama pemilik/perusahaan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">WhatsApp</label>
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  placeholder="email@klien.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Jenis Website</label>
                <select
                  value={websiteType}
                  onChange={(e) => setWebsiteType(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                >
                  {websiteTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Estimasi Deadline</label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                >
                  {deadlineOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Skema Pembayaran</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentScheme('one_time')}
                  className={`text-left border rounded-lg p-4 cursor-pointer transition ${paymentScheme === 'one_time' ? 'bg-brand-orange-500/10 border-brand-orange-500/50 text-white' : 'bg-dark-900 border-dark-650 text-slate-400 hover:text-white'}`}
                >
                  <span className="block text-sm font-bold">Sekali Bayar</span>
                  <span className="block text-[11px] mt-1 leading-relaxed">Project selesai lalu lepas. Maintenance/perubahan lanjut dihitung admin.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentScheme('per_user_contract')}
                  className={`text-left border rounded-lg p-4 cursor-pointer transition ${paymentScheme === 'per_user_contract' ? 'bg-brand-orange-500/10 border-brand-orange-500/50 text-white' : 'bg-dark-900 border-dark-650 text-slate-400 hover:text-white'}`}
                >
                  <span className="block text-sm font-bold">Kontrak Per User</span>
                  <span className="block text-[11px] mt-1 leading-relaxed">Nilai bulanan dihitung dari harga per user dikali jumlah user.</span>
                </button>
              </div>
            </div>

            {paymentScheme === 'one_time' ? (
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Harga Deal Sekali Bayar</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={dealPrice}
                  onChange={(e) => setDealPrice(Number(e.target.value))}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Harga Per User</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={pricePerUser}
                    onChange={(e) => setPricePerUser(Number(e.target.value))}
                    className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Jumlah User</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={userCount}
                    onChange={(e) => setUserCount(Number(e.target.value))}
                    className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Nilai Bulanan</label>
                  <div className="bg-dark-900 border border-dark-650 rounded-lg px-3 py-2.5 text-xs text-emerald-400 font-bold font-mono">
                    {rupiah(monthlyAmount)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Deskripsi Kebutuhan</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none resize-y"
                placeholder="Jelaskan kebutuhan fitur, alur bisnis, target user, dan catatan dari klien."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Support Scope</label>
                <textarea
                  rows={3}
                  value={supportScope}
                  onChange={(e) => setSupportScope(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none resize-y"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Ketentuan Maintenance</label>
                <textarea
                  rows={3}
                  value={maintenanceTerms}
                  onChange={(e) => setMaintenanceTerms(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none resize-y"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !reseller || !canEditOrder}
                className="bg-brand-orange-600 hover:bg-brand-orange-700 disabled:bg-dark-700 disabled:text-slate-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-full cursor-pointer inline-flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>{isEditMode ? 'Menyimpan Order...' : 'Mengirim Order...'}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Kirim ke Admin'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="bg-[#111] border border-dark-600 rounded-lg p-5">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Reseller</span>
              <BadgePercent className="w-5 h-5 text-brand-orange-500" />
            </div>
            <h2 className="text-lg font-black text-white">{reseller?.name || currentUser?.name || '-'}</h2>
            <p className="text-[10px] text-slate-500 mt-1">{reseller?.email || currentUser?.email || '-'}</p>
            <div className="mt-4 bg-dark-900 border border-dark-650 rounded-lg px-3 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Rate Komisi</span>
              <span className="text-sm text-brand-orange-400 font-black font-mono">{commissionRate}%</span>
            </div>
          </div>

          <div className="bg-[#111] border border-dark-600 rounded-lg p-5">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Kalkulasi</span>
              <Calculator className="w-5 h-5 text-brand-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Basis Deal</span>
                <span className="font-mono text-white">{rupiah(commissionBase)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Skema</span>
                <span className="font-mono text-slate-200">{paymentScheme === 'per_user_contract' ? 'Per User / Bulan' : 'Sekali Bayar'}</span>
              </div>
              <div className="h-px bg-dark-650" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Estimasi Komisi</span>
                <span className="font-mono text-lg text-emerald-400 font-black">{rupiah(estimatedCommission)}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-300 leading-relaxed">
              Order akan masuk ke inbox admin dengan nama reseller dan estimasi komisi. Admin tetap memvalidasi deal sebelum project dibuat.
            </p>
          </div>

          <div className="bg-brand-orange-500/5 border border-brand-orange-500/15 rounded-lg p-4 flex items-start space-x-3">
            <CircleDollarSign className="w-4 h-4 text-brand-orange-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-brand-orange-300 leading-relaxed">
              Untuk kontrak per user, nilai komisi dihitung dari estimasi pembayaran bulanan pertama.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
