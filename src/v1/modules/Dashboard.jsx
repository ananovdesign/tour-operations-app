import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Users, Calendar, Wallet, Loader2, 
  Bus, Landmark, AlertCircle, ArrowUpRight 
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
  const [data, setData] = useState({
    reservations: { total: 0, totalProfit: 0, avgProfit: 0, avgStay: 0 },
    financial: { income: 0, expenses: 0, net: 0 },
    bus: { passengers: 0, fulfillment: 0, avgPerTour: 0 },
    balances: { bank: 0, cash: 0, cash2: 0 },
    status: { upcoming: 0, estProfit: 0, pending: 0 },
    invoices: { unpaidCount: 0, unpaidAmount: 0 }
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // 1. СЛУШАТЕЛ ЗА РЕЗЕРВАЦИИ
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(query(resRef), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      const totalRes = docs.length;
      // Използваме точните полета от App.jsx
      const totalIncome = docs.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const totalProfit = docs.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
      const totalExpenses = docs.reduce((sum, r) => sum + (Number(r.totalExpenses || r.totalCost || 0)), 0);
      
      // Логика за предстоящи (следващи 30 дни)
      const now = new Date();
      const next30Days = new Date();
      next30Days.setDate(now.getDate() + 30);
      
      const upcoming = docs.filter(r => {
        if (!r.startDate) return false;
        const startDate = new Date(r.startDate);
        return startDate >= now && startDate <= next30Days;
      });

      setData(prev => ({
        ...prev,
        reservations: {
          total: totalRes,
          totalProfit: totalProfit.toLocaleString('bg-BG', { minimumFractionDigits: 2 }),
          avgProfit: totalRes > 0 ? (totalProfit / totalRes).toFixed(2) : "0.00",
          avgStay: 0 // Тук може да се добави изчисление на нощувки ако е нужно
        },
        financial: {
          income: totalIncome.toLocaleString('bg-BG', { minimumFractionDigits: 2 }),
          expenses: totalExpenses.toLocaleString('bg-BG', { minimumFractionDigits: 2 }),
          net: (totalIncome - totalExpenses).toLocaleString('bg-BG', { minimumFractionDigits: 2 })
        },
        balances: {
          bank: (totalIncome - totalExpenses).toFixed(2),
          cash: "0.00",
          cash2: "0.00"
        },
        status: {
          upcoming: upcoming.length,
          estProfit: upcoming.reduce((sum, r) => sum + (Number(r.profit) || 0), 0).toFixed(2),
          pending: docs.filter(r => r.status === 'Pending' || r.status === 'Pending').length
        }
      }));
      setLoading(false);
    });

    // 2. СЛУШАТЕЛ ЗА ФАКТУРИ (За здравето на фактурите)
    const invRef = collection(db, `artifacts/${appId}/users/${userId}/invoices`);
    const unsubInv = onSnapshot(query(invRef), (snapshot) => {
      const invDocs = snapshot.docs.map(doc => doc.data());
      const unpaid = invDocs.filter(inv => inv.status !== 'Paid' && inv.status !== 'Платена');
      const unpaidSum = unpaid.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

      setData(prev => ({
        ...prev,
        invoices: {
          unpaidCount: unpaid.length,
          unpaidAmount: unpaidSum.toLocaleString('bg-BG', { minimumFractionDigits: 2 })
        }
      }));
    });

    // 3. СЛУШАТЕЛ ЗА ТУРОВЕ
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    const unsubTours = onSnapshot(query(toursRef), (snapshot) => {
      const tourDocs = snapshot.docs.map(doc => doc.data());
      const totalPass = tourDocs.reduce((sum, t) => sum + (Number(t.passengersCount) || 0), 0);
      
      setData(prev => ({
        ...prev,
        bus: {
          passengers: totalPass || 0,
          fulfillment: tourDocs.length > 0 ? ((totalPass / (tourDocs.length * 50)) * 100).toFixed(1) : 0,
          avgPerTour: tourDocs.length > 0 ? (totalPass / tourDocs.length).toFixed(1) : 0
        }
      }));
    });

    return () => { unsubRes(); unsubInv(); unsubTours(); };
  }, [userId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Резервации" mainValue={data.reservations.total} icon={Users} color="bg-blue-600" loading={loading}>
          <MetricRow label="Обща печалба" value={`BGN ${data.reservations.totalProfit}`} colorClass="text-emerald-500" />
          <MetricRow label="Ср. Печалба/Рез" value={`BGN ${data.reservations.avgProfit}`} />
        </StatCard>

        <StatCard title="Финансов отчет" mainValue={`BGN ${data.financial.income}`} icon={Wallet} color="bg-emerald-500" loading={loading}>
          <MetricRow label="Разходи" value={`BGN ${data.financial.expenses}`} colorClass="text-rose-500" />
          <MetricRow label="Нетна П/З" value={`BGN ${data.financial.net}`} colorClass={parseFloat(data.financial.net) >= 0 ? "text-emerald-500" : "text-rose-500"} />
        </StatCard>

        <StatCard title="Автобусни Турове" mainValue={data.bus.passengers} icon={Bus} color="bg-purple-600" loading={loading}>
          <MetricRow label="Запълняемост" value={`${data.bus.fulfillment}%`} />
          <MetricRow label="Ср. пътници" value={data.bus.avgPerTour} />
        </StatCard>

        <StatCard title="Наличности" mainValue={`BGN ${data.balances.bank}`} icon={Landmark} color="bg-orange-500" loading={loading}>
          <MetricRow label="Cash Balance" value={`BGN ${data.balances.cash}`} />
          <MetricRow label="Cash 2 Balance" value={`BGN ${data.balances.cash2}`} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Статус Резервации" mainValue={data.status.upcoming} icon={Calendar} color="bg-indigo-500" loading={loading}>
          <MetricRow label="Следващи 30 дни" value={data.status.upcoming} />
          <MetricRow label="Очаквана печалба" value={`BGN ${data.status.estProfit}`} colorClass="text-orange-500" />
          <MetricRow label="Изчакващи (Pending)" value={data.status.pending} colorClass="text-yellow-500" />
        </StatCard>

        <StatCard title="Здраве на фактурите" mainValue={data.invoices.unpaidCount} icon={AlertCircle} color="bg-rose-500" loading={loading}>
          <MetricRow label="Неплатени суми" value={`BGN ${data.invoices.unpaidAmount}`} colorClass="text-rose-600" />
          <MetricRow label="Просрочени" value="0" />
        </StatCard>

        <div className="bg-slate-900 dark:bg-blue-700 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase italic">Бързи бутони</h3>
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
