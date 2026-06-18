import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Project, ProjectStatus } from '../types';
import { 
  FolderGit2, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  PhoneCall, 
  Sparkles,
  Info
} from 'lucide-react';

interface ProjectsListProps {
  onNavigate: (route: string) => void;
}

export default function ProjectsList({ onNavigate }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await db.getProjects();
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        console.error('Failed to load projects table:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Live filter evaluation
  useEffect(() => {
    let result = projects;

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => 
          p.project_name.toLowerCase().includes(q) || 
          p.client_name.toLowerCase().includes(q) ||
          (p.website_category && p.website_category.toLowerCase().includes(q)) ||
          (p.public_name && p.public_name.toLowerCase().includes(q))
      );
    }

    // Apply Status Filter Toggle
    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter.toLowerCase());
    }

    setFilteredProjects(result);
  }, [searchQuery, statusFilter, projects]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus secara permanen proyek "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      try {
        await db.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        alert('Gagal menghapus proyek, cek console log');
      }
    }
  };

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const statFilters = ['All', 'Ongoing', 'Done', 'Maintenance', 'Cancelled'];

  return (
    <div id="projects-ledger" className="space-y-6">
      
      {/* Header and Add project shortcut button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-brand-orange-500 font-mono text-xs font-bold uppercase tracking-wider block">Kelola Arsip</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Daftar Proyek Klien</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Edit status, detail teknologi layanan, sisa tagihan klien, dan kustomisasi portfolio publik.</p>
        </div>
        <button
          onClick={() => onNavigate('#/dashboard/projects/new')}
          className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Tambah Project Baru</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#111] p-4 rounded-2xl border border-dark-600">
        
        {/* Search input container */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan nama klien, nama proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-650 focus:border-brand-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Filter badging controllers */}
        <div className="flex flex-wrap items-center gap-1.5 select-none">
          {statFilters.map((fl) => {
            const isSelected = statusFilter === fl;
            return (
              <button
                key={fl}
                onClick={() => setStatusFilter(fl)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide border cursor-pointer transition ${
                  isSelected 
                    ? 'bg-brand-orange-600 border-brand-orange-600 text-white shadow' 
                    : 'bg-dark-900 border-dark-650 text-slate-400 hover:text-white'
                }`}
              >
                {fl === 'All' ? 'Semua Status' : fl}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAJOR TABLE LEDGER */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-mono text-xs">Memuat daftar kontrak kerja proyek...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#111] border border-dark-600 p-12 text-center rounded-2xl max-w-md mx-auto space-y-2">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-white font-bold text-base">Proyek tidak ditemukan</p>
          <p className="text-slate-400 text-xs">Ubah filter status atau coba kueri pencarian yang lain.</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-dark-600 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-650 text-slate-400 font-mono uppercase font-semibold">
                  <th className="p-4">Identitas Klien</th>
                  <th className="p-4">Nama Proyek</th>
                  <th className="p-4">Tanggal Kerja</th>
                  <th className="p-4">Rincian Finansial</th>
                  <th className="p-4">Status Proyek</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-650/40 text-slate-300">
                {filteredProjects.map((p) => {
                  const tagihanSisa = p.total_price - p.dp_paid;
                  return (
                    <tr key={p.id} className="hover:bg-dark-850/40 transition">
                      
                      {/* Client column */}
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{p.client_name}</div>
                        <div className="space-y-0.5 text-slate-400 text-[10px] sm:text-xs mt-1">
                          <p className="flex items-center space-x-1.5">
                            <span className="text-slate-500 font-mono">WA:</span>
                            <a href={`https://wa.me/${p.client_wa.replace(/[^0-9]/g,'')}`} target="_blank" className="hover:underline text-brand-orange-500 font-medium">
                              {p.client_wa}
                            </a>
                          </p>
                          <p className="flex items-center space-x-1.5">
                            <span className="text-slate-500 font-mono font-medium text-[10px]">Email:</span>
                            <span className="truncate">{p.client_email}</span>
                          </p>
                        </div>
                      </td>

                      {/* Project info & Portfolio status */}
                      <td className="p-4">
                        <div className="font-semibold text-white text-sm">{p.project_name}</div>
                        {p.website_category && (
                          <span className="inline-block mt-1 bg-brand-orange-500/10 text-brand-orange-400 border border-brand-orange-500/20 text-[9px] font-mono tracking-wide px-1.5 py-0.5 rounded font-bold uppercase select-none">
                            {p.website_category}
                          </span>
                        )}
                        {p.reseller_name && (
                          <span className="inline-block mt-1 ml-1 bg-brand-orange-500/10 text-brand-orange-400 border border-brand-orange-500/20 text-[9px] font-mono tracking-wide px-1.5 py-0.5 rounded font-bold uppercase select-none">
                            Reseller: {p.reseller_name}
                          </span>
                        )}
                        {p.is_public ? (
                          <div className="flex items-center space-x-1 sm:space-x-1.5 mt-1">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-mono tracking-wide px-1.5 py-0.5 rounded font-bold uppercase select-none">
                              Public Portfolio Live
                            </span>
                            {p.live_url && (
                              <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange-500 hover:underline text-[10px] flex items-center space-x-0.5">
                                <span>Visit</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block mt-1 bg-dark-850 text-slate-500 border border-dark-600/70 text-[9px] font-mono tracking-wide px-1.5 py-0.5 rounded select-none uppercase">
                            Private / Internal
                          </span>
                        )}
                        <p className="text-slate-400 mt-2 line-clamp-1 max-w-[200px] italic">{p.internal_notes || '-'}</p>
                      </td>

                      {/* Dates duration */}
                      <td className="p-4">
                        <div className="flex flex-col space-y-1 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-500">Mulai: </span>
                            <span className="text-slate-300">{p.start_date}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold">Batas: </span>
                            <span className="text-ブランド-オレンジ text-emerald-400">{p.deadline}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payment tracking */}
                      <td className="p-4">
                        <div className="font-bold text-white font-mono">{rupiah(p.total_price)}</div>
                        <div className="space-y-0.5 text-[10px] mt-1 font-mono">
                          <p className="text-emerald-400">Bayar (DP): {rupiah(p.dp_paid)}</p>
                          {p.reseller_name && (
                            <p className="text-brand-orange-400">
                              Komisi {Number(p.commission_rate || 0)}%: {rupiah(Number(p.estimated_commission || 0))}
                            </p>
                          )}
                          {tagihanSisa > 0 ? (
                            <p className="text-red-400">Kurang: {rupiah(tagihanSisa)}</p>
                          ) : (
                            <p className="text-emerald-500 font-bold">LUNAS ✓</p>
                          )}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[9px] font-mono tracking-wide font-extrabold rounded uppercase ${
                          p.status === 'ongoing' 
                            ? 'bg-amber-500/15 text-amber-500' 
                            : p.status === 'done'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : p.status === 'maintenance'
                            ? 'bg-brand-orange-500/15 text-brand-orange-500'
                            : 'bg-slate-700/15 text-slate-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-dark-900 border border-dark-600 p-1 rounded-xl">
                          <button
                            onClick={() => onNavigate(`#/dashboard/projects/edit/${p.id}`)}
                            title="Edit Proyek"
                            className="p-2 text-slate-400 hover:text-white hover:bg-dark-800 rounded-lg transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(p.id, p.project_name)}
                            title="Hapus Proyek"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
