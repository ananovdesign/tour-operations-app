import React from 'react';
import { 
  Users, 
  FileCheck, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';

const Dashboard = ({ reservations, financialEntries, tasks, setTab }) => {
    // 1. Изчисляване на статистики за резервациите
    const totalReservations = reservations.length;
    const pendingReservations = reservations.filter(r => r.status === 'Pending').length;
    
    // 2. Изчисляване на финансови показатели (Логика от App.jsx)
    const income = financialEntries
        .filter(e => e.type === 'Income')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const expenses = financialEntries
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const balance = income - expenses;

    // 3. Задачи
    const activeTasks = tasks?.filter(t => t.status !== 'Completed').length || 0;

    const stats = [
        { 
            label: 'Общо Резервации', 
            value: totalReservations, 
            icon: Users, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100',
            targetTab: 'Reservations'
        },
        { 
            label: 'Изчакващи', 
            value: pendingReservations, 
            icon: AlertCircle, 
            color: 'text-yellow-600', 
            bg: 'bg-yellow-100',
            targetTab: 'Reservations'
        },
        { 
            label: 'Баланс (лв)', 
            value: balance.toFixed(2), 
            icon: TrendingUp, 
            color: 'text-green-600', 
            bg: 'bg-green-100',
            targetTab: 'FinancialS'
        },
        { 
            label: 'Активни Задачи', 
            value: activeTasks, 
            icon: FileCheck, 
            color: 'text-purple-600', 
            bg: 'bg-purple-100',
            targetTab: 'Tasks'
        },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Работно Табло</h2>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Статистически карти */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        onClick={() => setTab(stat.targetTab)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <ArrowUpRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Секция с последни събития */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Последни резервации */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        Последни Резервации
                    </h3>
                    <div className="space-y-4">
                        {reservations.slice(0, 5).map((res) => (
                            <div key={res.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
                                <div>
                                    <p className="font-semibold text-gray-700">{res.guestName}</p>
                                    <p className="text-xs text-gray-500">{res.hotel}</p>
                                </div>
                                <span className="text-sm font-medium text-blue-600">{res.checkIn}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Бързи връзки/Действия */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg text-white">
                    <h3 className="text-xl font-bold mb-4">Бързи Действия</h3>
                    <p className="text-blue-100 mb-6 text-sm">Генерирайте документи или фактури с един клик директно от тук.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setTab('Invoices')}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-xl transition text-center"
                        >
                            Нова Фактура
                        </button>
                        <button 
                            onClick={() => setTab('Documents')}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-xl transition text-center"
                        >
                            Нов Договор
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
