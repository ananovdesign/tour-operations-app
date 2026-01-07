import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const BGN_RATE = 1.95583;

const FinancialDashboard = ({ invoices = [], tasks = [] }) => {
  // 1. Изчисляване на общи суми (взимаме totalAmount от твоите инвойси)
  const totalEUR = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalBGN = totalEUR * BGN_RATE;

  // 2. Подготовка на данни за графиката (Приходи по месеци)
  // Групираме твоите инвойси по месец
  const monthlyData = invoices.reduce((acc, inv) => {
    const month = new Date(inv.date).toLocaleString('bg-BG', { month: 'short' });
    acc[month] = (acc[month] || 0) + (Number(inv.totalAmount) || 0);
    return acc;
  }, {});

  const chartData = Object.keys(monthlyData).map(month => ({
    name: month,
    eur: monthlyData[month],
    bgn: monthlyData[month] * BGN_RATE
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* КАРТИ СЪС СТАТИСТИКА - Точно като в твоя оригинален Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Общо Приходи (EUR)</p>
          <p className="text-2xl font-black text-slate-800">€ {totalEUR.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Равностойност (BGN)</p>
          <p className="text-2xl font-bold text-slate-700">{totalBGN.toLocaleString(undefined, {minimumFractionDigits: 2})} лв.</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Активни Задачи</p>
          <p className="text-2xl font-bold text-slate-800">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Издадени Документи</p>
          <p className="text-2xl font-bold text-slate-800">{invoices.length}</p>
        </div>
      </div>

      {/* ГРАФИКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 text-slate-800">Тенденция на приходите (EUR)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`€ ${value.toFixed(2)}`, 'Приход']}
                />
                <Line type="monotone" dataKey="eur" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 text-slate-800">Сравнение по месеци (EUR vs BGN)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="eur" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Евро" />
                <Bar dataKey="bgn" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Лева" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ПОСЛЕДНИ ФАКТУРИ (Таблица от твоя код) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Последни издадени документи</h3>
          <button className="text-blue-600 text-sm font-bold">Виж всички</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-4">Клиент</th>
              <th className="p-4">Дата</th>
              <th className="p-4 text-right">Сума (EUR)</th>
              <th className="p-4 text-right">Сума (BGN)</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {invoices.slice(0, 5).map((inv, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-700">{inv.clientName || 'N/A'}</td>
                <td className="p-4 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                <td className="p-4 text-right font-bold text-slate-900">€ {(Number(inv.totalAmount)).toFixed(2)}</td>
                <td className="p-4 text-right text-slate-400">{(Number(inv.totalAmount) * BGN_RATE).toFixed(2)} лв.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialDashboard;
