import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, Filter } from 'lucide-react';

const ReservationsPage = ({
    reservations,
    reservationForm,
    editingReservation,
    setReservationForm,
    setEditingReservation,
    handleReservationSubmit,
    handleDeleteReservation,
    setTab,
    setPrintData
}) => {
    // --- Локални състояния за филтриране ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // --- Логика за филтриране (Идентична със стария App.jsx) ---
    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const matchesSearch = 
                res.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.hotel?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [reservations, searchTerm, statusFilter]);

    // --- Автоматично изчисляване при промяна на формата ---
    const handleFormChange = (field, value) => {
        const updatedForm = { ...reservationForm, [field]: value };
        
        // Автоматично пресмятане на нощувки, ако имаме две дати
        if (field === 'checkIn' || field === 'checkOut') {
            const start = new Date(updatedForm.checkIn);
            const end = new Date(updatedForm.checkOut);
            if (!isNaN(start) && !isNaN(end) && end > start) {
                updatedForm.totalNights = (end - start) / (1000 * 60 * 60 * 24);
            }
        }
        setReservationForm(updatedForm);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Управление на Резервации</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Търси гост или хотел..."
                            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">Всички статуси</option>
                        <option value="Confirmed">Потвърдени</option>
                        <option value="Pending">Изчакващи</option>
                        <option value="Cancelled">Анулирани</option>
                    </select>
                </div>
            </div>

            {/* Форма за Резервация */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleReservationSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Хотел" className="p-2 border rounded-lg" value={reservationForm.hotel} onChange={(e) => handleFormChange('hotel', e.target.value)} required />
                    <input type="text" placeholder="Име на гост" className="p-2 border rounded-lg" value={reservationForm.guestName} onChange={(e) => handleFormChange('guestName', e.target.value)} required />
                    <input type="date" className="p-2 border rounded-lg" value={reservationForm.checkIn} onChange={(e) => handleFormChange('checkIn', e.target.value)} required />
                    <input type="date" className="p-2 border rounded-lg" value={reservationForm.checkOut} onChange={(e) => handleFormChange('checkOut', e.target.value)} required />
                    <input type="number" placeholder="Възрастни" className="p-2 border rounded-lg" value={reservationForm.adults} onChange={(e) => handleFormChange('adults', e.target.value)} />
                    <input type="number" placeholder="Деца" className="p-2 border rounded-lg" value={reservationForm.children} onChange={(e) => handleFormChange('children', e.target.value)} />
                    <input type="number" placeholder="Печалба (BGN)" className="p-2 border rounded-lg" value={reservationForm.profit} onChange={(e) => handleFormChange('profit', Number(e.target.value))} />
                    <select className="p-2 border rounded-lg" value={reservationForm.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                        <option value="Confirmed">Потвърдена</option>
                        <option value="Pending">Изчакваща</option>
                        <option value="Cancelled">Анулирана</option>
                    </select>
                    <div className="md:col-span-4 flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2">
                            <PlusCircle size={20} /> {editingReservation ? 'Обнови' : 'Запази'}
                        </button>
                        {editingReservation && (
                            <button type="button" onClick={() => setEditingReservation(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition">Отказ</button>
                        )}
                    </div>
                </form>
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Хотел / Гост</th>
                            <th className="px-6 py-4">Период / Нощувки</th>
                            <th className="px-6 py-4">Печалба</th>
                            <th className="px-6 py-4">Статус</th>
                            <th className="px-6 py-4 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReservations.map((res) => (
                            <tr key={res.id} className="hover:bg-blue-50/50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{res.hotel}</div>
                                    <div className="text-sm text-gray-500">{res.guestName}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium">{res.checkIn} - {res.checkOut}</div>
                                    <div className="text-xs text-blue-600 font-bold">{res.totalNights || 0} нощувки</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-green-700">BGN {(res.profit || 0).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        res.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                        res.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>{res.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => { setPrintData(res); setTab('VoucherPrint'); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Ваучер"><Printer size={18} /></button>
                                    <button onClick={() => { setEditingReservation(res); setReservationForm(res); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReservationsPage;
