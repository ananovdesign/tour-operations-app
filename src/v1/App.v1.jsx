import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './layout/Sidebar';

// Модели за модулите (засега празни)
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Табло (Dashboard)</h1><p className="mt-4 text-gray-600">Тук ще прехвърлим статистиките.</p></div>;
const Reservations = () => <div className="p-8"><h1 className="text-2xl font-bold">Резервации</h1><p className="mt-4 text-gray-600">Тук ще бъде списъкът с туристи.</p></div>;

const AppV1 = () => {
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

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="flex h-screen items-center justify-center">Зареждане...</div>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-800">Вход в Системата</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Имейл" className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Парола" className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700">Влез</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        {activeModule === 'dashboard' && <Dashboard />}
        {activeModule === 'reservations' && <Reservations />}
        {/* Тук ще добавяме останалите модули един по един */}
      </main>
    </div>
  );
};

export default AppV1;
