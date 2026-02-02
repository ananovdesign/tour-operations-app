import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, FileText, X } from 'lucide-react';

const ReservationsPage = ({
    reservations,
    reservationForm,
    setReservationForm,
    editingReservation,
    setEditingReservation,
    handleReservationSubmit,
    handleDeleteReservation,
    setTab,
    setPrintData
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Филтриране ---
    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const matchesSearch = 
                res.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.hotel?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
    }, [reservations, searchTerm, statusFilter]);

    // --- Логика на формата ---
    const openModal = (res = null) => {
        if (res) {
            setEditingReservation(res);
            setReservationForm(res);
        } else {
            setEditingReservation(null);
            setReservationForm({
                hotel: '', guestName: '', checkIn: '', checkOut: '', 
                adults: 2, children: 0, status: 'Confirmed', profit: 0, totalNights: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleFormChange = (field, value) => {
        const updatedForm = { ...reservationForm, [field]: value };
        if (field === 'checkIn' || field === 'checkOut') {
            const start = new Date(updatedForm.checkIn);
            const end = new Date(updatedForm.checkOut);
            if (!isNaN(start) && !isNaN(end) && end > start) {
                updatedForm.totalNights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            }
        }
        setReservationForm(updatedForm);
    };

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800">Резервации</h2>
                    <p className="text-gray-500 text-sm">Управление на хотелски резервации и документи</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                >
                    <PlusCircle size={20} /> Нова Резервация
                </button>
            </div>

            {/* Търсене и Филтри */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Търси по гост или хотел..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">Всички статуси</option>
                    <option value="Confirmed">Потвърдени</option>
                    <option value="Pending">Изчакващи</option>
                    <option value="Cancelled">Анулирани</option>
                </select>
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase font-black tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Детайли за настаняване</th>
                            <th className="px-6 py-4">Период</th>
                            <th className="px-6 py-4">Финанси</th>
                            <th className="px-6 py-4">Статус</th>
                            <th className="px-6 py-4 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReservations.map((res) => (
                            <tr key={res.id} className="hover:bg-blue-50/40 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{res.hotel}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        {res.guestName} <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{res.adults}A + {res.children}C</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-semibold text-gray-700">{res.checkIn} — {res.checkOut}</div>
                                    <div className="text-xs text-blue-600 font-bold">{res.totalNights} нощувки</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-green-600">
                                    {Number(res.profit || 0).toFixed(2)} BGN
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                        res.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                        res.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>{res.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setPrintData(res); setTab('VoucherPrint'); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Ваучер"><Printer size={16} /></button>
                                        <button onClick={() => { setPrintData(res); setTab('CustomerContractPrint'); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Договор"><FileText size={16} /></button>
                                        <button onClick={() => openModal(res)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL WINDOW (Pop-up) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-black text-gray-800">
                                {editingReservation ? 'Редактиране на резервация' : 'Нова резервация'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => { handleReservationSubmit(e); setIsModalOpen(false); }} className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Хотел</label>
                                <input type="text" className="p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={reservationForm.hotel} onChange={(e) => handleFormChange('hotel', e.target.value)} required />
                            </div>
                            <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Име на гост</label>
                                <input type="text" className="p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={reservationForm.guestName} onChange={(e) => handleFormChange('guestName', e.target.value)} required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Настаняване</label>
                                <input type="date" className="p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={reservationForm.checkIn} onChange={(e) => handleFormChange('checkIn', e.target.value)} required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Напускане</label>
                                <input type="date" className="p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500" value={reservationForm.checkOut} onChange={(e) => handleFormChange('checkOut', e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Възрастни</label>
                                    <input type="number" className="p-3 border rounded-xl bg-gray-50" value={reservationForm.adults} onChange={(e) => handleFormChange('adults', e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Деца</label>
                                    <input type="number" className="p-3 border rounded-xl bg-gray-50" value={reservationForm.children} onChange={(e) => handleFormChange('children', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Печалба (BGN)</label>
                                <input type="number" step="0.01" className="p-3 border rounded-xl bg-gray-50 font-bold text-green-700" value={reservationForm.profit} onChange={(e) => handleFormChange('profit', e.target.value)} />
                            </div>
                            <div className="col-span-2 pt-4 flex gap-3">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                    {editingReservation ? 'ЗАПАЗИ ПРОМЕНИТЕ' : 'СЪЗДАЙ РЕЗЕРВАЦИЯ'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200">Отказ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
