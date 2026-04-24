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
  const [msg, setMsg] = useState('');
  const [signed, setSigned] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const q = query(collection(db, 'spareparts'), orderBy('name'));
    const unsub = onSnapshot(q, snap => {
      setDbSpareparts(snap.docs.map(d => (d.data().name as string)).filter(Boolean));
    }, () => {});
    return unsub;
  }, []);

  const submit = () => {
    console.log('[FORM] Submit clicked!', { sparepart, qty, requester, division, signed });

    if (!sparepart.trim()) { setMsg('⚠️ Isi nama sparepart terlebih dahulu.'); return; }
    if (!qty || Number(qty) < 1) { setMsg('⚠️ Isi quantity yang valid.'); return; }
    if (!requester.trim()) { setMsg('⚠️ Isi nama peminta.'); return; }
    if (!division) { setMsg('⚠️ Pilih divisi.'); return; }
    if (!signed) { setMsg('⚠️ Gambar tanda tangan terlebih dahulu.'); return; }

    const sig = sigRef.current?.getTrimmedCanvas().toDataURL('image/png') ?? '';
    
    console.log('[FORM] All valid, calling onSuccess');
    setMsg('');

    onSuccess({
      sparepart: sparepart.trim(),
      quantity: Number(qty),
      requester: requester.trim(),
      division,
      signature: sig,
    });

    // reset
    setSparepart('');
    setQty('');
    setRequester('');
    setDivision('');
    setSigned(false);
    sigRef.current?.clear();
  };

  const allFilled = sparepart.trim() && qty && Number(qty) > 0 && requester.trim() && division && signed;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-t-2xl border-b border-slate-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Formulir Permintaan Sparepart</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Isi semua field dan tanda tangan, lalu tekan Send Request.</p>
      </div>

      <div className="px-6 py-5 space-y-4">

        {/* Error / validation message */}
        {msg && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* Sparepart */}
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Sparepart *</label>
          <input
            type="text"
            placeholder="Ketik atau pilih sparepart..."
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={sparepart}
            onChange={e => { setSparepart(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && dbSpareparts.filter(p => p.toLowerCase().includes(sparepart.toLowerCase())).length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {dbSpareparts.filter(p => p.toLowerCase().includes(sparepart.toLowerCase())).map(p => (
                <button
                  key={p} type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                  onMouseDown={() => { setSparepart(p); setShowDropdown(false); }}
                >{p}</button>
              ))}
            </div>
          )}
        </div>

        {/* Qty */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Quantity *</label>
          <input
            type="number" min="1" placeholder="0"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />
        </div>

        {/* Name + Division */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nama Peminta *</label>
            <input
              type="text" placeholder="Nama lengkap"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={requester}
              onChange={e => setRequester(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Divisi *</label>
            <select
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Tanda Tangan Digital *{' '}
            {signed && <span className="text-green-500 font-normal text-xs">✓ Sudah ditandatangani</span>}
          </label>
          <div className="relative border-2 border-dashed rounded-xl overflow-hidden"
            style={{ borderColor: signed ? '#22c55e' : '#cbd5e1' }}>
            <SignatureCanvas
              ref={sigRef}
              penColor={theme === 'dark' ? '#fff' : '#111'}
              canvasProps={{ className: 'w-full h-36 cursor-crosshair block' }}
              onBegin={() => setSigned(false)}
              onEnd={() => setSigned(true)}
            />
            <button type="button"
              className="absolute top-2 right-2 text-xs bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 px-2 py-1 rounded text-slate-500 dark:text-zinc-300"
              onClick={() => { sigRef.current?.clear(); setSigned(false); }}
            >Clear</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-b-2xl flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setSparepart(''); setQty(''); setRequester(''); setDivision('');
            setSigned(false); setMsg('');
            sigRef.current?.clear();
          }}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
        >✕ Cancel</button>

        <button
          type="button"
          onClick={submit}
          className={`px-6 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg transition-all ${
            allFilled
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/30 cursor-pointer'
              : 'bg-blue-400/60 cursor-pointer'
          }`}
        >
          ➤ Send Request
        </button>
      </div>
    </div>
  );
}
