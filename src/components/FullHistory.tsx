import type { RequestRecord } from '../types';

interface Props {
  records: RequestRecord[];
}

export default function FullHistory({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-zinc-800/80 mt-12 transition-colors">
        <p className="text-slate-500 dark:text-zinc-400">Belum ada riwayat permintaan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100 dark:border-zinc-800/80 mt-12 transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/50">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Permintaan ({records.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/80 text-sm font-semibold text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
              <th className="p-4 pl-6 whitespace-nowrap">Tanggal & Jam</th>
              <th className="p-4 whitespace-nowrap">Sparepart</th>
              <th className="p-4 whitespace-nowrap">Qty</th>
              <th className="p-4 whitespace-nowrap">Peminta</th>
              <th className="p-4 whitespace-nowrap">Divisi</th>
              <th className="p-4 whitespace-nowrap">Tanda Tangan</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {records.map((record, idx) => (
              <tr key={record.id} className={`border-b border-slate-100 dark:border-zinc-800 hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50/30 dark:bg-zinc-800/20'}`}>
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
                <td className="p-4">
                  <div className="h-12 w-24 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded p-1 flex items-center justify-center pointer-events-none overflow-hidden">
                    <img src={record.signature} alt="Tanda Tangan" className="max-h-full max-w-full object-contain brightness-0 dark:invert" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
