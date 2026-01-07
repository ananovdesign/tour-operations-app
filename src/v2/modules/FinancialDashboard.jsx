import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialDashboard = ({ invoices = [], tasks = [] }) => {
  const RATE = 1.95583;

  // Изчисляване: Търсим 'total', 'price' или 'amount' от твоите обекти
  const totalEUR = invoices.reduce((acc, inv) => {
    const val = inv.total || inv.price || inv.amount || inv.totalAmount || 0;
    return acc + Number(val);
  }, 0);

  const chartData = invoices.slice(0, 10).reverse().map(inv => ({
    name: new Date(inv.date).toLocaleDateString(),
    eur: Number(inv.total || inv.price || 0)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border-b-4 border-blue-500">
          <h3 className="text-gray-400 text-xs font-bold uppercase">Общо Приходи (EUR)</h3>
          <p className="text-3xl font-black">€ {totalEUR.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-b-4 border-emerald-500">
          <h3 className="text-gray-400 text-xs font-bold uppercase">Равностойност (BGN)</h3>
          <p className="text-3xl font-black text-emerald-600">{(totalEUR * RATE).toFixed(2)} лв.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-b-4 border-orange-500">
          <h3 className="text-gray-400 text-xs font-bold uppercase">Задачи</h3>
          <p className="text-3xl font-black">{tasks.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow h-80">
        <h3 className="font-bold mb-4">Графика на приходите</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="eur" stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialDashboard;
