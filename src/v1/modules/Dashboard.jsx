import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Calendar, Wallet, Loader2, 
  Bus, Landmark, ArrowUpRight 
} from 'lucide-react';

const MetricRow = ({ label, value, colorClass = "text-slate-600 dark:text-slate-400" }) => (
  <div className="flex justify-between items-center mt-2 text-sm font-medium">
    <span className={colorClass}>{label}:</span>
    <span className="font-bold dark:text-white text-slate-800">{value}</span>
  </div>
);

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
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalProfit: 0,
    averageProfitPerReservation: 0,
    averageStayPerReservation: 0,
    totalIncome: 0,
    totalExpenses: 0,
    overallBusTourFulfillment: 0,
    totalBusPassengersBooked: 0,
    bankBalance: 0,
    cashBalance: 0,
    cash2Balance: 0,
    totalCustomers: 0,
    totalProducts: 0,
    countUpcomingReservations: 0,
    profitUpcomingReservations: 0,
    countPendingReservations: 0
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Изключихме фактурите от списъка за следене
    const collections = ['reservations', 'financialTransactions', 'tours', 'customers', 'products'];
    const unsubscribes = [];
    const rawData = {};

    collections.forEach(colName => {
      const ref = collection(db, `artifacts/${appId}/users/${userId}/${colName}`);
      const unsub = onSnapshot(query(ref), (snapshot) => {
        rawData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (Object.keys(rawData).length === collections.length) {
          calculateStats(rawData);
          setLoading(false);
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [userId]);

  const calculateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    // 1. Резервации и Нощувки
    const activeReservations = (data.reservations || []).filter(res => res.status !== 'Cancelled');
    const totalReservations = activeReservations.length;
    
    const totalProfit = activeReservations.reduce((sum, res) => sum + (Number(res.profit) || 0), 0);
    const totalNights = activeReservations.reduce((sum, res) => sum + (Number(res.totalNights) || 0), 0);
    
    const upcomingReservations = activeReservations.filter(res => {
      const checkInDate = new Date(res.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate >= today && checkInDate <= thirtyDaysFromNow;
    });

    // 2. Финанси
    const ft = data.financialTransactions || [];
    const totalIncome = ft.filter(f => f.type === 'income').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const totalExpenses = ft.filter(f => f.type === 'expense').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const balances = { Bank: 0, Cash: 0, 'Cash 2': 0 };
    ft.forEach(f => {
      const amount = Number(f.amount) || 0;
      if (balances.hasOwnProperty(f.method)) {
        balances[f.method] += (f.type === 'income' ? amount : -amount);
      }
    });

    // 3. Автобусни пътници (Общо)
    let bookedPass = 0;
    let maxPass = 0;
    (data.tours || []).forEach(tour => {
      const linked = activeReservations.filter(res => res.linkedTourId === tour.tourId);
      bookedPass += linked.reduce((sum, res) => sum + (Number(res.adults) || 0) + (Number(res.children) || 0), 0);
      maxPass += (Number(tour.maxPassengers) || 0);
    });

    setStats({
      totalReservations,
      totalProfit,
      averageProfitPerReservation: totalReservations > 0 ? totalProfit / totalReservations : 0,
      averageStayPerReservation: totalReservations > 0 ? totalNights / totalReservations : 0,
      totalIncome,
      totalExpenses,
      bankBalance: balances.Bank,
      cashBalance: balances.Cash,
      cash2Balance: balances['Cash 2'],
      totalBusPassengersBooked: bookedPass,
      overallBusTourFulfillment: maxPass > 0 ? (bookedPass / maxPass) * 100 : 0,
      countUpcomingReservations: upcomingReservations.length,
      profitUpcomingReservations: upcomingReservations.reduce((sum, res) => sum + (Number(res.profit) || 0), 0),
      countPendingReservations: activeReservations.filter(res => res.status === 'Pending').length,
      totalCustomers: (data.customers || []).length,
      totalProducts: (data.products || []).length
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* РЕЗЕРВАЦИИ СЪС СРЕДЕН БРОЙ НОЩУВКИ */}
        <StatCard title="Резервации" mainValue={stats.totalReservations} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Ср. нощувки" value={stats.averageStayPerReservation.toFixed(1)} />
          <MetricRow label="Ср. печалба" value={`BGN ${stats.averageProfitPerReservation.toFixed(2)}`} />
        </StatCard>

        <StatCard title="Финансов отчет" mainValue={`BGN ${stats.totalIncome.toFixed(2)}`} icon={Wallet} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Разходи" value={`BGN ${stats.totalExpenses.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label="Печалба" value={`BGN ${stats.totalProfit.toFixed(2)}`} colorClass="text-emerald-500" />
        </StatCard>

        {/* ОБЩ БРОЙ ПЪТНИЦИ */}
        <StatCard title="Брой пътници (Общо)" mainValue={stats.totalBusPassengersBooked} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Запълняемост" value={`${stats.overallBusTourFulfillment.toFixed(1)}%`} />
          <MetricRow label="Клиенти" value={stats.totalCustomers} />
        </StatCard>

        <StatCard title="Наличности (Bank)" mainValue={`BGN ${stats.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Cash" value={`BGN ${stats.cashBalance.toFixed(2)}`} />
          <MetricRow label="Cash 2" value={`BGN ${stats.cash2Balance.toFixed(2)}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Следващи 30 дни" mainValue={stats.countUpcomingReservations} icon={Calendar} color="bg-indigo-500" loading={loading}>
          <MetricRow label="Очаквана печалба" value={`BGN ${stats.profitUpcomingReservations.toFixed(2)}`} colorClass="text-emerald-500" />
          <MetricRow label="Изчакващи (Pending)" value={stats.countPendingReservations} colorClass="text-yellow-500" />
        </StatCard>

        <div className="bg-slate-900 dark:bg-blue-700 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden group">
          <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase italic">Бързи действия</h3>
          <div className="grid grid-cols-2 gap-3 z-10">
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-xs font-bold border border-white/10 transition-colors uppercase tracking-widest">Нова Резервация</button>
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-xs font-bold border border-white/10 transition-colors uppercase tracking-widest">Добави Разход</button>
          </div>
          <ArrowUpRight className="absolute bottom-[-10px] right-[-10px] size-32 opacity-10" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
