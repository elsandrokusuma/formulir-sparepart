import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Send, X, CheckCircle, Search, ChevronDown } from 'lucide-react';
import type { RequestRecord } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const DIVISIONS = [
  'Teknisi', 'Gudang', 'Customer Service', 'Manajemen', 'Lainnya'
];

interface Props {
  onSuccess: (record: Omit<RequestRecord, 'id' | 'timestamp'>) => void;
  theme: 'light' | 'dark';
}

export default function RequestForm({ onSuccess, theme }: Props) {
  const [sparepart, setSparepart] = useState('');
  const [qty, setQty] = useState('');
  const [requester, setRequester] = useState('');
  const [division, setDivision] = useState('');
  const [searchSparepart, setSearchSparepart] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dbSpareparts, setDbSpareparts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  
  const [error, setError] = useState('');
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load spareparts from Firestore
  useEffect(() => {
    const q = query(collection(db, 'spareparts'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parts: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) parts.push(data.name);
      });
      setDbSpareparts(parts);
    });
    return () => unsubscribe();
  }, []);

  const filteredParts = dbSpareparts.filter(p => p.toLowerCase().includes(searchSparepart.toLowerCase()));

  // Setup click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setSparepart('');
    setSearchSparepart('');
    setQty('');
    setRequester('');
    setDivision('');
    sigCanvas.current?.clear();
    setError('');
  };

  const isFormValid = sparepart && qty && requester.trim() && division && !isSignatureEmpty;

  const handleSend = async () => {
    if (!isFormValid) return;
    
    console.log('handleSend started');
    const signatureStr = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '';
    
    setError('');
    setIsSubmitting(true);
    console.log('Validation passed, calling onSuccess');
    
    try {
      await onSuccess({
        sparepart,
        quantity: Number(qty),
        requester,
        division,
        signature: signatureStr
      });
      console.log('onSuccess completed successfully');
      handleReset();
      setIsSignatureEmpty(true);
    } catch (err: any) {
      console.error('Error in handleSend:', err);
      setError('Terjadi kesalahan saat mengirim data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100 dark:border-zinc-800/80 transition-colors">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-900">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-white">Formulir Permintaan Sparepart</h2>
        <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          Silakan isi formulir permintaan sparepart dengan lengkap agar proses pengecekan stok dan pengadaan dapat dilakukan dengan cepat.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 shrink-0 text-red-500 hidden" />
            {error}
          </div>
        )}

        {/* Form Grid */}
        <div className="space-y-6">
          
          <div className="space-y-1 relative" ref={containerRef}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Sparepart apa yang diminta? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari atau ketik manual sparepart..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium text-slate-800 dark:text-zinc-100"
                value={searchSparepart}
                onChange={(e) => {
                  setSearchSparepart(e.target.value);
                  setSparepart(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 w-5 h-5 pointer-events-none" />
            </div>
            {showDropdown && filteredParts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-xl rounded-xl max-h-60 overflow-y-auto">
                {filteredParts.map(part => (
                  <button
                    key={part}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors text-slate-700 dark:text-zinc-200 font-medium border-b border-slate-50 dark:border-zinc-700 last:border-0"
                    onClick={() => {
                      setSparepart(part);
                      setSearchSparepart(part);
                      setShowDropdown(false);
                    }}
                  >
                    {part}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Berapa quantity? <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium text-slate-800 dark:text-zinc-100"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Siapa yang meminta? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama peminta"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium text-slate-800 dark:text-zinc-100"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Divisi apa? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                 <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium appearance-none text-slate-800 dark:text-zinc-100"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                >
                  <option value="" disabled className="dark:bg-zinc-800">Pilih divisi...</option>
                  {DIVISIONS.map(div => (
                    <option key={div} value={div} className="dark:bg-zinc-800">{div}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Tanda Tangan digital <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-950 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor={theme === 'dark' ? '#f4f4f5' : 'black'}
                canvasProps={{ className: 'w-full h-40 cursor-crosshair' }} 
                onEnd={() => setIsSignatureEmpty(sigCanvas.current?.isEmpty() ?? true)}
              />
              <button 
                type="button"
                onClick={() => {
                  sigCanvas.current?.clear();
                  setIsSignatureEmpty(true);
                }}
                className="absolute top-2 right-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded text-slate-500 dark:text-zinc-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Clear
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-3 rounded-b-2xl transition-colors relative z-50">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="relative z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-red-600 dark:hover:text-red-400 transition-all focus:ring-2 focus:ring-slate-200 dark:focus:ring-zinc-700 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={isSubmitting || !isFormValid}
          className={`relative z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${
            isFormValid 
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 focus:ring-blue-500' 
              : 'bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-zinc-500 cursor-not-allowed'
          } ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className={`w-5 h-5 ${isFormValid ? 'text-white' : 'text-slate-400'}`} />
              <span>Send Request</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
