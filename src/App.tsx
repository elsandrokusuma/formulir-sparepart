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

  const handleSuccess = async (newRequest: Omit<RequestRecord, 'id' | 'timestamp'>) => {
    console.log('App: handleSuccess started', newRequest);
    
    const record = {
      ...newRequest,
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending' 
    } as RequestRecord;

    // UPDATE LOCAL STATE IMMEDIATELY (Optimistic Update)
    // Ini agar user langsung melihat data di history meskipun Firestore lambat
    setRecords(prev => [record, ...prev]);

    try {
      console.log('App: Attempting Firestore save:', record);
      
      // Save to Firestore (non-blocking for UI feedback)
      addDoc(collection(db, 'requests'), record)
        .then((docRef) => {
          console.log('App: Document saved successfully with ID:', docRef.id);
        })
        .catch((error) => {
          console.error('App: Firestore save failed:', error);
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
    } catch (error: any) {
      console.error('App: Error in handleSuccess:', error);
      alert(`Terjadi masalah: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-indigo-500/30 text-slate-800 dark:text-slate-200 transition-colors duration-300 w-full overflow-x-hidden">
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
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl p-1.5 sm:p-2 shadow-lg shadow-indigo-500/20">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg tracking-wide hidden md:block">Formulir Sparepart</span>
            </div>

            {/* Middle: Navigation Links */}
            <div className="flex items-center gap-0.5 sm:gap-4 bg-slate-100/50 dark:bg-zinc-900/50 sm:bg-slate-100 sm:dark:bg-zinc-900 px-1 sm:px-4 py-1 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 sm:border-slate-200 sm:dark:border-zinc-800 transition-colors">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[13px] sm:text-sm font-medium transition-all ${activeTab === 'form'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Formulir</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[13px] sm:text-sm font-medium transition-all ${activeTab === 'history'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Riwayat</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[13px] sm:text-sm font-medium transition-all ${activeTab === 'settings'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                  }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Pengaturan</span>
                <span className="sm:hidden">Admin</span>
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
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative z-10">
            <RequestForm onSuccess={handleSuccess} theme={theme} />
            <RecentHistory records={records.slice(0, 5)} />
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
