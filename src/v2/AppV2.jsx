import React, { useState } from 'react';
import InvoiceManager from './modules/InvoiceManager'; // Вече го създадохме
// Тук ще добавяме останалите модули един по един

const AppV2 = () => {
  const [activeTab, setActiveTab] = useState('invoices');

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans antialiased">
      {/* СТРАНИЧНО МЕНЮ */}
      <aside className="w-64 bg-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-8 text-blue-400">Dynamex Tour v2</h2>
        <nav className="space-y-4">
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`w-full text-left p-3 rounded-lg transition ${activeTab === 'invoices' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            📊 Фактури (EUR)
          </button>
          <button 
            onClick={() => setActiveTab('contracts')}
            className={`w-full text-left p-3 rounded-lg transition ${activeTab === 'contracts' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            📜 Договори
          </button>
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`w-full text-left p-3 rounded-lg transition ${activeTab === 'vouchers' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
          >
            🎟️ Ваучери
          </button>
        </nav>
      </aside>

      {/* ОСНОВНО СЪДЪРЖАНИЕ */}
      <main className="flex-1 p-10">
        <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'invoices' ? 'Управление на Фактури' : 
             activeTab === 'contracts' ? 'Управление на Договори' : 'Ваучери'}
          </h1>
          <div className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
            Валута: ЕВРО (1.95583)
          </div>
        </header>

        {activeTab === 'invoices' && <InvoiceManager />}
        {activeTab === 'contracts' && (
          <div className="bg-white p-10 rounded-xl shadow">Модулът Договори се подготвя...</div>
        )}
      </main>
    </div>
  );
};

export default AppV2;
