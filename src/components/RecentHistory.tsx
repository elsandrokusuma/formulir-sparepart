import { Package, Clock, User } from 'lucide-react';
import type { RequestRecord } from '../types';

interface Props {
  records: RequestRecord[];
}

export default function RecentHistory({ records }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800/80 transition-colors">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        Recent History
      </h3>
      
      {records.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-zinc-600">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Belum ada riwayat permintaan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-100 dark:hover:border-zinc-700 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-slate-800 dark:text-zinc-100">{record.sparepart}</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-md">
                  Qty: {record.quantity}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <User className="w-3 h-3 mr-1" />
                <span className="truncate">{record.requester} • {record.division}</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2">
                {new Date(record.timestamp).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
