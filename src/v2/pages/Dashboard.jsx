import React from 'react';
import { Users, TrendingUp, Wallet, Bus, AlertTriangle, FileText, Clock } from 'lucide-react';

const Dashboard = ({ reservations = [], financialEntries = [], invoices = [] }) => {
    // РЕЗЕРВАЦИИ - ИЗЧИСЛЕНИЯ
    const totalRes = reservations.length;
    const totalProfit = reservations.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
    const avgProfit = totalRes > 0 ? totalProfit / totalRes : 0;
    
    const totalNights = reservations.reduce((sum, r) => {
        const start = new Date(r.checkIn);
        const end = new Date(r.checkOut);
        const nights = (end - start) / (1000 * 60 * 60 * 24);
        return sum + (nights > 0 ? nights : 0);
    }, 0);
    const avgStay = totalRes > 0 ? totalNights / totalRes : 0;

    // ФИНАНСИ - ИЗЧИСЛЕНИЯ
    const income = financialEntries.filter(e => e.type === 'Income').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const expenses = financialEntries.filter(e => e.type === 'Expense').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = income - expenses;

    // БАЛАНСИ ПО КАСИ
    const getBalance = (cat) => financialEntries.filter(e => e.category === cat).reduce((s, e) => e.type === 'Income' ? s + (Number(e.amount) || 0) : s - (Number(e.amount) || 0), 0);

    // ФАКТУРИ - ЗДРАВЕ
    const unpaidSales = invoices.filter(inv => !inv.isPaid).reduce((s, inv) => s + (Number(inv.grandTotal) || 0), 0);
    const unpaidCount = invoices.filter(inv => !inv.isPaid).length;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* СЕКЦИЯ 1: RESERVATION METRICS */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Reservation Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard title="Total Reservations" value={totalRes} icon={Users} color="blue" />
                    <MetricCard title="Total Profit" value={`BGN ${totalProfit.toLocaleString('bg-BG', {minimumFractionDigits: 2})}`} icon={TrendingUp} color="green" />
                    <MetricCard title="Avg. Profit/Res" value={`BGN ${avgProfit.toFixed(2)}`} icon={TrendingUp} color="emerald" />
                    <MetricCard title="Avg. Stay/Res" value={`${avgStay.toFixed(1)} nights`} icon={Clock} color="indigo" />
                </div>
            </section>

            {/* СЕКЦИЯ 2: FINANCIAL & BALANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="text-gray-400" /> Financial Overview</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span>Total Income:</span> <span className="font-bold text-green-600">BGN {income.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Total Expenses:</span> <span className="font-bold text-red-600">BGN {expenses.toLocaleString()}</span></div>
                        <div className="border-t pt-3 flex justify-between text-lg font-black">
                            <span>Net Profit/Loss:</span> <span className={netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>BGN {netProfit.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Balance Overview</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span>Bank Balance:</span> <span className="font-bold">BGN {getBalance('Bank').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Cash Balance:</span> <span className="font-bold">BGN {getBalance('Cash').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Cash 2 Balance:</span> <span className="font-bold">BGN {getBalance('Cash 2').toLocaleString()}</span></div>
                    </div>
                </div>
            </div>

            {/* СЕКЦИЯ 3: INVOICE HEALTH */}
            <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle /> Invoice Health</h2>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-red-600">Unpaid Sales Invoices</p>
                        <p className="text-3xl font-black text-red-700">{unpaidCount}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-red-600">Total Unpaid Amount</p>
                        <p className="text-3xl font-black text-red-700">BGN {unpaidSales.toLocaleString()}</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
        <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600`}><Icon size={24} /></div>
        <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{title}</p>
            <p className="text-xl font-black text-gray-900">{value}</p>
        </div>
    </div>
);

export default Dashboard;
