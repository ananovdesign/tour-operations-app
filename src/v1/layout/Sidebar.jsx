import React from 'react';
import { LayoutDashboard, Users, Hotel, Bus, FileText, Megaphone, CheckSquare, LogOut, Sun, Moon, Languages } from 'lucide-react';
import { useApp } from '../AppContext';

const Sidebar = ({ activeModule, setActiveModule, onLogout }) => {
  const { theme, toggleTheme, language, toggleLanguage, t } = useApp();

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'reservations', label: t.reservations, icon: Users },
    { id: 'hotels', label: t.hotels, icon: Hotel },
    { id: 'bus', label: t.bus, icon: Bus },
    { id: 'invoices', label: t.invoices, icon: FileText },
    { id: 'marketing', label: t.marketing, icon: Megaphone },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">DYNAMAX</h1>
        <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold mt-1">Travel Management</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all ${
                activeModule === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={20} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Настройки - Тема и Език */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-xs font-bold uppercase">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
          
          <button 
            onClick={toggleLanguage}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Languages size={18} />
            <span className="text-xs font-bold uppercase">{language === 'bg' ? 'EN' : 'BG'}</span>
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="font-bold text-xs uppercase">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
