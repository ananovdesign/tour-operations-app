import React, { useState } from 'react';
import ReservationsManager from './modules/ReservationsManager';
import InvoiceManager from './modules/InvoiceManager';
import FinancialDashboard from './modules/FinancialDashboard';
import MarketingHubModule from './modules/MarketingHubModule'; // Твоят файл
import TaskManagementModule from './modules/TaskManagementModule'; // Твоят файл

const AppV2 = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: '🏠 Dashboard', color: 'bg-slate-800' },
    { id: 'reservations', label: '📅 Reservations', color: 'bg-blue-600' },
    { id: 'financial', label: '💰 Financial', color: 'bg-emerald-600' },
    { id: 'documents', label: '📄 Documents (Invoices)', color: 'bg-orange-600' },
    { id: 'marketing', label: '🚀 Marketing Hub', color: 'bg-purple-600' },
    { id: 'tasks', label: '✅ Task Management', color: 'bg-rose-600' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">DYNAMEX <span className="text-blue-500">v2</span></h2>
          <p className="text-slate-400 text-xs mt-1">EURO STANDARD 2026</p>
        </div>
        <nav className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                activeTab === item.id ? `${item.color} shadow-lg scale-105` : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <h1 className="text-3xl font-bold">Добре дошли в Dashboard</h1>}
        {activeTab === 'reservations' && <ReservationsManager />}
        {activeTab === 'financial' && <FinancialDashboard />}
        {activeTab === 'documents' && <InvoiceManager />}
        {activeTab === 'marketing' && <MarketingHubModule />}
        {activeTab === 'tasks' && <TaskManagementModule />}
      </main>
    </div>
  );
};

export default AppV2;
