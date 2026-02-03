import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  TrendingUp, Users, Calendar, Wallet, Loader2, 
  Bus, Landmark, AlertCircle, FileWarning, ArrowUpRight, BarChart3
} from 'lucide-react';

// Помощен компонент за малките редове с данни вътре в картите
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
        {loading ? (
          <Loader2 className="animate-spin text-slate-300" size={18} />
        ) : (
          <h3 className="text-xl font-black dark:text-white text-slate-800">{mainValue}</h3>
        )}
      </div>
    </div>
    <div className="border-t border-slate-50 dark:border-slate-800 pt-2">
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    reservations: { total: 0, totalProfit: 0, avgProfit: 0, avgStay: 0 },
    financial: { income: 0, expenses: 0, net: 0 },
    bus: { passengers: 0, fulfillment: 0, avgPerTour: 0 },
    balances: { bank: 0, cash: 0, cash2: 0 },
    status: { upcoming: 0, estProfit: 0, pending: 0 },
    invoices: { unpaidCount: 0, unpaidAmount: 0, overdueCount: 0, overdueAmount: 0 }
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Референции към колекциите
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    
    const unsubscribe = onSnapshot(query(resRef), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      // Логика за изчисления (аналогична на старата ти версия)
      const totalRes = docs.length;
      const totalProfit = docs.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
      const totalIncome = docs.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const totalExpenses = docs.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0);
      
      setData({
        reservations: {
          total: totalRes,
          totalProfit: totalProfit.toFixed(2),
          avgProfit: totalRes > 0 ? (totalProfit / totalRes).toFixed(2) : 0,
          avgStay: 3.9 // Тук може да добавим реално изчисление от нощувките
        },
        financial: {
          income: totalIncome.toFixed(2),
          expenses: totalExpenses.toFixed(2),
          net: (totalIncome - totalExpenses).toFixed(2)
        },
        bus: {
          passengers: 441, // Тези данни вероятно идват от друга колекция 'tours'
          fulfillment: 84.8,
          avgPerTour: 33.9
        },
        balances: {
          bank: (totalIncome - totalExpenses).toFixed(2),
          cash: "0.00",
          cash2: "0.00"
        },
        status: {
          upcoming: docs.filter(r => r.status === 'upcoming').length,
          estProfit: "0.00",
          pending: docs.filter(r => r.status === 'pending').length
        },
        invoices: {
          unpaidCount: 0,
          unpaidAmount: "0.00",
          overdueCount: 0,
          overdueAmount: "0.00"
        }
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Първи ред: Основни метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Резервации" mainValue={data.reservations.total} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Обща печалба" value={`${data.reservations.totalProfit} лв.`} colorClass="text-emerald-500" />
          <MetricRow label="Средна печалба" value={`${data.reservations.avgProfit} лв.`} />
        </StatCard>

        <StatCard title="Финансов отчет" mainValue={`${data.financial.income} лв.`} icon={Wallet} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Разходи" value={`${data.financial.expenses} лв.`} colorClass="text-red-500" />
          <MetricRow label="Нетна печалба" value={`${data.financial.net} лв.`} colorClass="text-blue-500" />
        </StatCard>

        <StatCard title="Автобусни Турове" mainValue={data.bus.passengers} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Запълняемост" value={`${data.bus.fulfillment}%`} />
          <MetricRow label="Ср. пътници" value={data.bus.avgPerTour} />
        </StatCard>

        <StatCard title="Наличности" mainValue={`${data.balances.bank} лв.`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="В брой (Cash 1)" value={`${data.balances.cash} лв.`} />
          <MetricRow label="В брой (Cash 2)" value={`${data.balances.cash2} лв.`} />
        </StatCard>
      </div>

      {/* Втори ред: Статус и Здраве на фактурите */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Статус Резервации" mainValue={data.status.upcoming} icon={Calendar} color="bg-indigo-500" loading={loading}>
          <MetricRow label="Предстоящи (30 дни)" value={data.status.upcoming} />
          <MetricRow label="Очаквана печалба" value={`${data.status.estProfit} лв.`} colorClass="text-orange-500" />
          <MetricRow label="Изчакващи (Pending)" value={data.status.pending} colorClass="text-yellow-500" />
        </StatCard>

        <StatCard title="Неплатени Продажби" mainValue={data.invoices.unpaidCount} icon={AlertCircle} color="bg-rose-500" loading={loading}>
          <MetricRow label="Обща сума" value={`${data.invoices.unpaidAmount} лв.`} colorClass="text-rose-600" />
          <MetricRow label="Закъснели разходи" value={data.invoices.overdueCount} />
        </StatCard>

        {/* Бързи бутони - Интегрирани в дизайна */}
        <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4 tracking-tighter italic">БЪРЗИ ДЕЙСТВИЯ</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ РЕЗЕРВАЦИЯ</button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ ФАКТУРА</button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ ТУР</button>
              <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-xs font-bold transition-all border border-white/10">+ РАЗХОД</button>
            </div>
          </div>
          <ArrowUpRight className="absolute bottom-[-10px] right-[-10px] size-32 opacity-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
        </div>
      </div>

      {/* Графиката (Място за Recharts) */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Месечен Анализ</h3>
            <p className="text-sm text-slate-400 font-medium">Приходи спрямо разходи за текущата година</p>
          </div>
          <BarChart3 className="text-slate-200" size={32} />
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-3xl text-slate-300 font-bold uppercase tracking-widest text-xs">
           Визуализацията се генерира...
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
