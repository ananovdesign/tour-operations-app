import React, { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useReservations } from '../../hooks/useReservations';
import { Plus, Search, Filter } from 'lucide-react';

const ReservationList = ({ userId, onAddClick }) => {
    const { reservations, loading } = useReservations(userId);
    const { formatCurrency, baseCurrency, convert } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = reservations.filter(res => 
        res.leadGuest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.reservationNumber?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Търсене по име или номер..." 
                        className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={onAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
                >
                    <Plus size={18} /> Нова Резервация
                </button>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b text-slate-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">№ / Дата</th>
                            <th className="px-6 py-4">Клиент</th>
                            <th className="px-6 py-4">Дестинация</th>
                            <th className="px-6 py-4">Обща Сума</th>
                            <th className="px-6 py-4">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.map(res => (
                            <tr key={res.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-blue-900">{res.reservationNumber}</div>
                                    <div className="text-xs text-slate-400">{res.createdAt?.toDate?.().toLocaleDateString() || res.date}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">{res.leadGuest}</td>
                                <td className="px-6 py-4 text-slate-600">{res.destination || '---'}</td>
                                <td className="px-6 py-4 font-semibold">
                                    {/* Тук ползваме логиката за преизчисляване */}
                                    {formatCurrency(res.totalAmount, res.currency || 'BGN')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {res.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-10 text-center text-slate-400">Зареждане на данни...</div>}
            </div>
        </div>
    );
};

export default ReservationList;
