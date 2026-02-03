import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { TrendingUp, Users, Calendar, Wallet, Loader2 } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1">
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      {loading ? (
        <Loader2 className="animate-spin text-slate-300" size={20} />
      ) : (
        <h3 className="text-2xl font-black dark:text-white text-slate-800">{value}</h3>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { t, language } = useApp();
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    thisMonthCount: 0,
    activeTours: 0
  });
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Пътят до твоите резервации
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const q = query(resRef);

    // Слушаме за промени в реално време
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalRevenue = docs.reduce((sum, res) => sum + (Number(res.totalAmount) || 0), 0);
      const thisMonth = docs.filter(res => {
        const resDate = new Date(res.createdAt); // или друго поле за дата, което ползваш
        return resDate >= firstDayOfMonth;
      }).length;

      setStats({
        totalReservations: docs.length,
        totalRevenue: totalRevenue.toFixed(2),
        thisMonthCount: thisMonth,
        activeTours: 0 // Тук може да добавим логика за активни автобусни турове по-късно
      });
      setLoading(false);
    }, (error) => {
      console.error("Грешка при зареждане на статистики:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Статистически карти */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.reservations} 
          value={stats.totalReservations} 
          icon={Users} 
          color="bg-blue-600" 
          loading={loading}
        />
        <StatCard 
          title={language === 'bg' ? "Общ Приход" : "Total Revenue"} 
          value={`${stats.totalRevenue} лв.`} 
          icon={Wallet} 
          color="bg-emerald-500" 
          loading={loading}
        />
        <StatCard 
          title={t.tasks} 
          value={stats.thisMonthCount} 
          icon={Calendar} 
          color="bg-purple-600" 
          loading={loading}
        />
        <StatCard 
          title={language === 'bg' ? "Растеж" : "Growth"} 
          value="+12%" 
          icon={TrendingUp} 
          color="bg-orange-500" 
          loading={loading}
        />
      </div>

      {/* Секция с графики и таблица */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">{language === 'bg' ? "Месечен отчет" : "Monthly Report"}</h3>
            <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase">Live</span>
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 font-medium">
             [ Тук ще поставим Recharts графиката в следващата стъпка ]
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
           <h3 className="text-xl font-black mb-6">{language === 'bg' ? "Бързи действия" : "Quick Actions"}</h3>
           <div className="space-y-3">
              <button className="w-full p-4 text-left rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all font-bold text-sm flex items-center justify-between group">
                {language === 'bg' ? "Нова резервация" : "New Reservation"}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button className="w-full p-4 text-left rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all font-bold text-sm flex items-center justify-between group">
                {language === 'bg' ? "Издаване на фактура" : "Create Invoice"}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
