import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Calendar, Wallet, Loader2, 
  Bus, Landmark, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

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
  const [data, setData] = useState({
    reservations: [],
    financialTransactions: [],
    tours: [],
    customers: [],
    products: []
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Списък без фактури
    const collections = ['reservations', 'financialTransactions', 'tours', 'customers', 'products'];
    const unsubscribes = [];
    const tempStore = {};

    collections.forEach(colName => {
      const ref = collection(db, `artifacts/${appId}/users/${userId}/${colName}`);
      const unsub = onSnapshot(query(ref), (snapshot) => {
        tempStore[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (Object.keys(tempStore).length === collections.length) {
          setData({ ...tempStore });
          setLoading(false);
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [userId]);

  // --- Dashboard Calculations (Твоята логика, без фактури) ---
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const activeReservations = data.reservations.filter(res => res.status !== 'Cancelled');
    const totalReservations = activeReservations.length;
    const totalProfit = activeReservations.reduce((sum, res) => sum + (Number(res.profit) || 0), 0);
    const averageProfitPerReservation = totalReservations > 0 ? totalProfit / totalReservations : 0;
    const totalNightsSum = activeReservations.reduce((sum, res) => sum + (Number(res.totalNights) || 0), 0);
    const averageStayPerReservation = totalReservations > 0 ? totalNightsSum / totalReservations : 0;

    const upcomingReservations = activeReservations.filter(res => {
      const checkInDate = new Date(res.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate >= today && checkInDate <= thirtyDaysFromNow;
    });

    const totalIncome = data.financialTransactions
      .filter(ft => ft.type === 'income')
      .reduce((sum, ft) => sum + (Number(ft.amount) || 0), 0);

    const totalExpenses = data.financialTransactions
      .filter(ft => ft.type === 'expense')
      .reduce((sum, ft) => sum + (Number(ft.amount) || 0), 0);

    let bookedPass = 0;
    let maxPass = 0;
    data.tours.forEach(tour => {
      const linked = activeReservations.filter(res => res.linkedTourId === tour.tourId);
      bookedPass += linked.reduce((sum, res) => sum + (Number(res.adults) || 0) + (Number(res.children) || 0), 0);
      maxPass += (Number(tour.maxPassengers) || 0);
    });

    const balances = { Bank: 0, Cash: 0, 'Cash 2': 0 };
    data.financialTransactions.forEach(ft => {
      const amt = Number(ft.amount) || 0;
      if (balances.hasOwnProperty(ft.method)) {
        balances[ft.method] += (ft.type === 'income' ? amt : -amt);
      }
    });

    // Данни за графиката (последните 7 дни с транзакции)
    const chartMap = {};
    data.financialTransactions.forEach(ft => {
      const d = ft.date || 'N/A';
      if (!chartMap[d]) chartMap[d] = { date: d, income: 0, expense: 0 };
      chartMap[d][ft.type] += Number(ft.amount) || 0;
    });
    const financialChartData = Object.values(chartMap).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-7);

    return {
      totalReservations,
      totalProfit,
      averageProfitPerReservation,
      averageStayPerReservation,
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
      financialChartData,
      pieData: [{ name: 'Заето', value: bookedPass }, { name: 'Свободно', value: Math.max(0, maxPass - bookedPass) }]
    };
  }, [data]);

  const PIE_COLORS = ['#6366f1', '#e2e8f0'];

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Резервации" mainValue={stats.totalReservations} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Ср. нощувки" value={stats.averageStayPerReservation.toFixed(1)} />
          <MetricRow label="Изчакващи" value={stats.countPendingReservations} colorClass="text-yellow-600" />
        </StatCard>

        <StatCard title="Финанси" mainValue={`BGN ${stats.totalIncome.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Разходи" value={`BGN ${stats.totalExpenses.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label="Обща Печалба" value={`BGN ${stats.totalProfit.toFixed(2)}`} colorClass="text-emerald-600" />
        </StatCard>

        <StatCard title="Брой пътници (Общо)" mainValue={stats.totalBusPassengersBooked} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Запълняемост" value={`${stats.overallBusTourFulfillment.toFixed(1)}%`} />
          <MetricRow label="Клиенти" value={data.customers.length} />
        </StatCard>

        <StatCard title="Наличности (Bank)" mainValue={`BGN ${stats.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Cash" value={`BGN ${stats.cashBalance.toFixed(2)}`} />
          <MetricRow label="Cash 2" value={`BGN ${stats.cash2Balance.toFixed(2)}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-black text-slate-400 uppercase mb-6 tracking-widest">Движение на паричния поток</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.financialChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Приход" />
                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} name="Разход" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h4 className="text-sm font-black text-slate-400 uppercase mb-2 tracking-widest self-start">Заетост Турове</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-2xl font-black text-slate-800 dark:text-white">{stats.overallBusTourFulfillment.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
