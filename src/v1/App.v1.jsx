import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './layout/Sidebar';
import { AppProvider, useApp } from './AppContext';

const AppContent = () => {
  const { theme, t, language } = useApp();
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
      alert(language === 'bg' ? "Грешка при вход" : "Login Error");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-slate-900 dark:text-white">Зареждане...</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-slate-950 p-4 transition-colors">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-xl border dark:border-slate-800">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-800 dark:text-white">{t.loginTitle}</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder={t.email} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input 
              type="password" placeholder={t.password} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-500/30">
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} onLogout={() => signOut(auth)} />
      <main className="flex-1 overflow-y-auto p-8 dark:text-white text-slate-800">
          {/* Динамично зареждане на модулите */}
          <h1 className="text-3xl font-bold">{t[activeModule]}</h1>
          <p className="mt-4 opacity-70">Добре дошли в модул {t[activeModule]}. Логиката ще бъде добавена тук.</p>
      </main>
    </div>
  );
};

// Главният компонент, който обвива всичко
const AppV1 = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default AppV1;
