import React from 'react';
import { 
  Users, TrendingUp, Wallet, Bus, AlertTriangle, 
  CheckCircle, Clock, FileText, ArrowRight 
} from 'lucide-react';

const Dashboard = ({ reservations, financialEntries, invoices, tasks, setTab }) => {
    // --- 1. Reservation Metrics ---
    const totalRes = reservations.length;
    const totalProfit = reservations.reduce((sum, r) => sum + parseFloat(r.profit || 0), 0);
    const avgProfit = totalRes > 0 ? totalProfit / totalRes : 0;
    const totalNights = reservations.reduce((sum, r) => {
        const start = new Date(r.checkIn);
        const end = new Date(r.checkOut);
        const nights = (end - start) / (1000 * 60 * 60 * 24);
        return sum + (nights > 0 ? nights : 0);
    }, 0);
    const avgStay = totalRes > 0 ? totalNights / totalRes : 0;

    // --- 2. Financial Overview ---
    const totalIncome = financialEntries.filter(e => e.type === 'Income').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalExpenses = financialEntries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // --- 3. Balance Overview (По категории) ---
    const bankBalance = financialEntries.filter(e => e.category === 'Bank').reduce((sum, e) => e.type === 'Income' ? sum + parseFloat(e.amount) : sum - parseFloat(e.amount), 0);
    const cashBalance = financialEntries.filter(e => e.category === 'Cash').reduce((sum, e) => e.type === 'Income' ? sum + parseFloat(e.amount) : sum - parseFloat(e.amount), 0);
    const cash2Balance = financialEntries.filter(e => e.category === 'Cash 2').reduce((sum, e) => e.type === 'Income' ? sum + parseFloat(e.amount) : sum - parseFloat(e.amount), 0);

    // --- 4. Invoice Health ---
    const unpaidInvoices = invoices.filter(inv => !inv.isPaid);
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <h2 className="text-2xl font-bold text-gray-800">Reservation Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Reservations" value={totalRes} icon={Users} color="blue" />
                <StatCard title="Total Profit" value={`BGN ${totalProfit.toFixed(2)}`} icon={TrendingUp} color="green" />
                <StatCard title="Avg. Profit/Res" value={`BGN ${avgProfit.toFixed(2)}`} icon={TrendingUp} color="emerald" />
                <StatCard title="Avg. Stay/Res" value={`${avgStay.toFixed(1)} nights`} icon={Clock} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Financial Overview</h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <div className="flex justify-between"><span>Total Income:</span> <span className="font-bold text-green-600">BGN {totalIncome.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Total Expenses:</span> <span className="font-bold text-red-600">BGN {totalExpenses.toFixed(2)}</span></div>
                        <div className="border-t pt-2 flex justify-between font-bold text-lg">
                            <span>Net Profit/Loss:</span> <span className={netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>BGN {netProfit.toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Balance Overview</h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                        <div className="flex justify-between"><span>Bank Balance:</span> <span className="font-bold text-blue-600">BGN {bankBalance.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Cash Balance:</span> <span className="font-bold text-orange-600">BGN {cashBalance.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Cash 2 Balance:</span> <span className="font-bold text-purple-600">BGN {cash2Balance.toFixed(2)}</span></div>
                    </div>
                </section>
            </div>

            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Unpaid Sales Invoices</p>
                            <p className="text-2xl font-bold text-red-700">{unpaidInvoices.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-red-600 opacity-70">Total Unpaid</p>
                            <p className="text-xl font-bold text-red-700">BGN {totalUnpaidAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Overdue Expenses</p>
                            <p className="text-2xl font-bold text-green-700">0</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-green-600 opacity-70">Total Overdue</p>
                            <p className="text-xl font-bold text-green-700">BGN 0.00</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}><Icon size={24} /></div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default Dashboard;
