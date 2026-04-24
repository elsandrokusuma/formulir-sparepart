import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import type { RequestRecord } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const DIVISIONS = ['Teknisi', 'Gudang', 'Customer Service', 'Manajemen', 'Lainnya'];

interface Props {
  onSuccess: (record: Omit<RequestRecord, 'id' | 'timestamp'>) => void;
  theme: 'light' | 'dark';
}

export default function RequestForm({ onSuccess, theme }: Props) {
  const [sparepart, setSparepart] = useState('');
  const [qty, setQty] = useState('');
  const [requester, setRequester] = useState('');
  const [division, setDivision] = useState('');
  const [dbSpareparts, setDbSpareparts] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const q = query(collection(db, 'spareparts'), orderBy('name'));
    const unsub = onSnapshot(q, snap => {
      setDbSpareparts(snap.docs.map(d => d.data().name as string).filter(Boolean));
    }, () => {});
    return unsub;
  }, []);

  const handleClick = () => {
    // Validate one by one — show EXACTLY what is missing
    if (!sparepart) { setValidationMsg('❌ Sparepart belum dipilih/diisi.'); return; }
    if (!qty || Number(qty) <= 0) { setValidationMsg('❌ Quantity belum diisi / tidak valid.'); return; }
    if (!requester.trim()) { setValidationMsg('❌ Nama peminta belum diisi.'); return; }
    if (!division) { setValidationMsg('❌ Divisi belum dipilih.'); return; }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setValidationMsg('❌ Tanda tangan belum diisi. Silakan gambar tanda tangan di kotak atas.');
      return;
    }

    setValidationMsg('');

    const sig = sigRef.current.getTrimmedCanvas().toDataURL('image/png');

    // Call parent — parent handles Firestore + toast
    onSuccess({ sparepart, quantity: Number(qty), requester, division, signature: sig });

    // Reset form
    setSparepart('');
    setQty('');
    setRequester('');
    setDivision('');
    setFilter('');
    sigRef.current.clear();
  };

  const filtered = dbSpareparts.filter(p => p.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ fontFamily: 'sans-serif' }} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xl overflow-visible">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-t-2xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Formulir Permintaan Sparepart</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Isi semua field dan tanda tangan, lalu klik Send Request.</p>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Sparepart */}
        <div className="relative">
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-zinc-300">
            Sparepart <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cari atau ketik nama sparepart..."
            value={filter || sparepart}
            onFocus={() => setShowDropdown(true)}
            onChange={e => {
              setFilter(e.target.value);
              setSparepart(e.target.value);
              setShowDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {filtered.map(p => (
                <button
                  key={p}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                  onMouseDown={() => {
                    setSparepart(p);
                    setFilter(p);
                    setShowDropdown(false);
                  }}
                >{p}</button>
              ))}
            </div>
          )}
        </div>

        {/* Qty */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-zinc-300">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />
        </div>

        {/* Name + Division */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-zinc-300">
              Nama Peminta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nama lengkap"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={requester}
              onChange={e => setRequester(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-zinc-300">
              Divisi <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={division}
              onChange={e => setDivision(e.target.value)}
            >
              <option value="">Pilih divisi...</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-zinc-300">
            Tanda Tangan Digital <span className="text-red-500">*</span>
          </label>
          <div className="relative border-2 border-dashed border-slate-300 dark:border-zinc-600 rounded-xl bg-slate-50 dark:bg-zinc-950 overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              penColor={theme === 'dark' ? '#fff' : '#111'}
              canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
            />
            <button
              type="button"
              className="absolute top-2 right-2 text-xs bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 px-2 py-1 rounded text-slate-500 dark:text-zinc-300"
              onClick={() => sigRef.current?.clear()}
            >Clear</button>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Gambar tanda tangan Anda di kotak abu-abu di atas</p>
        </div>

        {/* Validation Message — very visible */}
        {validationMsg && (
          <div className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm font-medium">
            {validationMsg}
          </div>
        )}

      </div>

      {/* Buttons */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-b-2xl flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setSparepart(''); setQty(''); setRequester(''); setDivision('');
            setFilter(''); setValidationMsg('');
            sigRef.current?.clear();
          }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
        >
          ✕ Cancel
        </button>
        <button
          type="button"
          onClick={handleClick}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/30 transition-colors"
        >
          ➤ Send Request
        </button>
      </div>
    </div>
  );
}
