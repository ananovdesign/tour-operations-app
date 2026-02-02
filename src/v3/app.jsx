import React, { useState } from 'react';
import Reservations from './modules/Reservations/Reservations';
import { auth } from '../firebase'; // За да вземем реалния потребител
import { 
  LayoutDashboard, ClipboardList, Bus, Wallet, 
  FileText, Package, Files, Megaphone, CheckSquare, Settings 
} from 'lucide-react';

// Импортираме нашия нов валутен контекст (който създадохме по-рано)
import { CurrencyProvider } from './context/CurrencyContext';

const AppV3 = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'reservations', label: 'Reservations', icon: <ClipboardList size={20} /> },
    { id: 'busTours', label: 'Bus Tours', icon: <Bus size={20} /> },
    { id: 'finance', label: 'Finance & Payments', icon: <Wallet size={20} /> },
    { id: 'invoicing', label: 'Invoicing', icon: <FileText size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'documents', label: 'Documents', icon: <Files size={20} /> },
    { id: 'marketing', label: 'Marketing Hub', icon: <Megaphone size={20} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  ];

  return (
    <CurrencyProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* MODEREN SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wider text-blue-400">DYNAMAX v3</h1>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors ${
                  activeModule === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ОСНОВНО СЪДЪРЖАНИЕ */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-tight">
              {menuItems.find(m => m.id === activeModule)?.label}
            </h2>
            
            <div className="flex items-center space-x-4">
              {/* Тук ще сложим превключвателя за BGN/EUR */}
              <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                <button className="px-3 py-1 text-xs font-bold rounded bg-white shadow-sm text-blue-600">EUR</button>
                <button className="px-3 py-1 text-xs font-bold text-slate-500">BGN</button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
             {/* Тук ще се зареждат отделните модули */}
             <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
                <p className="text-slate-400">Модулът <b>{activeModule}</b> се подготвя за прехвърляне...</p>
             </div>
          </div>
        </main>
      </div>
    </CurrencyProvider>
  );
};

export default AppV3;
