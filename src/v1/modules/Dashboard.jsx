import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Calendar, Wallet, Loader2, 
  Bus, Landmark, ArrowUpRight, TrendingUp 
} from 'lucide-react';
// Импортираме компонентите от Recharts
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

const StatCard = ({ title, mainValue, icon: Icon, color, loading, children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md ${className}`}>
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
    totalReservations: 0, totalProfit: 0, averageProfitPerReservation: 0,
    averageStayPerReservation: 0, totalIncome: 0, totalExpenses: 0,
    overallBusTourFulfillment: 0, totalBusPassengersBooked: 0,
    bankBalance: 0, cashBalance: 0, cash2Balance: 0,
    countUpcomingReservations: 0, profitUpcomingReservations: 0,
    financialData: [], // Данни за линейната графика
    tourPieData: []    // Данни за кръговата графика
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

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
    const activeReservations = (data.reservations || []).filter(res => res.status !== 'Cancelled');
    
    // Пресмятане на основните числа (същата логика като преди)
    const totalReservations = activeReservations.length;
    const totalProfit = activeReservations.reduce((sum, res) => sum + (Number(res.profit) || 0), 0);
    const totalNights = activeReservations.reduce((sum, res) => sum + (Number(res.totalNights) || 0), 0);

    // Подготовка на данни за финансовата графика (по дати)
    const financialMap = {};
    (data.financialTransactions || []).forEach(f => {
      const date = f.date || 'Unknown';
      if (!financialMap[date]) financialMap[date] = { date, income: 0, expense: 0 };
      financialMap[date][f.type] += (Number(f.amount) || 0);
    });
    const financialData = Object.values(financialMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);

    // Подготовка на данни за запълняемост
    let booked = 0, max = 0;
    (data.tours || []).forEach(t => {
      const linked = activeReservations.filter(r => r.linkedTourId === t.tourId);
      booked += linked.reduce((s, r) => s + (Number(r.adults) || 0) + (Number(r.children) || 0), 0);
      max += (Number(t.maxPassengers) || 0);
    });

    const tourPieData = [
      { name: 'Заето', value: booked },
      { name: 'Свободно', value: Math.max(0, max - booked) }
    ];

    // Актуализиране на стейта
    setStats(prev => ({
      ...prev,
      totalReservations,
      totalProfit,
      averageProfitPerReservation: totalReservations > 0 ? totalProfit / totalReservations : 0,
      averageStayPerReservation: totalReservations > 0 ? totalNights / totalReservations : 0,
      totalBusPassengersBooked: booked,
      overallBusTourFulfillment: max > 0 ? (booked / max) * 100 : 0,
      financialData,
      tourPieData
    }));
  };

  const COLORS = ['#6366f1', '#e2e8f0'];

  return (
    <div className="space-y-6 pb-10">
      {/* Първи ред: Статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Резервации" mainValue={stats.totalReservations} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Ср. нощувки" value={stats.averageStayPerReservation.toFixed(1)} />
        </StatCard>
        <StatCard title="Обща Печалба" mainValue={`BGN ${stats.totalProfit.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Ср. от резерация" value={`BGN ${stats.averageProfitPerReservation.toFixed(2)}`} />
        </StatCard>
        <StatCard title="Пътници (Общо)" mainValue={stats.totalBusPassengersBooked} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Запълняемост" value={`${stats.overallBusTourFulfillment.toFixed(1)}%`} />
        </StatCard>
        <StatCard title="Банков Баланс" mainValue={`BGN ${stats.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Кеш наличност" value={`BGN ${stats.cashBalance.toFixed(2)}`} />
        </StatCard>
      </div>

      {/* Втори ред: Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Линейна графика - заема 2/3 от мястото */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-black text-slate-400 uppercase mb-6 tracking-widest">Финансов Тренд (Последни транзакции)</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Приход" />
                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} name="Разход" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Кръгова графика - заема 1/3 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h4 className="text-sm font-black text-slate-400 uppercase mb-2 tracking-widest self-start">Заетост на туровете</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.tourPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.tourPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
             <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.overallBusTourFulfillment.toFixed(1)}%</span>
             <p className="text-xs text-slate-400 font-bold uppercase">Общ капацитет</p>
          </div>
        </div>
      </div>

      {/* Трети ред: Бутони */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="z-10 mb-4 md:mb-0">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Система за управление</h3>
          <p className="opacity-60 text-sm">Всички данни са актуализирани в реално време.</p>
        </div>
        <div className="flex gap-4 z-10">
          <button className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl font-bold text-xs uppercase transition-all shadow-lg">Нова Резервация</button>
          <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold text-xs uppercase border border-white/10 transition-all">Експорт на данни</button>
        </div>
        <ArrowUpRight className="absolute bottom-[-20px] left-[-20px] size-40 opacity-5" />
      </div>
    </div>
  );
};

export default Dashboard;
