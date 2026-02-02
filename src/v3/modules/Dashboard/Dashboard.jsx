import React, { useMemo } from 'react';
import { useReservations } from '../../hooks/useReservations';
import { useCurrency } from '../../context/CurrencyContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, Wallet, Calendar } from 'lucide-react';

const Dashboard = ({ userId }) => {
    const { reservations, loading } = useReservations(userId);
    const { formatCurrency, displayCurrency, convert, EUR_TO_BGN } = useCurrency();

    // Калкулации за статистиките
    const stats = useMemo(() => {
        const totalRaw = reservations.reduce((sum, res) => sum + (Number(res.totalAmount) || 0), 0);
        
        // Преизчисляваме общата сума спрямо избраната валута за показване
        // В базата приемаме, че старите данни са в BGN
        const totalValue = reservations.reduce((sum, res) => {
            const amount = Number(res.totalAmount) || 0;
            const resCurrency = res.currency || 'BGN';
            
            if (displayCurrency === resCurrency) return sum + amount;
            return sum + convert(amount, resCurrency, displayCurrency);
        }, 0);

        return {
            count: reservations.length,
            totalRevenue: totalValue,
            confirmed: reservations.filter(r => r.status === 'Confirmed').length,
            pending: reservations.filter(r => r.status !== 'Confirmed').length
        };
    }, [reservations, displayCurrency, convert]);

    // Данни за графиката (Приходи по месеци)
    const chartData = useMemo(() => {
        const months = {};
        reservations.forEach(res => {
            const date = res.createdAt?.toDate?.() || new Date();
            const monthName = date.toLocaleString('bg-BG', { month: 'short' });
            
            const amount = Number(res.totalAmount) || 0;
            const resCurrency = res.currency || 'BGN';
            const value = displayCurrency === resCurrency ? amount : convert(amount, resCurrency, displayCurrency);
            
            months[monthName] = (months[monthName] || 0) + value;
        });

        return Object.keys(months).map(name => ({ name, total: months[name] }));
    }, [reservations, displayCurrency, convert]);

    if (loading) return <div className="p-10 text-center">Зареждане на анализи...</div>;

    return (
        <div className="space-y-8">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Wallet size={24} /></div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">+12%</span>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Общ Оборот</h3>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue, displayCurrency)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Users size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Брой Резервации</h3>
                    <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><TrendingUp size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Потвърдени</h3>
                    <p className="text-2xl font-bold text-slate-800">{stats.confirmed}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Calendar size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">Чакащи</h3>
                    <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Приходи по месеци ({displayCurrency})</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => formatCurrency(value, displayCurrency)}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-4 text-blue-400">Бързи справки</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-slate-400 text-xs uppercase font-bold">Курс на деня</p>
                            <p className="text-xl font-mono">1 EUR = {EUR_TO_BGN} BGN</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-slate-400 text-xs uppercase font-bold">Последна активност</p>
                            <p className="text-sm mt-1">Добавена резервация RES-8821</p>
                        </div>
                        <div className="pt-4">
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-lg">
                                Генерирай отчет (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
