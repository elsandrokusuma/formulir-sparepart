import { useState } from 'react';
import type { RequestRecord } from '../types';
import { Trash2, X, FileText, Calendar, User, Building, Package, Tag, Layers } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  records: RequestRecord[];
}

export default function FullHistory({ records }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<RequestRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    // Tutup modal secara langsung agar terasa instan (Optimistic UI)
    setDeleteConfirmId(null);
    setSelectedId(null);

    try {
      await deleteDoc(doc(db, 'requests', id));
    } catch (err) {
      console.error('Gagal menghapus', err);
      alert('Gagal menghapus riwayat. Periksa koneksi internet Anda.');
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const handleRowDoubleClick = (record: RequestRecord) => {
    setDetailRecord(record);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-zinc-800/80 mt-12 transition-colors">
        <p className="text-slate-500 dark:text-zinc-400">Belum ada riwayat permintaan.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100 dark:border-zinc-800/80 mt-12 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Permintaan ({records.length})</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Klik 1x untuk menghapus, klik 2x untuk melihat detail.</p>
        </div>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900/80 text-sm font-semibold text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <th className="p-4 pl-6 whitespace-nowrap">Tanggal & Jam</th>
                <th className="p-4 whitespace-nowrap">Sparepart</th>
                <th className="p-4 whitespace-nowrap">Qty</th>
                <th className="p-4 whitespace-nowrap">Peminta</th>
                <th className="p-4 whitespace-nowrap">Divisi</th>
                <th className="p-4 whitespace-nowrap text-right pr-6">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {records.map((record, idx) => (
                <tr 
                  key={record.id} 
                  onClick={() => handleRowClick(record.id)}
                  onDoubleClick={() => handleRowDoubleClick(record)}
                  className={`group relative cursor-pointer border-b border-slate-100 dark:border-zinc-800 hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50/30 dark:bg-zinc-800/20'} ${selectedId === record.id ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="p-4 pl-6 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(record.timestamp).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-zinc-100">{record.sparepart}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold rounded-md text-xs">
                      {record.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-300">{record.requester}</td>
                  <td className="p-4 text-slate-600 dark:text-zinc-300">{record.division}</td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-end">
                      <div className="h-12 w-24 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded p-1 flex items-center justify-center pointer-events-none overflow-hidden shrink-0 transition-all duration-300">
                        <img src={record.signature} alt="Tanda Tangan" className="max-h-full max-w-full object-contain brightness-0 dark:invert" />
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-end ${selectedId === record.id ? 'w-11 ml-3 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
                        <button
                          onClick={(e) => handleDelete(record.id, e)}
                          className="p-2.5 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 hover:scale-105 transition-all shrink-0"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Pop-up */}
      {detailRecord && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={() => setDetailRecord(null)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-zinc-800 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Detail Permintaan
              </h3>
              <button 
                onClick={() => setDetailRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3 text-sm border-b border-slate-100 dark:border-zinc-800/50 pb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Tanggal & Waktu</p>
                  <p className="text-slate-800 dark:text-zinc-100 font-semibold">
                    {new Date(detailRecord.timestamp).toLocaleString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-100 dark:border-zinc-800/50 pb-4">
                 <div className="flex-1 flex items-center gap-3 text-sm">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Sparepart</p>
                    <p className="text-slate-800 dark:text-zinc-100 font-semibold">{detailRecord.sparepart}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Quantity</p>
                    <p className="text-slate-800 dark:text-zinc-100 font-semibold">{detailRecord.quantity} Unit</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-100 dark:border-zinc-800/50 pb-4">
                <div className="flex-1 flex items-center gap-3 text-sm">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Peminta</p>
                    <p className="text-slate-800 dark:text-zinc-100 font-semibold">{detailRecord.requester}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-3 text-sm">
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium">Divisi</p>
                    <p className="text-slate-800 dark:text-zinc-100 font-semibold">{detailRecord.division}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tanda Tangan
                </p>
                <div className="w-full bg-slate-50 dark:bg-zinc-800/50 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl p-4 flex items-center justify-center h-32 relative overflow-hidden">
                  <img 
                    src={detailRecord.signature} 
                    alt="Tanda Tangan" 
                    className="max-h-full max-w-full object-contain brightness-0 dark:invert opacity-80" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200" onClick={() => setDeleteConfirmId(null)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Riwayat?</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Data permintaan ini akan dihapus secara permanen dan tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
