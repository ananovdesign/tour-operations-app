import React from 'react';

const FinancialDashboard = ({ invoices = [] }) => {
  const totalRevenueEUR = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalRevenueBGN = totalRevenueEUR * 1.95583;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg">
        <p className="text-blue-100 text-sm font-medium">Общ оборот (EUR)</p>
        <h3 className="text-3xl font-bold mt-1">€ {totalRevenueEUR.toLocaleString()}</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 text-sm font-medium">Равностойност (BGN)</p>
        <h3 className="text-3xl font-bold mt-1 text-slate-800">{totalRevenueBGN.toLocaleString()} лв.</h3>
      </div>
    </div>
  );
};

export default FinancialDashboard;
