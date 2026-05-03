import { useState, useEffect } from 'react';
import RequestForm from './components/RequestForm';
import RecentHistory from './components/RecentHistory';
import FullHistory from './components/FullHistory';
import AdminPanel from './components/AdminPanel';
import type { RequestRecord } from './types';
import { Package, Bell, Settings, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';

function App() {
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'settings'>('form');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Live Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ ...d.data(), id: d.id } as RequestRecord)));
    }, err => console.warn('Firestore listener error:', err));
  }, []);

  const handleSuccess = (newRequest: Omit<RequestRecord, 'id' | 'timestamp'>) => {
    const record: RequestRecord = {
      ...newRequest,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    // ✅ 1. Update local list instantly
    setRecords(prev => [record, ...prev]);

    // ✅ 2. Show success toast + bell badge
    setShowToast(true);
    setNotifCount(n => n + 1);
    setTimeout(() => setShowToast(false), 4000);

    // ✅ 3. Download TXT receipt
    const lines = [
      '====================================',
      'BUKTI PERMINTAAN SPAREPART',
      '====================================',
      `Tanggal : ${new Date(record.timestamp).toLocaleString('id-ID')}`,
      `ID      : ${record.id}`,
      '',
      `Sparepart : ${record.sparepart}`,
      `Quantity  : ${record.quantity}`,
      `Peminta   : ${record.requester}`,
      `Divisi    : ${record.division}`,
      '',
      '(Tanda tangan digital tersimpan di sistem)',
      '====================================',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Permintaan_${record.sparepart.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // ✅ 4. Save to Firestore in background (non-blocking)
    const { id, ...dataToSave } = record;
    addDoc(collection(db, 'requests'), dataToSave)
      .then(ref => console.log('✅ Firestore saved:', ref.id))
      .catch(err => console.warn('⚠️ Firestore error (data saved locally):', err));
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-200 transition-colors">

      {/* Toast Notification */}
      <div className={`fixed top-20 right-4 z-[9999] flex items-center gap-3 bg-green-500 text-white px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <div>
          <div className="font-bold text-sm">Berhasil dikirim!</div>
          <div className="text-xs text-green-100">Data tersimpan di history.</div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-500 p-2 rounded-xl shadow-md">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base hidden sm:block text-slate-800 dark:text-white">Formulir Sparepart</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl gap-0.5">
            {([
              { id: 'form', label: 'Formulir', icon: FileText },
              { id: 'history', label: 'Riwayat', icon: Clock },
              { id: 'settings', label: 'Admin', icon: Settings },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Bell */}
          <button
            type="button"
            onClick={() => setNotifCount(0)}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-black animate-bounce">
                {notifCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'form' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <RequestForm onSuccess={handleSuccess} />
            <RecentHistory records={records.slice(0, 5)} />
          </div>
        )}
        {activeTab === 'history' && <FullHistory records={records} />}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <AdminPanel theme={theme} setTheme={setTheme} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
