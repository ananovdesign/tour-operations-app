import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './layout/Sidebar';
import Dashboard from './modules/Dashboard'; // УВЕРИ СЕ, ЧЕ ТОЗИ РЕД Е ТУК
import { AppProvider, useApp } from './AppContext';

const AppContent = () => {
  const { t } = useApp();
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
      alert("Грешка при вход: " + error.message);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 dark:text-white">{t.loading}</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
          <h2 className="mb-8 text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Система за управление</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder={t.email} className="w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input 
              type="password" placeholder={t.password} className="w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="w-full mt-4 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95">
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} onLogout={() => signOut(auth)} />
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t[activeModule]}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">{t.welcome} {t[activeModule]}.</p>
              </div>
            </header>
            
            {/* Динамично зареждане на модулите */}
            {activeModule === 'dashboard' ? (
                <Dashboard />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                   <span className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-lg italic">Модулът {t[activeModule]} е в процес на разработка</span>
                </div>
            )}
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
