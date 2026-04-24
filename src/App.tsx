import { useState, useEffect } from 'react';
import RequestForm from './components/RequestForm';
import RecentHistory from './components/RecentHistory';
import FullHistory from './components/FullHistory';
import AdminPanel from './components/AdminPanel';
import type { RequestRecord } from './types';
import { Package, Bell, Settings, FileText, CheckCircle2, Clock } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';

function App() {
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'settings'>('form');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load from Firestore on mount
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: RequestRecord[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as RequestRecord);
      });
      setRecords(requestsData);
    }, (error) => {
      console.error('Failed to parse history from Firestore', error);
    });

    return () => unsubscribe();
  }, []);

  const handleSuccess = (newRequest: Omit<RequestRecord, 'id' | 'timestamp'>) => {
    const record: RequestRecord = {
      ...newRequest,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Save to Firestore
    addDoc(collection(db, 'requests'), record).catch(error => {
      console.error('Error adding document: ', error);
    });

    // Buat file Teks (TXT) untuk di-download
    const dateStr = new Date(record.timestamp).toLocaleString('id-ID');
    const fileContent = `====================================
BUKTI PERMINTAAN SPAREPART
====================================
Tanggal/Jam : ${dateStr}
ID Request  : ${record.id}

Rincian Permintaan:
- Sparepart  : ${record.sparepart}
- Quantity   : ${record.quantity}

Data Peminta:
- Nama Peminta : ${record.requester}
- Divisi       : ${record.division}

(Tanda tangan digital telah tersimpan aman di sistem)
====================================
Dicetak otomatis dari Form Permintaan Sparepart.`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Permintaan_${record.sparepart.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-indigo-500/30 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Toast Notification */}
      <div className={`fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-green-500/30 flex items-center gap-3 transition-all duration-300 transform ${showSuccess ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="w-6 h-6" />
        <div className="font-medium">
          Berhasil! Data permintaan telah disimpan.
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-slate-200 dark:border-zinc-800/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl p-2 shadow-lg shadow-indigo-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-800 dark:text-slate-100 font-bold text-lg tracking-wide hidden sm:block">Formulir Sparepart</span>
            </div>

            {/* Middle: Navigation Links */}
            <div className="flex items-center gap-1 sm:gap-6 bg-slate-100 dark:bg-zinc-900 px-2 sm:px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 transition-colors">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'form'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <FileText className="w-4 h-4 hidden sm:block" />
                <span>Formulir</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'history'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <Clock className="w-4 h-4 hidden sm:block" />
                <span>Riwayat</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <Settings className="w-4 h-4 hidden sm:block" />
                <span>Pengaturan</span>
              </button>
            </div>

            {/* Right: Notifications */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50 dark:border-black"></div>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in relative z-10">
            <div className="lg:col-span-8 order-2 lg:order-1 space-y-8">
              <RequestForm onSuccess={handleSuccess} theme={theme} />
            </div>
            <div className="lg:col-span-4 order-1 lg:order-2 space-y-6 lg:sticky lg:top-24">
              <RecentHistory records={records.slice(0, 5)} />
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="animate-fade-in">
            <FullHistory records={records} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <AdminPanel theme={theme} setTheme={setTheme} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
