import React, { useState, useEffect } from 'react';
// Импортиране на услуги и компоненти
import { dbService } from './services/dbService';

// Импортиране на отделните модули (Увери се, че файловете съществуват в src/v2/modules/)
import ReservationsManager from './modules/ReservationsManager';
import InvoiceManager from './modules/InvoiceManager';
import BusTourManager from './modules/BusTourManager';
import FinancialDashboard from './modules/FinancialDashboard';
import MarketingHubModule from './modules/MarketingHubModule';
import TaskManagementModule from './modules/TaskManagementModule';

const AppV2 = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Зареждане на финансови данни за Dashboard-а
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await dbService.getDocuments('invoices');
        setInvoices(data);
      } catch (error) {
        console.error("Грешка при зареждане:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: '🏠 Dashboard', color: 'bg-slate-800' },
    { id: 'reservations', label: '📅 Reservations', color: 'bg-blue-600' },
    { id: 'busTours', label: '🚌 Bus Tours', color: 'bg-cyan-600' },
    { id: 'financial', label: '💰 Financial', color: 'bg-emerald-600' },
    { id: 'documents', label: '📄 Invoices & Documents', color: 'bg-orange-600' },
    { id: 'marketing', label: '🚀 Marketing Hub', color: 'bg-purple-600' },
    { id: 'tasks', label: '✅ Task Management', color: 'bg-rose-600' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      {/* СТРАНИЧНО МЕНЮ (SIDEBAR) */}
      <aside className="w-72 bg-slate-900 text-white p-6 shadow-2xl flex flex-col fixed h-full">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">DYNAMEX <span className="text-blue-500">v2</span></h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">Euro Era 2026</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                activeTab === item.id 
                  ? `${item.color} shadow-lg scale-105 z-10` 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">Курс: 1.95583 BGN</p>
          <p className="text-[10px] text-slate-600 mt-1 italic italic">Data Backup: Active</p>
        </div>
      </aside>

      {/* ОСНОВНА ЧАСТ */}
      <main className="flex-1 ml-72 p-10">
        {/* Хедър на страницата */}
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label.split(' ').slice(1).join(' ')}
            </h1>
            <p className="text-slate-500 text-sm">Управление на бизнес процеси в реално време</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Текуща валута</p>
              <p className="text-lg font-bold text-emerald-600">EURO (EUR)</p>
            </div>
          </div>
        </header>

        {/* ДИНАМИЧНО СЪДЪРЖАНИЕ */}
        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <FinancialDashboard invoices={invoices} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400 italic">
                   Графики на продажбите (в процес на разработка)
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="font-bold mb-4">Последни задачи</h3>
                   <TaskManagementModule limit={5} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && <ReservationsManager />}
          {activeTab === 'busTours' && <BusTourManager />}
          {activeTab === 'financial' && <FinancialDashboard invoices={invoices} />}
          {activeTab === 'documents' && <InvoiceManager />}
          {activeTab === 'marketing' && <MarketingHubModule />}
          {activeTab === 'tasks' && <TaskManagementModule />}
        </div>
      </main>
    </div>
  );
};

export default AppV2;
