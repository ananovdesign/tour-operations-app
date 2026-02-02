import React, { useState, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useReservations } from '../../hooks/useReservations';
import { Plus, FileText, TrendingUp, TrendingDown, Wallet, Search } from 'lucide-react';

const Finance = ({ userId }) => {
    const { reservations } = useReservations(userId);
    const { formatCurrency, displayCurrency, convert } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');

    // Изчисляваме общите приходи на база резервациите
    const totals = useMemo(() => {
        return reservations.reduce((acc, res) => {
            const amount = Number(res.totalAmount) || 0;
            const resCurr = res.currency || 'BGN';
            const value = convert(amount, resCurr, displayCurrency);
            
            if (res.status === 'Confirmed') acc.confirmed += value;
            acc.total += value;
            return acc;
        }, { total: 0, confirmed: 0 });
    }, [reservations, displayCurrency, convert]);

    return (
        <div className="space-y-6">
            {/* КАРТИ ЗА ФИНАНСОВО СЪСТОЯНИЕ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex justify-between items-start opacity-80 mb-4">
                        <Wallet size={24} />
                        <span className="text-xs font-bold uppercase tracking-wider">Общ Оборот</span>
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(totals.total, displayCurrency)}</p>
                    <p className="text-sm opacity-70 mt-2">Всички генерирани резервации</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4 text-emerald-600">
                        <TrendingUp size={24} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Потвърдени приходи</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{formatCurrency(totals.confirmed, displayCurrency)}</p>
                    <p className="text-sm text-slate-500 mt-2">Реални постъпления в касата</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4 text-rose-500">
                        <TrendingDown size={24} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Очаквани разходи</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{formatCurrency(0, displayCurrency)}</p>
                    <p className="text-sm text-slate-500 mt-2">Плащания към доставчици</p>
                </div>
            </div>

            {/* ТАБЛИЦА С ФАКТУРИ / ТРАНЗАКЦИИ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Търси фактура или клиент..."
                            className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-slate-800 transition-all shadow-md">
                        <Plus size={18} /> Нова Фактура
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase text-slate-400 font-bold border-b">
                            <th className="px-6 py-4 font-bold">Номер / Дата</th>
                            <th className="px-6 py-4 font-bold">Клиент</th>
                            <th className="px-6 py-4 font-bold">Сума (Оригинал)</th>
                            <th className="px-6 py-4 font-bold">Сума ({displayCurrency})</th>
                            <th className="px-6 py-4 font-bold text-center">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {reservations.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">INV-{res.id.slice(0, 5).toUpperCase()}</p>
                                    <p className="text-xs text-slate-400">{res.startDate || 'Няма дата'}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">{res.leadGuest || 'Анонимен'}</td>
                                <td className="px-6 py-4 font-mono text-sm">
                                    {res.totalAmount} {res.currency || 'BGN'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-blue-600">
                                        {formatCurrency(res.totalAmount, res.currency || 'BGN')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                        <FileText size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Finance;
