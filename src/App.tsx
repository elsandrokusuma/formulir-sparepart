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
  const [notifications, setNotifications] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Real-time listener from Firestore
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: RequestRecord[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as RequestRecord);
      });
      setRecords(requestsData);
    }, (error) => {
      console.warn('Firestore listener error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Called synchronously from RequestForm — no await so UI never blocks
  const handleSuccess = (newRequest: Omit<RequestRecord, 'id' | 'timestamp'>): void => {
    const record: RequestRecord = {
      ...newRequest,
      id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      timestamp: new Date().toISOString(),
    };

    // 1. Update local state immediately so history shows right away
    setRecords(prev => [record, ...prev]);

    // 2. Show success toast + bell notification immediately
    setShowSuccess(true);
    setNotifications(prev => prev + 1);
    setTimeout(() => setShowSuccess(false), 4000);

    // 3. Download TXT receipt
    const dateStr = new Date(record.timestamp).toLocaleString('id-ID');
    const fileContent = [
      '====================================',
      'BUKTI PERMINTAAN SPAREPART',
      '====================================',
      `Tanggal/Jam : ${dateStr}`,
      `ID Request  : ${record.id}`,
      '',
      'Rincian Permintaan:',
      `- Sparepart  : ${record.sparepart}`,
      `- Quantity   : ${record.quantity}`,
      '',
      'Data Peminta:',
      `- Nama       : ${record.requester}`,
      `- Divisi     : ${record.division}`,
      '',
      '(Tanda tangan digital tersimpan di sistem)',
      '====================================',
      'Dicetak otomatis dari Form Permintaan Sparepart.',
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Permintaan_${record.sparepart.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 4. Save to Firestore in background — not awaited, never blocks UI
    addDoc(collection(db, 'requests'), record)
      .then(docRef => console.log('Saved to Firestore:', docRef.id))
      .catch(err => console.error('Firestore save error (non-blocking):', err));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-indigo-500/30 text-slate-800 dark:text-slate-200 transition-colors duration-300 w-full overflow-x-hidden">

      {/* Success Toast */}
      <div className={`fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-green-500/30 flex items-center gap-3 transition-all duration-300 transform ${showSuccess ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="w-6 h-6 shrink-0" />
        <div>
          <div className="font-semibold">Berhasil dikirim!</div>
          <div className="text-sm text-green-100">Data permintaan telah disimpan.</div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-slate-200 dark:border-zinc-800/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl p-1.5 sm:p-2 shadow-lg shadow-indigo-500/20">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg tracking-wide hidden md:block">
                Formulir Sparepart
              </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-zinc-900 px-1 py-1 rounded-2xl border border-slate-200 dark:border-zinc-800">
              {([
                { id: 'form', label: 'Formulir', icon: FileText },
                { id: 'history', label: 'Riwayat', icon: Clock },
                { id: 'settings', label: 'Admin', icon: Settings },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-700/50'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Bell Notification */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setNotifications(0)}
              title={`${notifications} notifikasi`}
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce border-2 border-white dark:border-black">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'form' ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <RequestForm onSuccess={handleSuccess} theme={theme} />
            <RecentHistory records={records.slice(0, 5)} />
          </div>
        ) : activeTab === 'history' ? (
          <FullHistory records={records} />
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
