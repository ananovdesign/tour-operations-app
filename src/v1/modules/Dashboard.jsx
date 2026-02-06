import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Calendar, Loader2, Bus, Landmark, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// ОФИЦИАЛЕН ФИКСИРАН КУРС
const FIXED_EXCHANGE_RATE = 1.95583;

// ДЕФИНИРАМЕ ПРЕВОДИТЕ ТУК
const uiTranslations = {
  bg: {
    reservations: "Резервации", avgNights: "Ср. нощувки", pending: "Изчакващи (Pending)",
    finances: "Финансов отчет", expenses: "Разходи", totalProfit: "Обща Печалба",
    passengers: "Брой пътници (Общо)", avgPerTour: "Ср. на тур", fulfillment: "Запълняемост",
    balances: "Наличности", bank: "Bank", trend: "Финансов Тренд", tourOccupancy: "Заетост Турове",
    booked: "Заето", free: "Свободно", next30Days: "Следващи 30 дни",
    expectedProfit: "Очаквана Печалба", quickLook: "Бърз преглед",
    avgProfitRes: "Ср. печалба от резервация", income: "Приход", expense: "Разход",
    totalCapacity: "Общ капацитет", resCount: "Брой резервации"
  },
  en: {
    reservations: "Reservations", avgNights: "Avg Nights", pending: "Pending",
    finances: "Financial Report", expenses: "Expenses", totalProfit: "Total Profit",
    passengers: "Total Passengers", avgPerTour: "Avg / Tour", fulfillment: "Fulfillment",
    balances: "Balances", bank: "Bank", trend: "Financial Trend", tourOccupancy: "Tour Occupancy",
    booked: "Booked", free: "Free", next30Days: "Next 30 Days",
    expectedProfit: "Expected Profit", quickLook: "Quick Insight",
    avgProfitRes: "Avg Profit / Res", income: "Income", expense: "Expense",
    totalCapacity: "Total Capacity", resCount: "Res Count"
  }
};

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

  const t = uiTranslations[lang] || uiTranslations.bg;
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

  // --- CALCULATIONS WITH EURO CONVERSION ---
  const stats = useMemo(() => {
    const { reservations, financialTransactions, tours } = collectionsData;
    
    // Helper за конвертиране на всяка сума към Евро
    const toEuro = (amount, currency) => {
        const val = Number(amount) || 0;
        // Ако валутата е изрично EUR, връщаме стойността.
        // Ако е BGN или няма валута (стари записи), делим на курса.
        if (currency === 'EUR') return val;
        return val / FIXED_EXCHANGE_RATE;
    };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const activeReservations = reservations.filter(res => res.status !== 'Cancelled');
    
    // Изчисляваме печалбата от резервации в ЕВРО
    const profitableReservations = activeReservations.filter(res => (Number(res.profit) || 0) > 0);
    const totalReservations = activeReservations.length;
    const totalProfit = profitableReservations.reduce((sum, res) => sum + toEuro(res.profit, res.currency), 0);
    
    const averageProfitPerReservation = totalReservations > 0 ? totalProfit / totalReservations : 0;
    const totalNightsSum = activeReservations.reduce((sum, res) => sum + (Number(res.totalNights) || 0), 0);
    const averageStayPerReservation = totalReservations > 0 ? totalNightsSum / totalReservations : 0;

    const upcomingReservations = activeReservations.filter(res => {
        const checkInDate = new Date(res.checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate >= today && checkInDate <= thirtyDaysFromNow;
    });
    const countUpcomingReservations = upcomingReservations.length;
    const profitUpcomingReservations = upcomingReservations.reduce((sum, res) => sum + toEuro(res.profit, res.currency), 0);

    const pendingReservations = activeReservations.filter(res => res.status === 'Pending');
    const countPendingReservations = pendingReservations.length;

    // Финансови транзакции в ЕВРО
    const totalIncome = financialTransactions
        .filter(ft => ft.type === 'income')
        .reduce((sum, ft) => sum + toEuro(ft.amount, ft.currency), 0);

    const totalExpenses = financialTransactions
        .filter(ft => ft.type === 'expense')
        .reduce((sum, ft) => sum + toEuro(ft.amount, ft.currency), 0);

    // Турове (няма промяна във валутата тук, само бройки)
    let totalBookedPassengersAcrossAllTours = 0;
    let totalMaxPassengersAcrossAllTours = 0;
    let totalBusToursCount = 0;

    tours.forEach(tour => {
        totalBusToursCount++;
        const linkedReservations = activeReservations.filter(res => res.linkedTourId === tour.tourId);
        const bookedPassengersForTour = linkedReservations.reduce((sum, res) => sum + (Number(res.adults) || 0) + (Number(res.children) || 0), 0);
        totalBookedPassengersAcrossAllTours += bookedPassengersForTour;
        totalMaxPassengersAcrossAllTours += (Number(tour.maxPassengers) || 0);
    });

    const overallBusTourFulfillment = totalMaxPassengersAcrossAllTours > 0
        ? (totalBookedPassengersAcrossAllTours / totalMaxPassengersAcrossAllTours) * 100
        : 0;
    const averageTourPassengers = totalBusToursCount > 0 ? totalBookedPassengersAcrossAllTours / totalBusToursCount : 0;

    // Баланси по каси (всичко обърнато в ЕВРО)
    const balances = {
        Bank: { income: 0, expense: 0 },
        Cash: { income: 0, expense: 0 },
        'Cash 2': { income: 0, expense: 0 },
    };

    financialTransactions.forEach(ft => {
        if (balances[ft.method]) {
            balances[ft.method][ft.type] += toEuro(ft.amount, ft.currency);
        }
    });

    const bankBalance = balances.Bank.income - balances.Bank.expense;
    const cashBalance = balances.Cash.income - balances.Cash.expense;
    const cash2Balance = balances['Cash 2'].income - balances['Cash 2'].expense;

    // Графика (Data for Chart) - също в ЕВРО
    const chartDataMap = {};
    financialTransactions.forEach(ft => {
      const d = ft.date || 'N/A';
      if (!chartDataMap[d]) chartDataMap[d] = { date: d, income: 0, expense: 0 };
      chartDataMap[d][ft.type] += toEuro(ft.amount, ft.currency);
    });
    const financialChartData = Object.values(chartDataMap).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-7);

    return {
        totalReservations, totalProfit, averageProfitPerReservation, averageStayPerReservation,
        totalIncome, totalExpenses, overallBusTourFulfillment, totalBusPassengersBooked: totalBookedPassengersAcrossAllTours,
        bankBalance, cashBalance, cash2Balance, countUpcomingReservations, profitUpcomingReservations, 
        countPendingReservations, averageTourPassengers, financialChartData, 
        pieData: [{ name: t.booked, value: totalBookedPassengersAcrossAllTours }, { name: t.free, value: Math.max(0, totalMaxPassengersAcrossAllTours - totalBookedPassengersAcrossAllTours) }]
    };
  }, [collectionsData, t]);

  if (loading) return <div className="flex h-64 items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.reservations} mainValue={stats.totalReservations} icon={Users} color="bg-blue-600">
          <MetricRow label={t.avgNights} value={stats.averageStayPerReservation.toFixed(1)} />
          <MetricRow label={t.pending} value={stats.countPendingReservations} colorClass="text-yellow-500" />
        </StatCard>

        <StatCard title={t.finances} mainValue={`€${stats.totalIncome.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500">
          <MetricRow label={t.expenses} value={`€${stats.totalExpenses.toFixed(2)}`} colorClass="text-rose-500" />
          <MetricRow label={t.totalProfit} value={`€${stats.totalProfit.toFixed(2)}`} colorClass="text-emerald-500" />
        </StatCard>

        <StatCard title={t.passengers} mainValue={stats.totalBusPassengersBooked} icon={Bus} color="bg-purple-600">
          <MetricRow label={t.avgPerTour} value={stats.averageTourPassengers.toFixed(1)} />
          <MetricRow label={t.fulfillment} value={`${stats.overallBusTourFulfillment.toFixed(1)}%`} />
        </StatCard>

        <StatCard title={`${t.balances} (${t.bank})`} mainValue={`€${stats.bankBalance.toFixed(2)}`} icon={Landmark} color="bg-orange-500">
          <MetricRow label="Cash" value={`€${stats.cashBalance.toFixed(2)}`} />
          <MetricRow label="Cash 2" value={`€${stats.cash2Balance.toFixed(2)}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">{t.trend} (EUR)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.financialChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
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
                <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill="#6366f1" /><Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
             <span className="text-2xl font-black">{stats.overallBusTourFulfillment.toFixed(1)}%</span>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.totalCapacity}</p>
          </div>
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
               <p className="text-2xl font-black">{stats.countUpcomingReservations}</p>
               <p className="text-[10px] text-slate-400 uppercase font-bold">{t.resCount}</p>
             </div>
             <div>
               <p className="text-2xl font-black text-emerald-500">€{stats.profitUpcomingReservations.toFixed(2)}</p>
               <p className="text-[10px] text-slate-400 uppercase font-bold">{t.expectedProfit}</p>
             </div>
          </div>
        </div>
        
        <div className="bg-indigo-600 p-6 rounded-3xl text-white flex items-center justify-between shadow-xl">
           <div>
             <h4 className="font-black italic uppercase text-lg leading-tight">{t.quickLook}</h4>
             <p className="text-indigo-100 text-xs opacity-80">{t.avgProfitRes}: €{stats.averageProfitPerReservation.toFixed(2)}</p>
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
