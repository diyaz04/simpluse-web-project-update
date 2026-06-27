import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { CommissionRecord, Order, Project, Reseller } from '../types';
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CircleDollarSign,
  Edit3,
  FileSpreadsheet,
  Hourglass,
  PlusCircle,
  Trash2,
  UserRoundCheck
} from 'lucide-react';

interface ResellerDashboardProps {
  onNavigate: (route: string) => void;
}

export default function ResellerDashboard({ onNavigate }: ResellerDashboardProps) {
  const currentUser = db.getCurrentUser();
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadResellerData() {
      try {
        setLoading(true);
        const resellerId = currentUser?.reseller_id;
        const [resellerRows, orderRows, projectRows, commissionRows] = await Promise.all([
          db.getResellers(),
          db.getOrders(),
          db.getProjects(),
          db.getCommissionRecords(resellerId || undefined)
        ]);

        const ownReseller = resellerRows.find((item) => item.id === resellerId || item.user_id === currentUser?.id) || null;
        setReseller(ownReseller);
        setOrders(orderRows.filter((order) => order.reseller_id === ownReseller?.id || order.reseller_id === resellerId));
        setProjects(projectRows.filter((project) => project.reseller_id === ownReseller?.id || project.reseller_id === resellerId));
        setCommissions(commissionRows);
      } catch (err) {
        console.error('Failed to load reseller dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResellerData();
  }, [currentUser?.id, currentUser?.reseller_id]);

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const pendingCommission = commissions
    .filter((item) => item.status === 'pending' || item.status === 'approved')
    .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const paidCommission = commissions
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  const orderEstimatedCommission = orders.reduce((sum, item) => sum + Number(item.estimated_commission || 0), 0);
  const projectEstimatedCommission = projects.reduce((sum, item) => sum + Number(item.estimated_commission || 0), 0);
  const estimatedCommission = projectEstimatedCommission + orderEstimatedCommission;
  const activeProjects = projects.filter((item) => item.status === 'ongoing' || item.status === 'maintenance').length;
  const commissionMonths = Array.from(
    commissions.reduce((map, record) => {
      const key = (record.period_month || record.created_at || '').substring(0, 7) || 'unknown';
      const current = map.get(key) || { count: 0, pending: 0, approved: 0, paid: 0, void: 0, total: 0 };
      const amount = Number(record.commission_amount || 0);
      current.count += 1;
      current.total += amount;
      if (record.status === 'pending') current.pending += amount;
      if (record.status === 'approved') current.approved += amount;
      if (record.status === 'paid') current.paid += amount;
      if (record.status === 'void') current.void += amount;
      map.set(key, current);
      return map;
    }, new Map<string, { count: number; pending: number; approved: number; paid: number; void: number; total: number }>())
  ).sort(([a], [b]) => b.localeCompare(a));

  const getCommissionStatusClass = (status: CommissionRecord['status']) => {
    if (status === 'paid') return 'bg-emerald-500/15 text-emerald-400';
    if (status === 'approved') return 'bg-brand-orange-500/15 text-brand-orange-400';
    if (status === 'void') return 'bg-red-500/15 text-red-400';
    return 'bg-amber-500/15 text-amber-400';
  };

  const canManageOrder = (order: Order) => ['new', 'contacted'].includes(order.status);

  const handleDeleteOrder = async (order: Order) => {
    if (!canManageOrder(order)) {
      setActionMsg('Order yang sudah diproses admin tidak bisa dihapus reseller.');
      return;
    }

    if (!window.confirm(`Hapus order afiliasi "${order.full_name}"?`)) return;

    try {
      setActionMsg('');
      setDeletingOrderId(order.id);
      await db.deleteOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setActionMsg('Order afiliasi berhasil dihapus.');
    } catch (err: any) {
      console.error('Failed to delete reseller order:', err);
      setActionMsg(err?.message || 'Gagal menghapus order afiliasi.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-xs">Memuat dashboard reseller...</p>
      </div>
    );
  }

  return (
    <div id="reseller-dashboard" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Reseller Console</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Halo, {reseller?.name || currentUser?.name || 'Reseller'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Pantau order afiliasi, project yang closing, dan estimasi komisi dari penjualanmu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('#/reseller/orders/new')}
          className="bg-brand-orange-600 hover:bg-brand-orange-700 text-black text-xs font-extrabold tracking-wide px-4 py-2.5 rounded-full cursor-pointer shadow-lg shadow-brand-orange-600/10 flex items-center justify-center space-x-1.5 shrink-0 self-start lg:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Input Order Afiliasi</span>
        </button>
      </div>

      {!reseller && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-5 text-xs leading-relaxed">
          Data reseller belum terhubung ke akun ini. Minta admin utama mengisi `user_id` pada tabel resellers.
        </div>
      )}

      {actionMsg && (
        <div className="bg-dark-900 border border-dark-600 text-slate-300 rounded-2xl p-4 text-xs font-semibold">
          {actionMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl min-h-[128px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Estimasi Komisi</span>
            <BadgeDollarSign className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{rupiah(estimatedCommission)}</h2>
          <p className="text-[10px] text-slate-500 mt-3">Gabungan dari order afiliasi dan project closing.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl min-h-[128px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Komisi Pending</span>
            <Hourglass className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{rupiah(pendingCommission)}</h2>
          <p className="text-[10px] text-amber-400 mt-3">Menunggu approval atau pembayaran admin.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl min-h-[128px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Komisi Dibayar</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">{rupiah(paidCommission)}</h2>
          <p className="text-[10px] text-emerald-400 mt-3">Total komisi dengan status paid.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-2xl min-h-[128px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Rate Reseller</span>
            <CircleDollarSign className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-mono">{Number(reseller?.commission_rate || 0)}%</h2>
          <p className="text-[10px] text-slate-500 mt-3">Persentase diatur oleh admin utama.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-brand-orange-500" />
              <h3 className="text-base font-bold text-white">Order Afiliasi Terbaru</h3>
            </div>
            <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
              {orders.length} ORDER
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <UserRoundCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Belum ada order afiliasi</p>
              <p className="text-xs mt-1">Klik Input Order Afiliasi untuk mengirim lead pertama.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-650/50">
              {orders.slice(0, 5).map((order) => {
                const manageable = canManageOrder(order);
                return (
                  <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-dark-850/40 transition">
                    <div>
                      <p className="text-sm font-bold text-white">{order.full_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{order.website_type}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : 'Baru'}</p>
                    </div>
                    <div className="flex items-center md:justify-end gap-2">
                      <div className="text-left md:text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-brand-orange-500/10 text-brand-orange-400 text-[10px] font-bold uppercase">
                          {order.status}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Est. komisi {rupiah(Number(order.estimated_commission || 0))}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 bg-dark-900 border border-dark-600 p-1 rounded-lg">
                        <button
                          type="button"
                          disabled={!manageable}
                          onClick={() => onNavigate(`#/reseller/orders/edit/${order.id}`)}
                          title={manageable ? 'Edit Order' : 'Order sudah diproses admin'}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-dark-800 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!manageable || deletingOrderId === order.id}
                          onClick={() => handleDeleteOrder(order)}
                          title={manageable ? 'Hapus Order' : 'Order sudah diproses admin'}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:text-slate-700 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <BriefcaseBusiness className="w-5 h-5 text-brand-orange-500" />
              <h3 className="text-base font-bold text-white">Project Closing</h3>
            </div>
            <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
              {activeProjects} AKTIF
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <CalendarDays className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Belum ada project closing</p>
              <p className="text-xs mt-1">Project akan muncul setelah admin mengonversi order menjadi deal.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-650/50">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="p-4 hover:bg-dark-850/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{project.project_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{project.client_name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-600 text-[9px] font-mono text-slate-300 uppercase">
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">{project.payment_scheme === 'per_user_contract' ? 'Kontrak per user' : 'Sekali bayar'}</span>
                    <span className="text-brand-orange-400">{rupiah(Number(project.estimated_commission || 0))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-orange-500" />
              <h3 className="text-base font-bold text-white">Ringkasan Komisi Bulanan</h3>
            </div>
            <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
              {commissionMonths.length} BULAN
            </span>
          </div>

          {commissionMonths.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <FileSpreadsheet className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Belum ada riwayat komisi</p>
              <p className="text-xs mt-1">Riwayat muncul setelah admin mengonversi order menjadi project.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-650/50">
              {commissionMonths.slice(0, 6).map(([month, summary]) => (
                <div key={month} className="p-4 hover:bg-dark-850/40 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {month === 'unknown' ? 'Tanpa Periode' : new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{summary.count} catatan komisi</p>
                    </div>
                    <p className="font-mono text-sm font-black text-brand-orange-400">{rupiah(summary.total)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono">
                    <span className="bg-amber-500/10 text-amber-400 rounded px-2 py-1">Pending {rupiah(summary.pending)}</span>
                    <span className="bg-brand-orange-500/10 text-brand-orange-400 rounded px-2 py-1">Approved {rupiah(summary.approved)}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 rounded px-2 py-1">Paid {rupiah(summary.paid)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-dark-600 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <BadgeDollarSign className="w-5 h-5 text-brand-orange-500" />
              <h3 className="text-base font-bold text-white">Riwayat Komisi</h3>
            </div>
            <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
              {commissions.length} RECORD
            </span>
          </div>

          {commissions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <BadgeDollarSign className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Belum ada komisi tercatat</p>
              <p className="text-xs mt-1">Komisi dibuat setelah admin validasi deal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                    <th className="p-4">Periode</th>
                    <th className="p-4">Basis</th>
                    <th className="p-4">Komisi</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-650/40 text-slate-300">
                  {commissions.slice(0, 8).map((record) => (
                    <tr key={record.id} className="hover:bg-dark-850/40 transition">
                      <td className="p-4 font-mono text-slate-400">
                        {record.period_month ? new Date(record.period_month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-white">{rupiah(Number(record.base_amount || 0))}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Rate {Number(record.commission_rate || 0)}%</p>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400">
                        {rupiah(Number(record.commission_amount || 0))}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCommissionStatusClass(record.status)}`}>
                          {record.status}
                        </span>
                        {record.paid_at && (
                          <p className="text-[10px] text-slate-500 mt-1">Dibayar {new Date(record.paid_at).toLocaleDateString('id-ID')}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
