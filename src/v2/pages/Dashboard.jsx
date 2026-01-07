import React from 'react';
import { Users, TrendingUp, Wallet, Bus, AlertTriangle, FileText, Package, Clock } from 'lucide-react';

const Dashboard = ({ reservations = [], financialTransactions = [], tours = [], customers = [], products = [], salesInvoices = [], expenseInvoices = [] }) => {
    
    // --- ДАТИ ---
    const today = new Date();
    today.setHours(0,0,0,0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // --- РЕЗЕРВАЦИИ ---
    const activeReservations = reservations.filter(res => res.status !== 'Cancelled');
    const totalReservations = activeReservations.length;
    const profitableReservations = activeReservations.filter(res => (res.profit || 0) > 0);
    const totalProfit = profitableReservations.reduce((sum, res) => sum + (res.profit || 0), 0);
    const avgProfit = totalReservations > 0 ? totalProfit / totalReservations : 0;
    const totalNights = activeReservations.reduce((sum, res) => sum + (res.totalNights || 0), 0);
    const avgStay = totalReservations > 0 ? totalNights / totalReservations : 0;

    // --- ФИНАНСИ ---
    const totalIncome = financialTransactions.filter(ft => ft.type === 'income').reduce((sum, ft) => sum + (ft.amount || 0), 0);
    const totalExpenses = financialTransactions.filter(ft => ft.type === 'expense').reduce((sum, ft) => sum + (ft.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // --- БАЛАНСИ ПО КАСИ ---
    const getBalance = (method) => {
        const inc = financialTransactions.filter(ft => ft.method === method && ft.type === 'income').reduce((s, ft) => s + (ft.amount || 0), 0);
        const exp = financialTransactions.filter(ft => ft.method === method && ft.type === 'expense').reduce((s, ft) => s + (ft.amount || 0), 0);
        return inc - exp;
    };

    // --- BUS TOUR PERFORMANCE ---
    let totalBookedPassengers = 0;
    let totalMaxPassengers = 0;
    tours.forEach(tour => {
        const linkedRes = activeReservations.filter(res => res.linkedTourId === tour.tourId);
        totalBookedPassengers += linkedRes.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0);
        totalMaxPassengers += (tour.maxPassengers || 0);
    });
    const overallFulfillment = totalMaxPassengers > 0 ? (totalBookedPassengers / totalMaxPassengers) * 100 : 0;

    // --- INVOICE HEALTH ---
    const unpaidSales = salesInvoices.filter(inv => (inv.grandTotal || 0) > 0);
    const totalUnpaidAmount = unpaidSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    return (
        <div className="p-8 space-y-10 animate-fadeIn">
            <section>
                <h2 className="text-2xl font-black text-gray-800 mb-6">Reservation Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Reservations" value={totalReservations} icon={Users} color="blue" />
                    <StatCard title="Total Profit" value={`BGN ${totalProfit.toFixed(2)}`} icon={TrendingUp} color="green" />
                    <StatCard title="Avg. Profit/Res" value={`BGN ${avgProfit.toFixed(2)}`} icon={TrendingUp} color="emerald" />
                    <StatCard title="Avg. Stay/Res" value={`${avgStay.toFixed(1)} nights`} icon={Clock} color="indigo" />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Wallet /> Financial Overview</h2>
                    <div className="space-y-4 text-lg">
                        <div className="flex justify-between"><span>Total Income:</span> <span className="font-bold text-green-600">BGN {totalIncome.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Total Expenses:</span> <span className="font-bold text-red-600">BGN {totalExpenses.toLocaleString()}</span></div>
                        <div className="border-t pt-4 flex justify-between font-black text-2xl"><span>Net Profit/Loss:</span> <span className={netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>BGN {netProfit.toLocaleString()}</span></div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Bus Tour Performance</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between"><span>Total Passengers Booked:</span> <span className="font-bold">{totalBookedPassengers}</span></div>
                        <div className="flex justify-between"><span>Overall Fulfillment:</span> <span className="font-bold text-blue-600">{overallFulfillment.toFixed(1)}%</span></div>
                        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mt-2">
                            <div className="bg-blue-600 h-full" style={{ width: `${overallFulfillment}%` }}></div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BalanceCard title="Bank Balance" value={getBalance('Bank')} />
                <BalanceCard title="Cash Balance" value={getBalance('Cash')} />
                <BalanceCard title="Cash 2 Balance" value={getBalance('Cash 2')} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-6">
                    <Package className="text-gray-300" size={48} />
                    <div><p className="text-gray-500 font-bold uppercase text-xs">Total Products</p><p className="text-3xl font-black">{products.length}</p></div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex justify-between items-center">
                    <div><p className="text-red-600 font-bold uppercase text-xs">Unpaid Invoices</p><p className="text-3xl font-black text-red-700">{unpaidSales.length}</p></div>
                    <div className="text-right"><p className="text-red-600 opacity-70 text-xs uppercase font-bold">Total Unpaid Amount</p><p className="text-2xl font-black text-red-700">BGN {totalUnpaidAmount.toLocaleString()}</p></div>
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
        <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600`}><Icon size={24} /></div>
        <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{title}</p><p className="text-xl font-black text-gray-900">{value}</p></div>
    </div>
);

const BalanceCard = ({ title, value }) => (
    <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-blue-500">
        <p className="text-xs text-gray-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-black text-gray-800">BGN {value.toLocaleString()}</p>
    </div>
);

export default Dashboard;
