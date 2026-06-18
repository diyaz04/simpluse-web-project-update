import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Reseller, ResellerStatus } from '../types';
import {
  BadgePercent,
  Check,
  CircleDollarSign,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserPlus,
  UsersRound
} from 'lucide-react';

type ResellerDraft = Partial<Reseller> & { password?: string };

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ResellerDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newReseller, setNewReseller] = useState<ResellerDraft>({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    commission_rate: 10,
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    async function loadResellers() {
      try {
        setLoading(true);
        const data = await db.getResellers();
        setResellers(data);
        setDrafts(Object.fromEntries(data.map((item) => [item.id, { ...item }])));
      } catch (err: any) {
        console.error('Failed to load resellers:', err);
        setErrorMsg(err?.message || 'Gagal memuat daftar reseller.');
      } finally {
        setLoading(false);
      }
    }

    loadResellers();
  }, []);

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const activeCount = resellers.filter((item) => item.status === 'active').length;
  const averageRate = resellers.length
    ? resellers.reduce((sum, item) => sum + Number(item.commission_rate || 0), 0) / resellers.length
    : 0;

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setCreating(true);

    try {
      const created = await db.saveReseller({
        ...newReseller,
        commission_rate: Number(newReseller.commission_rate) || 10,
        status: (newReseller.status || 'active') as ResellerStatus
      });
      setResellers((items) => [created, ...items]);
      setDrafts((items) => ({ ...items, [created.id]: { ...created } }));
      setNewReseller({
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        commission_rate: 10,
        status: 'active',
        notes: ''
      });
      setSuccessMsg('Akun reseller berhasil dibuat dan sudah terhubung ke role reseller.');
    } catch (err: any) {
      console.error('Failed to create reseller:', err);
      setErrorMsg(err?.message || 'Gagal mendaftarkan reseller.');
    } finally {
      setCreating(false);
    }
  };

  const handleDraftChange = (id: string, patch: ResellerDraft) => {
    setDrafts((items) => ({
      ...items,
      [id]: {
        ...(items[id] || {}),
        ...patch
      }
    }));
  };

  const handleSaveDraft = async (id: string) => {
    clearMessages();
    setSavingId(id);

    try {
      const draft = drafts[id];
      const updated = await db.saveReseller({
        id,
        user_id: draft.user_id,
        name: draft.name || '',
        email: draft.email || '',
        whatsapp: draft.whatsapp || '',
        commission_rate: Number(draft.commission_rate) || 10,
        status: (draft.status || 'active') as ResellerStatus,
        notes: draft.notes || ''
      });
      setResellers((items) => items.map((item) => item.id === id ? updated : item));
      setDrafts((items) => ({ ...items, [id]: { ...updated } }));
      setSuccessMsg(`Data reseller ${updated.name} berhasil diperbarui.`);
    } catch (err: any) {
      console.error('Failed to update reseller:', err);
      setErrorMsg(err?.message || 'Gagal memperbarui reseller.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div id="admin-resellers" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Partner Sales</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Kelola Reseller</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Daftarkan akun reseller, atur persentase komisi, dan pantau status akses partner.
          </p>
        </div>
      </div>

      {(errorMsg || successMsg) && (
        <div className={`border rounded-lg p-4 text-xs font-semibold ${errorMsg ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {errorMsg || successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Reseller</span>
            <UsersRound className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-mono">{resellers.length}</h2>
          <p className="text-[10px] text-slate-500 mt-3">{activeCount} akun aktif.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Rata-rata Komisi</span>
            <BadgePercent className="w-5 h-5 text-brand-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-mono">{averageRate.toFixed(1)}%</h2>
          <p className="text-[10px] text-slate-500 mt-3">Default affiliate biasanya 10%.</p>
        </div>

        <div className="bg-[#111] border border-dark-600 p-5 rounded-lg min-h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Contoh Deal 5 Juta</span>
            <CircleDollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-white font-mono">{rupiah(5000000 * 0.1)}</h2>
          <p className="text-[10px] text-slate-500 mt-3">Ilustrasi komisi 10% dari harga deal.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-dark-600 flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-brand-orange-500" />
          <h3 className="text-base font-bold text-white">Daftarkan Akun Reseller Baru</h3>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Nama Reseller</label>
            <input
              required
              value={newReseller.name || ''}
              onChange={(e) => setNewReseller((item) => ({ ...item, name: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              placeholder="Nama partner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Email Login</label>
            <input
              required
              type="email"
              value={newReseller.email || ''}
              onChange={(e) => setNewReseller((item) => ({ ...item, email: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              placeholder="reseller@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">WhatsApp</label>
            <input
              required
              value={newReseller.whatsapp || ''}
              onChange={(e) => setNewReseller((item) => ({ ...item, whatsapp: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Password Awal</label>
            <input
              required
              type="text"
              minLength={6}
              value={newReseller.password || ''}
              onChange={(e) => setNewReseller((item) => ({ ...item, password: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Komisi (%)</label>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={newReseller.commission_rate ?? 10}
              onChange={(e) => setNewReseller((item) => ({ ...item, commission_rate: Number(e.target.value) }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Status</label>
            <select
              value={newReseller.status || 'active'}
              onChange={(e) => setNewReseller((item) => ({ ...item, status: e.target.value as ResellerStatus }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">Catatan Admin</label>
            <input
              value={newReseller.notes || ''}
              onChange={(e) => setNewReseller((item) => ({ ...item, notes: e.target.value }))}
              className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2.5 text-xs text-white outline-none"
              placeholder="Area, fokus market, atau catatan komisi"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="bg-brand-orange-600 hover:bg-brand-orange-700 disabled:bg-dark-700 disabled:text-slate-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-full cursor-pointer inline-flex items-center space-x-2"
          >
            {creating ? (
              <span>Mendaftarkan...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Buat Akun Reseller</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-[#111] border border-dark-600 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-dark-600 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <UsersRound className="w-5 h-5 text-brand-orange-500" />
            <h3 className="text-base font-bold text-white">Daftar Reseller</h3>
          </div>
          <span className="bg-dark-800 text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 border border-dark-600 rounded-lg">
            {resellers.length} PARTNER
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-xs">Memuat reseller...</p>
          </div>
        ) : resellers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UsersRound className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Belum ada reseller</p>
            <p className="text-xs mt-1">Daftarkan akun reseller pertama lewat form di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                  <th className="p-4">Identitas</th>
                  <th className="p-4">Komisi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Catatan</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-650/40 text-slate-300">
                {resellers.map((reseller) => {
                  const draft = drafts[reseller.id] || reseller;
                  return (
                    <tr key={reseller.id} className="hover:bg-dark-850/40 transition">
                      <td className="p-4 min-w-[260px]">
                        <input
                          value={draft.name || ''}
                          onChange={(e) => handleDraftChange(reseller.id, { name: e.target.value })}
                          className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-bold"
                        />
                        <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                          <label className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <input
                              type="email"
                              value={draft.email || ''}
                              onChange={(e) => handleDraftChange(reseller.id, { email: e.target.value })}
                              className="w-full bg-transparent border-b border-dark-650 focus:border-brand-orange-500 outline-none text-slate-300"
                            />
                          </label>
                          <label className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-brand-orange-500" />
                            <input
                              value={draft.whatsapp || ''}
                              onChange={(e) => handleDraftChange(reseller.id, { whatsapp: e.target.value })}
                              className="w-full bg-transparent border-b border-dark-650 focus:border-brand-orange-500 outline-none text-slate-300"
                            />
                          </label>
                        </div>
                      </td>

                      <td className="p-4 min-w-[140px]">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={draft.commission_rate ?? 10}
                            onChange={(e) => handleDraftChange(reseller.id, { commission_rate: Number(e.target.value) })}
                            className="w-24 bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2 pr-7 text-xs text-white outline-none font-mono"
                          />
                          <span className="absolute left-[4.5rem] top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Default order affiliate.</p>
                      </td>

                      <td className="p-4 min-w-[150px]">
                        <select
                          value={draft.status || 'active'}
                          onChange={(e) => handleDraftChange(reseller.id, { status: e.target.value as ResellerStatus })}
                          className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Nonaktif</option>
                        </select>
                      </td>

                      <td className="p-4 min-w-[260px]">
                        <textarea
                          value={draft.notes || ''}
                          onChange={(e) => handleDraftChange(reseller.id, { notes: e.target.value })}
                          rows={3}
                          className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                          placeholder="Catatan internal"
                        />
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={savingId === reseller.id}
                          onClick={() => handleSaveDraft(reseller.id)}
                          className="inline-flex items-center gap-1.5 bg-dark-800 hover:bg-dark-700 disabled:bg-dark-900 disabled:text-slate-600 text-slate-200 border border-dark-600 transition text-[11px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
                        >
                          {savingId === reseller.id ? (
                            <span>Menyimpan...</span>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </>
                          )}
                        </button>
                        {draft.user_id && (
                          <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Auth linked</span>
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
