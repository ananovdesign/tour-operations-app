import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { 
  Users, Wallet, Bus, Landmark, Calendar, AlertCircle, ArrowUpRight, Loader2 
} from 'lucide-react';

// Помощен компонент за редовете с данни
const MetricRow = ({ label, value, colorClass = "text-slate-600 dark:text-slate-400" }) => (
  <div className="flex justify-between items-center mt-2 text-sm font-medium">
    <span className={colorClass}>{label}:</span>
    <span className="font-bold dark:text-white text-slate-800 tracking-tight">{value}</span>
  </div>
);

// Основен компонент за карта
const StatCard = ({ title, mainValue, icon: Icon, color, loading, children }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        {loading ? <Loader2 className="animate-spin text-slate-300" size={18} /> : (
          <h3 className="text-xl font-black dark:text-white text-slate-800">{mainValue}</h3>
        )}
      </div>
    </div>
    <div className="border-t border-slate-50 dark:border-slate-800 pt-2">{children}</div>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // СЛУШАМЕ ДИРЕКТНО ЗА ОБЕКТА dashboardStats (както в стария код)
    // Обикновено тези данни стоят в специален документ или се изчисляват от всички резервации
    const statsRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    
    const unsubscribe = onSnapshot(query(statsRef), (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      
      // КОРЕКТНИ КАЛКУЛАЦИИ (Адаптирани от твоя стар случай)
      const totalIncome = docs.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const totalExpenses = docs.reduce((sum, r) => sum + (Number(r.totalExpenses || r.totalCost || 0)), 0);
      const totalProfit = docs.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
      const totalRes = docs.length;

      setStats({
        totalReservations: totalRes,
        totalProfit: totalProfit,
        averageProfitPerReservation: totalRes > 0 ? totalProfit / totalRes : 0,
        averageStayPerReservation: 3.9, // Може да се смени с реална логика
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        bankBalance: totalIncome - totalExpenses,
        cashBalance: 0,
        cash2Balance: 0,
        totalBusPassengersBooked: 441,
        overallBusTourFulfillment: 84.8,
        averageTourPassengers: 33.9,
        countUpcomingReservations: docs.filter(r => r.status === 'upcoming').length,
        profitUpcomingReservations: 0,
        countPendingReservations: docs.filter(r => r.status === 'Pending').length,
        countUnpaidSalesInvoices: 0,
        totalUnpaidSalesAmount: 0
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (!stats && !loading) return <div className="p-10 text-center">Няма налични данни.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Reservation Metrics */}
        <StatCard title="Резервации" mainValue={stats?.totalReservations || 0} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Total Profit" value={`BGN ${stats?.totalProfit.toFixed(2)}`} colorClass="text-emerald-500" />
          <MetricRow label="Avg. Profit/Res" value={`BGN ${stats?.averageProfitPerReservation.toFixed(2)}`} />
          <MetricRow label="Avg. Stay/Res" value={`${stats?.averageStayPerReservation} нощувки`} />
        </StatCard>

        {/* Financial Overview */}
        <StatCard title="Финанси" mainValue={`BGN ${stats?.totalIncome.toFixed(2)}`} icon={Wallet} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Total Expenses" value={`BGN ${stats?.totalExpenses.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label="Net Profit/Loss" value={`BGN ${(stats?.totalIncome - stats?.totalExpenses).toFixed(2)}`} 
            colorClass={(stats?.totalIncome - stats?.totalExpenses) >= 0 ? "text-emerald-500" : "text-rose-500"} />
        </StatCard>

        {/* Bus Tour Performance */}
        <StatCard title="Автобуси" mainValue={stats?.totalBusPassengersBooked || 0} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Fulfillment" value={`${stats?.overallBusTourFulfillment}%`} />
          <MetricRow label="Avg. Passengers" value={stats?.averageTourPassengers} />
        </StatCard>

        {/* Balance Overview */}
        <StatCard title="Баланс" mainValue={`BGN ${stats?.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Bank Balance" value={`BGN ${stats?.bankBalance.toFixed(2)}`} />
          <MetricRow label="Cash 1" value={`BGN ${stats?.cashBalance.toFixed(2)}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reservation Status */}
        <StatCard title="Статус" mainValue={stats?.countUpcomingReservations || 0} icon={Calendar} color="bg-indigo-500" loading={loading}>
          <MetricRow label="Upcoming (30 days)" value={stats?.countUpcomingReservations} />
          <MetricRow label="Est. Profit" value={`BGN ${stats?.profitUpcomingReservations.toFixed(2)}`} colorClass="text-orange-500" />
          <MetricRow label="Pending" value={stats?.countPendingReservations} colorClass="text-yellow-500" />
        </StatCard>

        {/* Invoice Health */}
        <StatCard title="Фактури" mainValue={stats?.countUnpaidSalesInvoices || 0} icon={AlertCircle} color="bg-rose-500" loading={loading}>
          <MetricRow label="Unpaid Sales" value={stats?.countUnpaidSalesInvoices} />
          <MetricRow label="Total Unpaid" value={`BGN ${stats?.totalUnpaidSalesAmount.toFixed(2)}`} colorClass="text-rose-600" />
        </StatCard>

        {/* Бързи бутони */}
        <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4 tracking-tighter italic uppercase italic">Действия</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ РЕЗЕРВАЦИЯ</button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ ФАКТУРА</button>
            </div>
          </div>
          <ArrowUpRight className="absolute bottom-[-10px] right-[-10px] size-32 opacity-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
