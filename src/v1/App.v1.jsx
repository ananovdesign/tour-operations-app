import React, { useState, useEffect } from 'react';
// ПОПРАВКА: Ако файлът е в src/v1/, използваме само една точка '../', за да стигнем до src/firebase
import { auth } from '../firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './layout/Sidebar';
import Dashboard from './modules/Dashboard';
import Reservations from './modules/Reservations'; 
import { AppProvider, useApp } from './AppContext';
import Hotels from './modules/Hotels';
import BusTours from './modules/BusTours';
import Finance from './modules/Finance';
import Tools from './modules/Tools';
import Tasks from './modules/Tasks'; // <--- НОВ ИМПОРТ ЗА ЗАДАЧИ

const AppContent = () => {
  const { t, language } = useApp();
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
      alert(t.loginError || "Грешка при вход: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 dark:text-white font-sans font-black uppercase tracking-widest italic">
        {t.loading || 'Зареждане...'}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors font-sans">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white dark:bg-slate-900 p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
          <h2 className="mb-8 text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">
            {t.systemTitle || 'Система за управление'}
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder={t.email || 'Email'} 
              className="w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={loginEmail} 
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder={t.password || 'Парола'} 
              className="w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800 dark:text-white p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button className="w-full mt-4 rounded-2xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95">
              {t.loginBtn || 'Вход'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        onLogout={() => signOut(auth)} 
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-end">
            <div className="animate-in slide-in-from-left duration-500">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {t[activeModule] || (activeModule === 'tools' ? 'Инструменти' : activeModule === 'tasks' ? 'Задачи' : activeModule)}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                {t.welcome} {t[activeModule] || activeModule}.
              </p>
            </div>
          </header>
          
          <div className="min-h-[600px]">
            {activeModule === 'dashboard' ? (
                <Dashboard lang={language} />
            ) : activeModule === 'reservations' ? (
                <Reservations lang={language} />
            ) : activeModule === 'hotels' ? (  
                <Hotels lang={language} />
            ) : activeModule === 'bus' ? (  
                <BusTours lang={language} />
            ) : activeModule === 'finance' ? ( 
                <Finance lang={language} />
            ) : activeModule === 'tools' ? (
                <Tools lang={language} />
            ) : activeModule === 'tasks' ? (  // <--- ТУК СЕ ЗАРЕЖДАТ ЗАДАЧИТЕ
                <Tasks />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 shadow-sm border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                   <span className="text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-lg italic">
                     Модулът {t[activeModule] || activeModule} е в процес на разработка
                   </span>
                </div>
            )}
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
