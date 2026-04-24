import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { Upload, AlertCircle, CheckCircle2, Loader2, Trash2, Moon, Sun, Settings } from 'lucide-react';

interface AdminPanelProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function AdminPanel({ theme, setTheme }: AdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    setError(false);

    try {
      // Decode array buffer explicitly to handle potential Windows-1252/ANSI charset from Notepad
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      let text = decoder.decode(buffer);
      
      // If it contains a lot of replacement characters, it might be windows-1252
      if (text.includes('\uFFFD')) {
        text = new TextDecoder('windows-1252').decode(buffer);
      }

      // Split by line and clean up
      const lines = text.split('\n')
        .map(line => {
          // Remove carriage returns
          let cleaned = line.replace(/(\r\n|\n|\r)/gm, "").trim();
          // Remove wrapping double quotes (added by excel when there's a comma like "4,7")
          cleaned = cleaned.replace(/^"|"$/g, '');
          // Unescape double-double quotes
          cleaned = cleaned.replace(/""/g, '"');
          // Replace any remaining weird characters just in case
          cleaned = cleaned.replace(/\uFFFD/g, '-');
          return cleaned;
        })
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        throw new Error("File CSV/TXT tampak kosong.");
      }

      // Firestore allows up to 500 writes per batch.
      const BATCH_SIZE = 450;

      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = lines.slice(i, i + BATCH_SIZE);
        
        chunk.forEach((sparepartName) => {
          const docRef = doc(collection(db, 'spareparts'));
          batch.set(docRef, { name: sparepartName });
        });

        await batch.commit();
      }

      setMessage(`Berhasil upload ${lines.length} sparepart ke database!`);
    } catch (err: any) {
      console.error(err);
      setError(true);
      setMessage(err.message || 'Gagal memproses file.');
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA data sparepart di database?")) return;
    
    setLoading(true);
    setMessage('');
    setError(false);
    
    try {
      const querySnapshot = await getDocs(collection(db, 'spareparts'));
      if (querySnapshot.empty) {
        setMessage('Database sudah kosong.');
        setLoading(false);
        return;
      }

      let batch = writeBatch(db);
      let count = 0;
      let total = 0;

      for (const snapshotDoc of querySnapshot.docs) {
        batch.delete(snapshotDoc.ref);
        count++;
        total++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }

      setMessage(`Berhasil menghapus ${total} data lama dari database!`);
    } catch (err: any) {
      console.error(err);
      setError(true);
      setMessage(err.message || 'Gagal menghapus database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
        <Settings className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
        Pengaturan Sistem
      </h2>

      {/* Theme Toggle Section */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-zinc-800/80 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-500 dark:text-indigo-400">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Tema Tampilan</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Pilih mode warna terang atau gelap</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-indigo-400 shadow-sm border border-zinc-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800/50'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Database Import Section */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-zinc-800/80 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg text-indigo-500 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Admin Panel: Import Spareparts</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Upload file CSV/TXT berisi daftar sparepart langsung</p>
            </div>
          </div>
          <button 
            onClick={handleClearDatabase}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Kosongkan Database
          </button>
        </div>

      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-center w-full min-h-[100px] border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl cursor-pointer transition-all group">
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Memproses upload...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">Klik untuk upload</span> atau drag and drop
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Hanya CSV atau TXT (.csv, .txt)</span>
              </>
            )}
          </div>
          <input 
            type="file" 
            accept=".csv, .txt" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={loading}
          />
        </label>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            error 
              ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' 
              : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20'
          }`}>
            {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {message}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
