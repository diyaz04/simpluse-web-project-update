import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/db';
import { CommissionRecord, CommissionStatus, MaintenanceBilling, MaintenanceBillingStatus, Order, Project, Reseller } from '../types';
import {
  BadgeDollarSign,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileSpreadsheet,
  PlusCircle,
  Save,
  UserRound,
  WalletCards
} from 'lucide-react';

interface AdminFinancePageProps {
  onNavigate: (route: string) => void;
}

export default function AdminFinancePage({ onNavigate }: AdminFinancePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [maintenanceBillings, setMaintenanceBillings] = useState<MaintenanceBilling[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creatingMaintenance, setCreatingMaintenance] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [maintenanceDraft, setMaintenanceDraft] = useState({
    project_id: '',
    billing_date: new Date().toISOString().substring(0, 10),
    title: '',
    description: '',
    amount: 0,
    status: 'issued' as MaintenanceBillingStatus,
    notes: ''
  });

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [projectRows, orderRows, resellerRows, commissionRows, maintenanceRows] = await Promise.all([
        db.getProjects(),
        db.getOrders(),
        db.getResellers(),
        db.getCommissionRecords(),
        db.getMaintenanceBillings()
      ]);
      setProjects(projectRows);
      setOrders(orderRows);
      setResellers(resellerRows);
      setCommissions(commissionRows);
      setMaintenanceBillings(maintenanceRows);
    } catch (err: any) {
      console.error('Failed to load finance report:', err);
      setErrorMsg(err?.message || 'Gagal memuat laporan keuangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const toMonthKey = (value?: string | null) => {
    if (!value) return 'unknown';
    return value.substring(0, 7);
  };

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    projects.forEach((project) => keys.add(toMonthKey(project.created_at || project.start_date)));
    commissions.forEach((record) => keys.add(toMonthKey(record.period_month || record.created_at)));
    maintenanceBillings.forEach((record) => keys.add(toMonthKey(record.billing_date || record.created_at)));
    orders.forEach((order) => keys.add(toMonthKey(order.created_at)));
    return Array.from(keys).filter((item) => item !== 'unknown').sort().reverse();
  }, [projects, commissions, maintenanceBillings, orders]);

  const filteredProjects = selectedMonth === 'all'
    ? projects
    : projects.filter((project) => toMonthKey(project.created_at || project.start_date) === selectedMonth);
  const filteredOrders = selectedMonth === 'all'
    ? orders
    : orders.filter((order) => toMonthKey(order.created_at) === selectedMonth);
  const filteredCommissions = selectedMonth === 'all'
    ? commissions
    : commissions.filter((record) => toMonthKey(record.period_month || record.created_at) === selectedMonth);
  const filteredMaintenanceBillings = selectedMonth === 'all'
    ? maintenanceBillings
    : maintenanceBillings.filter((record) => toMonthKey(record.billing_date || record.created_at) === selectedMonth);

  const totalProjectValue = filteredProjects.reduce((sum, project) => sum + Number(project.total_price || 0), 0);
  const totalDpPaid = filteredProjects.reduce((sum, project) => sum + Number(project.dp_paid || 0), 0);
  const outstandingBalance = totalProjectValue - totalDpPaid;
  const recurringMonthlyValue = filteredProjects
    .filter((project) => project.payment_scheme === 'per_user_contract')
    .reduce((sum, project) => sum + Number(project.monthly_amount || 0), 0);
  const pendingCommission = filteredCommissions
    .filter((record) => record.status === 'pending')
    .reduce((sum, record) => sum + Number(record.commission_amount || 0), 0);
  const approvedCommission = filteredCommissions
    .filter((record) => record.status === 'approved')
    .reduce((sum, record) => sum + Number(record.commission_amount || 0), 0);
  const paidCommission = filteredCommissions
    .filter((record) => record.status === 'paid')
    .reduce((sum, record) => sum + Number(record.commission_amount || 0), 0);
  const maintenanceIssuedValue = filteredMaintenanceBillings
    .filter((record) => record.status === 'issued' || record.status === 'paid')
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const maintenancePaidValue = filteredMaintenanceBillings
    .filter((record) => record.status === 'paid')
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const oneTimeProjects = projects.filter((project) => project.payment_scheme !== 'per_user_contract');

  const getStatusClass = (status: CommissionStatus) => {
    if (status === 'paid') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (status === 'approved') return 'bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20';
    if (status === 'void') return 'bg-red-500/15 text-red-400 border-red-500/20';
    return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  };

  const handleCommissionStatus = async (record: CommissionRecord, status: CommissionStatus) => {
    setSavingId(record.id);
    setErrorMsg('');

    try {
      await db.saveCommissionRecord({
        id: record.id,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        notes: record.notes || ''
      });

      if (record.project_id) {
        await db.saveProject({
          id: record.project_id,
          commission_status: status
        });
      }

      await loadFinanceData();
    } catch (err: any) {
      console.error('Failed to update commission status:', err);
      setErrorMsg(err?.message || 'Gagal memperbarui status komisi.');
    } finally {
      setSavingId(null);
    }
  };

  const getMaintenanceStatusClass = (status: MaintenanceBillingStatus) => {
    if (status === 'paid') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (status === 'issued') return 'bg-brand-orange-500/15 text-brand-orange-400 border-brand-orange-500/20';
    if (status === 'void') return 'bg-red-500/15 text-red-400 border-red-500/20';
    return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  };

  const handleCreateMaintenanceBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    const project = projects.find((item) => item.id === maintenanceDraft.project_id);
    if (!project) {
      setErrorMsg('Pilih project untuk membuat tagihan maintenance.');
      return;
    }

    setCreatingMaintenance(true);
    setErrorMsg('');

    try {
      await db.saveMaintenanceBilling({
        project_id: project.id,
        project_name: project.project_name,
        client_name: project.client_name,
        billing_date: maintenanceDraft.billing_date,
        title: maintenanceDraft.title,
        description: maintenanceDraft.description,
        amount: Number(maintenanceDraft.amount) || 0,
        status: maintenanceDraft.status,
        paid_at: maintenanceDraft.status === 'paid' ? new Date().toISOString() : null,
        notes: maintenanceDraft.notes
      });

      setMaintenanceDraft({
        project_id: '',
        billing_date: new Date().toISOString().substring(0, 10),
        title: '',
        description: '',
        amount: 0,
        status: 'issued',
        notes: ''
      });
      await loadFinanceData();
    } catch (err: any) {
      console.error('Failed to create maintenance billing:', err);
      setErrorMsg(err?.message || 'Gagal membuat tagihan maintenance.');
    } finally {
      setCreatingMaintenance(false);
    }
  };

  const handleMaintenanceStatus = async (record: MaintenanceBilling, status: MaintenanceBillingStatus) => {
    setSavingId(record.id);
    setErrorMsg('');

    try {
      await db.saveMaintenanceBilling({
        id: record.id,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null
      });
      await loadFinanceData();
    } catch (err: any) {
      console.error('Failed to update maintenance billing:', err);
      setErrorMsg(err?.message || 'Gagal memperbarui tagihan maintenance.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-xs">Memuat laporan keuangan bulanan...</p>
      </div>
    );
  }

  return (
    <div id="admin-finance-report" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Finance Report</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Laporan Keuangan Bulanan</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Pantau nilai project, recurring kontrak, piutang, dan status pembayaran komisi reseller.
          </p>
        </div>

        <label className="bg-[#111] border border-dark-600 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-slate-300">
          <CalendarDays className="w-4 h-4 text-brand-orange-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent outline-none text-white font-semibold cursor-pointer"
          >
            <option value="all" className="bg-[#111]">Semua Bulan</option>
            {monthOptions.map((month) => (
              <option key={month} value={month} className="bg-[#111]">
                {new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg p-4 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[124px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Nilai Project</span>
            <CircleDollarSign className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-xl font-black text-white font-mono">{rupiah(totalProjectValue)}</h2>
          <p className="text-[10px] text-slate-500 mt-3">{filteredProjects.length} project tercatat.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[124px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">DP Masuk</span>
            <WalletCards className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-white font-mono">{rupiah(totalDpPaid)}</h2>
          <p className="text-[10px] text-red-400 mt-3">Piutang: {rupiah(outstandingBalance)}</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[124px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Recurring Bulanan</span>
            <CreditCard className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-xl font-black text-white font-mono">{rupiah(recurringMonthlyValue)}</h2>
          <p className="text-[10px] text-slate-500 mt-3">Dari kontrak per jumlah user.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[124px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Komisi Belum Dibayar</span>
            <BadgeDollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-white font-mono">{rupiah(pendingCommission + approvedCommission)}</h2>
          <p className="text-[10px] text-emerald-400 mt-3">Paid: {rupiah(paidCommission)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <form onSubmit={handleCreateMaintenanceBilling} className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-brand-orange-500" />
            <h3 className="text-base font-bold text-white">Buat Tagihan Maintenance</h3>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Project</label>
              <select
                required
                value={maintenanceDraft.project_id}
                onChange={(e) => setMaintenanceDraft((item) => ({ ...item, project_id: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              >
                <option value="">Pilih project</option>
                {oneTimeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} - {project.client_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Tanggal Tagihan</label>
                <input
                  required
                  type="date"
                  value={maintenanceDraft.billing_date}
                  onChange={(e) => setMaintenanceDraft((item) => ({ ...item, billing_date: e.target.value }))}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Nominal</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={maintenanceDraft.amount}
                  onChange={(e) => setMaintenanceDraft((item) => ({ ...item, amount: Number(e.target.value) }))}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Judul Tagihan</label>
              <input
                required
                value={maintenanceDraft.title}
                onChange={(e) => setMaintenanceDraft((item) => ({ ...item, title: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                placeholder="Ex: Maintenance minor revisi dashboard"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Deskripsi</label>
              <textarea
                rows={3}
                value={maintenanceDraft.description}
                onChange={(e) => setMaintenanceDraft((item) => ({ ...item, description: e.target.value }))}
                className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none resize-y"
                placeholder="Rincian pekerjaan maintenance/perubahan tambahan"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Status</label>
                <select
                  value={maintenanceDraft.status}
                  onChange={(e) => setMaintenanceDraft((item) => ({ ...item, status: e.target.value as MaintenanceBillingStatus }))}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Catatan</label>
                <input
                  value={maintenanceDraft.notes}
                  onChange={(e) => setMaintenanceDraft((item) => ({ ...item, notes: e.target.value }))}
                  className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingMaintenance}
              className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 disabled:bg-dark-700 disabled:text-slate-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-full cursor-pointer inline-flex items-center justify-center space-x-2"
            >
              {creatingMaintenance ? (
                <span>Menyimpan Tagihan...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Tagihan Maintenance</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-brand-orange-500" />
              <h3 className="text-base font-bold text-white">Tagihan Maintenance</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono uppercase">Issued {rupiah(maintenanceIssuedValue)}</p>
              <p className="text-[10px] text-emerald-400 font-mono uppercase">Paid {rupiah(maintenancePaidValue)}</p>
            </div>
          </div>

          {filteredMaintenanceBillings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Belum ada tagihan maintenance</p>
              <p className="text-xs mt-1">Buat tagihan saat klien project sekali bayar minta revisi atau maintenance tambahan.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-650/40">
              {filteredMaintenanceBillings.slice(0, 8).map((record) => (
                <div key={record.id} className="p-4 hover:bg-dark-850/40 transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{record.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{record.project_name || '-'} - {record.client_name || '-'}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{record.description || record.notes || '-'}</p>
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <p className="font-mono text-sm font-black text-white">{rupiah(Number(record.amount || 0))}</p>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getMaintenanceStatusClass(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-500 font-mono">
                      {record.billing_date ? new Date(record.billing_date).toLocaleDateString('id-ID') : '-'}
                      {record.paid_at ? ` - paid ${new Date(record.paid_at).toLocaleDateString('id-ID')}` : ''}
                    </p>
                    <div className="inline-flex items-center gap-1 bg-dark-900 border border-dark-600 p-1 rounded-lg">
                      <button
                        type="button"
                        disabled={savingId === record.id || record.status === 'issued'}
                        onClick={() => handleMaintenanceStatus(record, 'issued')}
                        title="Tandai Issued"
                        className="p-1.5 rounded text-slate-400 hover:text-brand-orange-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Clock3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={savingId === record.id || record.status === 'paid'}
                        onClick={() => handleMaintenanceStatus(record, 'paid')}
                        title="Tandai Paid"
                        className="p-1.5 rounded text-slate-400 hover:text-emerald-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={savingId === record.id || record.status === 'void'}
                        onClick={() => handleMaintenanceStatus(record, 'void')}
                        title="Void Tagihan"
                        className="p-1.5 rounded text-slate-400 hover:text-red-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-orange-500" />
            <h3 className="text-base font-bold text-white">Catatan Komisi Reseller</h3>
          </div>
          <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
            {filteredCommissions.length} RECORD
          </span>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BadgeDollarSign className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Belum ada catatan komisi</p>
            <p className="text-xs mt-1">Komisi akan muncul setelah order reseller dikonversi menjadi project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                  <th className="p-4">Periode</th>
                  <th className="p-4">Reseller</th>
                  <th className="p-4">Basis Deal</th>
                  <th className="p-4">Komisi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-650/40 text-slate-300">
                {filteredCommissions.map((record) => {
                  const project = projects.find((item) => item.id === record.project_id);
                  const reseller = resellers.find((item) => item.id === record.reseller_id);
                  return (
                    <tr key={record.id} className="hover:bg-dark-850/40 transition">
                      <td className="p-4 font-mono text-slate-400">
                        {record.period_month ? new Date(record.period_month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-brand-orange-500" />
                          <div>
                            <p className="font-bold text-white">{record.reseller_name || reseller?.name || '-'}</p>
                            <p className="text-[10px] text-slate-500">{reseller?.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-mono font-bold text-white">{rupiah(Number(record.base_amount || 0))}</p>
                        <button
                          type="button"
                          onClick={() => project?.id && onNavigate(`#/dashboard/projects/edit/${project.id}`)}
                          disabled={!project}
                          className="mt-1 text-[10px] text-brand-orange-400 disabled:text-slate-600 hover:underline disabled:hover:no-underline cursor-pointer disabled:cursor-default"
                        >
                          {project?.project_name || 'Project belum tersedia'}
                        </button>
                      </td>
                      <td className="p-4">
                        <p className="font-mono font-bold text-emerald-400">{rupiah(Number(record.commission_amount || 0))}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Rate {Number(record.commission_rate || 0)}%</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${getStatusClass(record.status)}`}>
                          {record.status}
                        </span>
                        {record.paid_at && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Paid {new Date(record.paid_at).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1 bg-dark-900 border border-dark-600 p-1 rounded-lg">
                          <button
                            type="button"
                            disabled={savingId === record.id || record.status === 'approved'}
                            onClick={() => handleCommissionStatus(record, 'approved')}
                            title="Approve Komisi"
                            className="p-1.5 rounded text-slate-400 hover:text-brand-orange-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Clock3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={savingId === record.id || record.status === 'paid'}
                            onClick={() => handleCommissionStatus(record, 'paid')}
                            title="Tandai Sudah Dibayar"
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={savingId === record.id || record.status === 'void'}
                            onClick={() => handleCommissionStatus(record, 'void')}
                            title="Void Komisi"
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-dark-600 flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-orange-500" />
          <h3 className="text-base font-bold text-white">Ringkasan Lead Bulanan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          <div className="bg-dark-900 border border-dark-650 rounded-lg p-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Total Order</span>
            <p className="text-2xl font-black text-white font-mono mt-2">{filteredOrders.length}</p>
          </div>
          <div className="bg-dark-900 border border-dark-650 rounded-lg p-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Order Reseller</span>
            <p className="text-2xl font-black text-white font-mono mt-2">
              {filteredOrders.filter((order) => order.source_channel === 'reseller').length}
            </p>
          </div>
          <div className="bg-dark-900 border border-dark-650 rounded-lg p-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Order Deal</span>
            <p className="text-2xl font-black text-white font-mono mt-2">
              {filteredOrders.filter((order) => order.status === 'deal').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
