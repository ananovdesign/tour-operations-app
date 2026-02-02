import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './modules/Auth/Login';
import Dashboard from './modules/Dashboard/Dashboard';
import Reservations from './modules/Reservations/Reservations';
import BusTourList from './modules/BusTours/BusTourList';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { 
    LayoutDashboard, 
    ClipboardList, 
    Bus, 
    Wallet, 
    LogOut, 
    Settings,
    Bell
} from 'lucide-react';

const AppContent = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('dashboard');
    const { displayCurrency, setDisplayCurrency } = useCurrency();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!user) return <Login />;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="p-8">
                    <h1 className="text-2xl font-black tracking-tighter text-blue-500">DYNAMAX <span className="text-white text-xs block font-normal tracking-widest opacity-50">VERSION 3.0</span></h1>
                </div>
                
                <nav className="flex-1 px-4 space-y-1">
                    <SidebarItem 
                        icon={<LayoutDashboard size={20}/>} 
                        label="Dashboard" 
                        active={activeModule === 'dashboard'} 
                        onClick={() => setActiveModule('dashboard')} 
                    />
                    <SidebarItem 
                        icon={<ClipboardList size={20}/>} 
                        label="Reservations" 
                        active={activeModule === 'reservations'} 
                        onClick={() => setActiveModule('reservations')} 
                    />
                    <SidebarItem 
                        icon={<Bus size={20}/>} 
                        label="Bus Tours" 
                        active={activeModule === 'bus-tours'} 
                        onClick={() => setActiveModule('bus-tours')} 
                    />
                    <SidebarItem 
                        icon={<Wallet size={20}/>} 
                        label="Finance" 
                        active={activeModule === 'finance'} 
                        onClick={() => setActiveModule('finance')} 
                    />
                </nav>

                <div className="p-4 m-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {user.email[0].toUpperCase()}
                        </div>
                        <div className="truncate flex-1">
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={14} /> Изход
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b flex items-center justify-between px-8 z-10">
                    <h2 className="text-xl font-bold text-slate-800 capitalize">{activeModule}</h2>
                    
                    <div className="flex items-center gap-6">
                        {/* CURRENCY SWITCHER */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border">
                            <button 
                                onClick={() => setDisplayCurrency('BGN')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${displayCurrency === 'BGN' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                            >BGN</button>
                            <button 
                                onClick={() => setDisplayCurrency('EUR')}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${displayCurrency === 'EUR' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                            >EUR</button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Bell size={20}/></button>
                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Settings size={20}/></button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {activeModule === 'dashboard' && <Dashboard userId={user.uid} />}
                    {activeModule === 'reservations' && <Reservations userId={user.uid} />}
                    {activeModule === 'bus-tours' && <BusTourList userId={user.uid} />}
                </div>
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
        {icon} <span>{label}</span>
    </button>
);

const AppV3 = () => (
    <CurrencyProvider>
        <AppContent />
    </CurrencyProvider>
);

export default AppV3;
