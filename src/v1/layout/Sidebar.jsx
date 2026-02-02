import React from 'react';
import { LayoutDashboard, Users, Hotel, Bus, FileText, Megaphone, CheckSquare, LogOut } from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Табло', icon: LayoutDashboard },
    { id: 'reservations', label: 'Резервации', icon: Users },
    { id: 'hotels', label: 'Хотели', icon: Hotel },
    { id: 'bus', label: 'Автобуси', icon: Bus },
    { id: 'invoices', label: 'Фактури', icon: FileText },
    { id: 'marketing', label: 'Маркетинг', icon: Megaphone },
    { id: 'tasks', label: 'Задачи', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
      <div className="p-6 text-center border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">TOUR AGENCY</h1>
        <p className="text-xs text-slate-400 mt-1">Система за управление</p>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                activeModule === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Изход</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
