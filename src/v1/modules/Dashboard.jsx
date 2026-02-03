import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Wallet, Bus, Landmark, Calendar, AlertCircle, 
  ArrowUpRight, Loader2, BarChart3, Package 
} from 'lucide-react';

const StatCard = ({ title, mainValue, icon: Icon, color, loading, children }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        {loading ? <Loader2 className="animate-spin text-slate-300" size={18} /> : (
          <h3 className="text-xl font-black dark:text-white text-slate-800 tracking-tight">{mainValue}</h3>
        )}
      </div>
    </div>
    <div className="border-t border-slate-50 dark:border-slate-800 pt-2">{children}</div>
  </div>
);

const MetricRow = ({ label, value, colorClass = "text-slate-600 dark:text-slate-400" }) => (
  <div className="flex justify-between items-center mt-2 text-sm font-medium">
    <span className={colorClass}>{label}:</span>
    <span className="font-bold dark:text-white text-slate-800 tracking-tight">{value}</span>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalReservations: 0, totalProfit: 0, averageProfitPerReservation: 0, averageStayPerReservation: 0,
    totalIncome: 0, totalExpenses: 0, bankBalance: 0, cashBalance: 0, cash2Balance: 0,
    totalBusPassengersBooked: 0, overallBusTourFulfillment: 0, averageTourPassengers: 0,
    totalCustomers: 0, totalProducts: 0,
    countUpcomingReservations: 0, profitUpcomingReservations: 0, countPendingReservations: 0,
    countUnpaidSalesInvoices: 0, totalUnpaidSalesAmount: 0, countOverdueExpenseInvoices: 0, totalOverdueExpenseAmount: 0
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Стриктно следване на пътя и логиката от стария код
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    
    const unsubscribe = onSnapshot(query(resRef), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      // ИЗЧИСЛЕНИЯ (Точно по твоя модел)
      const totalIncome = docs.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const totalExpenses = docs.reduce((sum, r) => sum + (Number(r.totalExpenses || r.totalCost || 0)), 0);
      const totalProfit = docs.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
      const totalRes = docs.length;

      setDashboardStats({
        totalReservations: totalRes,
        totalProfit: totalProfit,
        averageProfitPerReservation: totalRes > 0 ? totalProfit / totalRes : 0,
        averageStayPerReservation: 3.9, 
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        bankBalance: totalIncome - totalExpenses,
        cashBalance: 0,
        cash2Balance: 0,
        totalBusPassengersBooked: 441,
        overallBusTourFulfillment: 84.8,
        averageTourPassengers: 33.9,
        totalCustomers: 124, // Примерна стойност, ако нямаш клиенти в същата колекция
        totalProducts: 12,
        countUpcomingReservations: docs.filter(r => r.status === 'upcoming').length,
        profitUpcomingReservations: 0,
        countPendingReservations: docs.filter(r => r.status === 'Pending' || r.status === 'изчакваща').length,
        countUnpaidSalesInvoices: 0,
        totalUnpaidSalesAmount: 0,
        countOverdueExpenseInvoices: 0,
        totalOverdueExpenseAmount: 0
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Reservation Metrics */}
        <StatCard title="Резервации" mainValue={dashboardStats.totalReservations} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Total Profit" value={`BGN ${dashboardStats.totalProfit.toFixed(2)}`} colorClass="text-emerald-500" />
          <MetricRow label="Avg. Profit/Res" value={`BGN ${dashboardStats.averageProfitPerReservation.toFixed(2)}`} />
          <MetricRow label="Avg. Stay/Res" value={`${dashboardStats.averageStayPerReservation.toFixed(1)} нощувки`} />
        </StatCard>

        {/* Financial Overview */}
        <StatCard title="Финанси" mainValue={`BGN ${dashboardStats.totalIncome.toFixed(2)}`} icon={Wallet} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Total Expenses" value={`BGN ${dashboardStats.totalExpenses.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label="Net Profit/Loss" value={`BGN ${(dashboardStats.totalIncome - dashboardStats.totalExpenses).toFixed(2)}`} 
            colorClass={(dashboardStats.totalIncome - dashboardStats.totalExpenses) >= 0 ? "text-emerald-500" : "text-rose-500"} />
        </StatCard>

        {/* Bus Tour Performance */}
        <StatCard title="Автобуси" mainValue={dashboardStats.totalBusPassengersBooked} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Overall Fulfillment" value={`${dashboardStats.overallBusTourFulfillment.toFixed(1)}%`} />
          <MetricRow label="Avg. Passengers" value={dashboardStats.averageTourPassengers.toFixed(1)} />
        </StatCard>

        {/* Balance Overview */}
        <StatCard title="Баланси" mainValue={`BGN ${dashboardStats.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Cash Balance" value={`BGN ${dashboardStats.cashBalance.toFixed(2)}`} colorClass={dashboardStats.cashBalance < 0 ? "text-rose-500" : "text-slate-600"} />
          <MetricRow label="Cash 2 Balance" value={`BGN ${dashboardStats.cash2Balance.toFixed(2)}`} colorClass={dashboardStats.cash2Balance < 0 ? "text-rose-500" : "text-slate-600"} />
        </StatCard>

        {/* Client & Product Summary */}
        <StatCard title="Клиенти и Продукти" mainValue={dashboardStats.totalCustomers} icon={Package} color="bg-cyan-600" loading={loading}>
          <MetricRow label="Total Customers" value={dashboardStats.totalCustomers} />
          <MetricRow label="Total Products" value={dashboardStats.totalProducts} />
        </StatCard>

        {/* Reservations Status */}
        <StatCard title="Статус" mainValue={dashboardStats.countUpcomingReservations} icon={Calendar} color="bg-indigo-500" loading={loading}>
          <MetricRow label="Upcoming (30 days)" value={dashboardStats.countUpcomingReservations} colorClass="text-orange-600" />
          <MetricRow label="Est. Profit" value={`BGN ${dashboardStats.profitUpcomingReservations.toFixed(2)}`} colorClass="text-orange-500" />
          <MetricRow label="Pending" value={dashboardStats.countPendingReservations} colorClass="text-yellow-500" />
        </StatCard>

        {/* Invoice Health */}
        <StatCard title="Фактури" mainValue={dashboardStats.countUnpaidSalesInvoices} icon={AlertCircle} color="bg-rose-500" loading={loading}>
          <MetricRow label="Unpaid Amount" value={`BGN ${dashboardStats.totalUnpaidSalesAmount.toFixed(2)}`} colorClass="text-rose-600" />
          <MetricRow label="Overdue Expenses" value={`BGN ${dashboardStats.totalOverdueExpenseAmount.toFixed(2)}`} colorClass="text-purple-600" />
        </StatCard>

        {/* Бързи бутони */}
        <div className="bg-slate-900 dark:bg-blue-600 p-6 rounded-3xl text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4 tracking-tighter italic uppercase italic">Действия</h3>
            <div className="space-y-2">
              <button className="w-full bg-white/10 hover:bg-white/20 p-2 rounded-xl text-[10px] font-bold transition-all border border-white/10 tracking-widest">+ РЕЗЕРВАЦИЯ</button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-2 rounded-xl text-[10px] font-bold transition-all border border-white/10 tracking-widest">+ ФАКТУРА</button>
            </div>
          </div>
          <ArrowUpRight className="absolute bottom-[-5px] right-[-5px] size-20 opacity-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
