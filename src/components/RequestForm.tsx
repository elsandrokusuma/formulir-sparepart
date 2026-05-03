import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import type { RequestRecord } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const DIVISIONS = ['Teknisi', 'Gudang', 'Customer Service', 'Manajemen', 'Lainnya'];

interface Props {
  onSuccess: (record: Omit<RequestRecord, 'id' | 'timestamp'>) => void;
}

const BLANK_SIG_LENGTH = 2000; // empty canvas PNG is ~1-2KB

export default function RequestForm({ onSuccess }: Props) {
  const [sparepart, setSparepart] = useState('');
  const [qty, setQty] = useState('');
  const [requester, setRequester] = useState('');
  const [division, setDivision] = useState('');
  const [dbSpareparts, setDbSpareparts] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [msg, setMsg] = useState('');
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const q = query(collection(db, 'spareparts'), orderBy('name'));
    const unsub = onSnapshot(q, snap => {
      setDbSpareparts(snap.docs.map(d => (d.data().name as string)).filter(Boolean));
    }, () => {});
    return unsub;
  }, []);

  const reset = () => {
    setSparepart(''); setQty(''); setRequester(''); setDivision('');
    setMsg('');
    sigRef.current?.clear();
  };

  const submit = () => {
    // Validate text fields
    if (!sparepart.trim()) { setMsg('Pilih atau ketik nama sparepart.'); return; }
    if (!qty || Number(qty) < 1) { setMsg('Isi quantity yang valid (minimal 1).'); return; }
    if (!requester.trim()) { setMsg('Isi nama peminta.'); return; }
    if (!division) { setMsg('Pilih divisi.'); return; }

    // Check signature using data URL length (reliable cross-version)
    const sigData = sigRef.current?.toDataURL() ?? '';
    if (sigData.length < BLANK_SIG_LENGTH) {
      setMsg('Gambar tanda tangan di kotak abu-abu terlebih dahulu.');
      return;
    }

    setMsg('');

    // Get trimmed signature
    let sig = sigData;
    try { sig = sigRef.current?.getTrimmedCanvas().toDataURL('image/png') ?? sigData; } catch { /* fallback */ }

    console.log('[RequestForm] Calling onSuccess with:', sparepart, qty, requester, division);

    onSuccess({
      sparepart: sparepart.trim(),
      quantity: Number(qty),
      requester: requester.trim(),
      division,
      signature: sig,
    });

    reset();
  };

  // Button is blue when text fields are filled (don't depend on signature for color)
  const textFilled = Boolean(sparepart.trim() && qty && Number(qty) > 0 && requester.trim() && division);

  const filtered = dbSpareparts.filter(p => p.toLowerCase().includes(sparepart.toLowerCase()));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xl">

      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-t-2xl border-b border-slate-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Formulir Permintaan Sparepart</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Isi semua field, gambar tanda tangan, lalu klik Send Request.</p>
      </div>

      <div className="px-6 py-5 space-y-4">

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
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {filtered.map(p => (
                <button key={p} type="button"
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
          <input type="number" min="1" placeholder="0"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={qty} onChange={e => setQty(e.target.value)}
          />
        </div>

        {/* Name + Division */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nama Peminta *</label>
            <input type="text" placeholder="Nama lengkap"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={requester} onChange={e => setRequester(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Divisi *</label>
            <select
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={division} onChange={e => setDivision(e.target.value)}
            >
              <option value="">Pilih divisi...</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Tanda Tangan Digital *</label>
          <div className="relative border-2 border-dashed border-slate-300 dark:border-zinc-600 rounded-xl overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigRef}
              penColor="#111111"
              canvasProps={{ className: 'w-full h-36 cursor-crosshair block' }}
            />
            <button type="button"
              className="absolute top-2 right-2 text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-200 shadow-sm"
              onClick={() => sigRef.current?.clear()}
            >Clear</button>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Gambar tanda tangan Anda di kotak putih di atas, lalu klik Send Request.</p>
        </div>
      </div>

      {/* Validation message RIGHT ABOVE buttons so user can always see it */}
      {msg && (
        <div className="mx-6 mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          {msg}
        </div>
      )}

      {/* Buttons */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-b-2xl flex justify-end gap-3">
        <button type="button" onClick={reset}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
          ✕ Cancel
        </button>
        <button
          id="send-request-btn"
          type="button"
          onClick={submit}
          className={`px-6 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${
            textFilled ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-blue-400 hover:bg-blue-500'
          }`}
        >
          ➤ Send Request
        </button>
      </div>
    </div>
  );
}
