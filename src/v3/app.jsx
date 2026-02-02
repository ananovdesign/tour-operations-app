import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './modules/Auth/Login';
import Reservations from './modules/Reservations/Reservations';
import { LayoutDashboard, ClipboardList, Bus, Wallet, LogOut } from 'lucide-react';
import { CurrencyProvider } from './context/CurrencyContext';

const AppV3 = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('dashboard');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center">Зареждане...</div>;
    if (!user) return <Login />;

    return (
        <CurrencyProvider>
            <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
                {/* SIDEBAR */}
                <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-wider text-blue-400">DYNAMAX v3</h1>
                    </div>
                    
                    <nav className="flex-1 overflow-y-auto py-4">
                        <button onClick={() => setActiveModule('dashboard')} className={`w-full flex items-center space-x-3 px-6 py-3 ${activeModule === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}>
                            <LayoutDashboard size={20} /> <span>Dashboard</span>
                        </button>
                        <button onClick={() => setActiveModule('reservations')} className={`w-full flex items-center space-x-3 px-6 py-3 ${activeModule === 'reservations' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}>
                            <ClipboardList size={20} /> <span>Reservations</span>
                        </button>
                        {/* ОСТАНАЛИТЕ БУТОНИ... */}
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <button 
                            onClick={() => signOut(auth)}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={18} /> <span>Изход</span>
                        </button>
                    </div>
                </aside>

                {/* CONTENT AREA */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
                        <h2 className="text-lg font-semibold uppercase">{activeModule}</h2>
                        <div className="text-sm text-slate-500 italic">{user.email}</div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeModule === 'reservations' ? (
                            <Reservations userId={user.uid} />
                        ) : (
                            <div className="text-center mt-20 text-slate-400">Модулът е в разработка...</div>
                        )}
                    </div>
                </main>
            </div>
        </CurrencyProvider>
    );
};

export default AppV3;
