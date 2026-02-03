import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './layout/Sidebar';
import { AppProvider, useApp } from './AppContext';

const AppContent = () => {
  const { theme, t } = useApp();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      alert(t.loginTitle + " Error");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 dark:text-white">{t.loading}</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-transparent dark:border-slate-800">
          <h2 className="mb-6 text-center text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.loginTitle}</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block ml-1">{t.email}</label>
              <input 
                type="email" className="w-full rounded-xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block ml-1">{t.password}</label>
              <input 
                type="password" className="w-full rounded-xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button className="w-full mt-4 rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95">
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} onLogout={() => signOut(auth)} />
      <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white">{t[activeModule]}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{t.welcome} {t[activeModule]}.</p>
            </header>
            
            {/* Тук ще влиза съдържанието на всеки модул */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px]">
               <span className="text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest text-sm">Модулът се подготвя...</span>
            </div>
          </div>
      </main>
    </div>
  );
};

const AppV1 = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default AppV1;
