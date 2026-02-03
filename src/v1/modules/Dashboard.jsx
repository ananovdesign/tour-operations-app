import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
// Импортираме преводите от новия файл
import { uiTranslations } from './translations'; 
import { 
  Users, Calendar, Loader2, Bus, Landmark, ArrowUpRight, TrendingUp 
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

const Dashboard = ({ lang = 'bg' }) => {
  const [loading, setLoading] = useState(true);
  const [collectionsData, setCollectionsData] = useState({
    reservations: [], financialTransactions: [], tours: [], customers: [], products: []
  });

  // Взимаме правилния език
  const t = useMemo(() => uiTranslations[lang] || uiTranslations.bg, [lang]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const collections = ['reservations', 'financialTransactions', 'tours', 'customers', 'products'];
    const unsubscribes = [];
    const tempStore = {};

    collections.forEach(colName => {
      const ref = collection(db, `artifacts/${appId}/users/${userId}/${colName}`);
      const unsub = onSnapshot(query(ref), (snapshot) => {
        tempStore[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (Object.keys(tempStore).length === collections.length) {
          setCollectionsData({ ...tempStore });
          setLoading(false);
        }
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [userId]);

  const stats = useMemo(() => {
    const { reservations, financialTransactions, tours } = collectionsData;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(); thirtyDays.setDate(today.getDate() + 30);

    const activeRes = reservations.filter(res => res.status !== 'Cancelled');
    
    // Всички твои оригинални калкулации
    const totalReservations = activeRes.length;
    const totalProfit = activeRes.reduce((sum, res) => sum + (Number(res.profit) || 0), 0);
    const totalNights = activeRes.reduce((sum, res) => sum + (Number(res.totalNights) || 0), 0);
    
    const upcoming = activeRes.filter(res => {
        const d = new Date(res.checkIn);
        return d >= today && d <= thirtyDays;
    });

    const income = financialTransactions.filter(f => f.type === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const expense = financialTransactions.filter(f => f.type === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0);

    let booked = 0, max = 0;
    tours.forEach(tour => {
        const linked = activeRes.filter(res => res.linkedTourId === tour.tourId);
        booked += linked.reduce((s, r) => s + (Number(r.adults) || 0) + (Number(r.children) || 0), 0);
        max += (Number(tour.maxPassengers) || 0);
    });

    const balances = { Bank: 0, Cash: 0, 'Cash 2': 0 };
    financialTransactions.forEach(ft => {
        const amt = Number(ft.amount) || 0;
        if (balances.hasOwnProperty(ft.method)) balances[ft.method] += (ft.type === 'income' ? amt : -amt);
    });

    const chartMap = {};
    financialTransactions.forEach(ft => {
      const d = ft.date || 'N/A';
      if (!chartMap[d]) chartMap[d] = { date: d, income: 0, expense: 0 };
      chartMap[d][ft.type] += Number(ft.amount) || 0;
    });

    return {
      totalReservations, totalProfit,
      avgProfit: totalReservations > 0 ? totalProfit / totalReservations : 0,
      avgStay: totalReservations > 0 ? totalNights / totalReservations : 0,
      income, expense, booked,
      fulfillment: max > 0 ? (booked / max) * 100 : 0,
      avgTour: tours.length > 0 ? booked / tours.length : 0,
      bank: balances.Bank, cash: balances.Cash, cash2: balances['Cash 2'],
      upcomingCount: upcoming.length,
      upcomingProfit: upcoming.reduce((s, r) => s + (Number(r.profit) || 0), 0),
      pending: activeRes.filter(r => r.status === 'Pending').length,
      chart: Object.values(chartMap).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-7),
      pie: [{ name: t.booked, value: booked }, { name: t.free, value: Math.max(0, max - booked) }]
    };
  }, [collectionsData, t]);

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.reservations} mainValue={stats.totalReservations} icon={Users} color="bg-blue-600">
          <MetricRow label={t.avgNights} value={stats.avgStay.toFixed(1)} />
          <MetricRow label={t.pending} value={stats.pending} colorClass="text-yellow-500" />
        </StatCard>

        <StatCard title={t.finances} mainValue={`${t.currency} ${stats.income.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500">
          <MetricRow label={t.expenses} value={`${t.currency} ${stats.expense.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label={t.totalProfit} value={`${t.currency} ${stats.totalProfit.toFixed(2)}`} colorClass="text-emerald-500" />
        </StatCard>

        <StatCard title={t.passengers} mainValue={stats.booked} icon={Bus} color="bg-purple-600">
          <MetricRow label={t.avgPerTour} value={stats.avgTour.toFixed(1)} />
          <MetricRow label={t.fulfillment} value={`${stats.fulfillment.toFixed(1)}%`} />
        </StatCard>

        <StatCard title={`${t.balances} (Bank)`} mainValue={`${t.currency} ${stats.bank.toFixed(2)}`} icon={Landmark} color="bg-orange-500">
          <MetricRow label="Cash" value={`${t.currency} ${stats.cash.toFixed(2)}`} />
          <MetricRow label="Cash 2" value={`${t.currency} ${stats.cash2.toFixed(2)}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">{t.trend}</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name={t.income} />
                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} name={t.expense} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h4 className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest self-start">{t.tourOccupancy}</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill="#6366f1" /><Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <span className="text-2xl font-black mt-4">{stats.fulfillment.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
             <Calendar className="text-indigo-500" size={20} />
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.next30Days}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-2xl font-black">{stats.upcomingCount}</p>
               <p className="text-[10px] text-slate-400 uppercase font-bold">{t.resCount}</p>
             </div>
             <div>
               <p className="text-2xl font-black text-emerald-500">{t.currency} {stats.upcomingProfit.toFixed(2)}</p>
               <p className="text-[10px] text-slate-400 uppercase font-bold">{t.expectedProfit}</p>
             </div>
          </div>
        </div>
        
        <div className="bg-indigo-600 p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
           <div>
             <h4 className="font-black italic uppercase text-lg leading-tight">{t.quickLook}</h4>
             <p className="text-indigo-100 text-xs opacity-80">{t.avgProfitRes}: {t.currency} {stats.avgProfit.toFixed(2)}</p>
           </div>
           <button className="bg-white text-indigo-600 p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
             <ArrowUpRight size={24} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
