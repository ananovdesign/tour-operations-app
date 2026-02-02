import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, FileText, X, UserPlus, Filter, Eye } from 'lucide-react';

const ReservationsPage = ({
    reservations, customers,
    reservationForm, setReservationForm,
    editingReservation, setEditingReservation,
    handleReservationSubmit, handleDeleteReservation,
    setTab, setPrintData
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedForPreview, setSelectedForPreview] = useState(null);
    
    // --- ФИЛТРИ ---
    const [searchTerm, setSearchTerm] = useState('');
    const [hotelFilter, setHotelFilter] = useState('All');
    const [tourTypeFilter, setTourTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Списък с уникални хотели за филтъра
    const uniqueHotels = useMemo(() => ['All', ...new Set(reservations.map(r => r.hotel).filter(Boolean))], [reservations]);

    // --- ФИЛТРИРАНЕ И СОРТИРАНЕ ---
    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const matchesSearch = res.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 res.reservationNumber?.toString().includes(searchTerm);
            const matchesHotel = hotelFilter === 'All' || res.hotel === hotelFilter;
            const matchesTourType = tourTypeFilter === 'All' || res.tourType === tourTypeFilter;
            const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
            
            const resDate = new Date(res.checkIn);
            const matchesDate = (!dateRange.start || resDate >= new Date(dateRange.start)) &&
                                (!dateRange.end || resDate <= new Date(dateRange.end));

            return matchesSearch && matchesHotel && matchesTourType && matchesStatus && matchesDate;
        }).sort((a, b) => Number(b.reservationNumber) - Number(a.reservationNumber)); 
    }, [reservations, searchTerm, hotelFilter, tourTypeFilter, statusFilter, dateRange]);

    const openModal = (res = null) => {
        if (res) {
            setEditingReservation(res);
            setReservationForm(res);
        } else {
            setEditingReservation(null);
            // Автоматично генериране на следващ номер
            const nextResNumber = reservations.length > 0 
                ? Math.max(...reservations.map(r => Number(r.reservationNumber) || 0)) + 1 
                : 1001;
            
            setReservationForm({
                reservationNumber: nextResNumber,
                hotel: '', guestName: '', checkIn: '', checkOut: '', 
                tourType: 'Hotel', status: 'Pending', paymentStatus: 'Unpaid',
                clientPrice: 0, providerPrice: 0, profit: 0,
                adults: 2, children: 0, mealPlan: 'BB'
            });
        }
        setIsModalOpen(true);
    };

    const handleFormChange = (field, value) => {
        const updated = { ...reservationForm, [field]: value };
        // Автоматично изчисляване на печалба
        if (field === 'clientPrice' || field === 'providerPrice') {
            updated.profit = (Number(updated.clientPrice) || 0) - (Number(updated.providerPrice) || 0);
        }
        setReservationForm(updated);
    };

    const openPreview = (res) => {
        setSelectedForPreview(res);
        setIsPreviewOpen(true);
    };

    return (
        <div className="space-y-6 p-2">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Резервационна Система</h2>
                <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all text-sm">
                    <PlusCircle size={18} /> Нова Резервация
                </button>
            </div>

            {/* --- ПАНЕЛ С ФИЛТРИ --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" placeholder="Търси № или име..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="p-2.5 border rounded-xl text-sm" value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}>
                    <option value="All">Хотел (Всички)</option>
                    {uniqueHotels.filter(h => h !== 'All').map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select className="p-2.5 border rounded-xl text-sm" value={tourTypeFilter} onChange={e => setTourTypeFilter(e.target.value)}>
                    <option value="All">Тип (Всички)</option>
                    <option value="Hotel">Hotel Only</option>
                    <option value="Bus Tour">Bus Tour</option>
                    <option value="Flight">Flight</option>
                </select>
                <select className="p-2.5 border rounded-xl text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">Статус (Всички)</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <div className="flex gap-2">
                    <input type="date" className="w-full p-2.5 border rounded-xl text-xs" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <input type="date" className="w-full p-2.5 border rounded-xl text-xs" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
            </div>

            {/* --- ТАБЛИЦА --- */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">№</th>
                                <th className="px-6 py-4">Хотел</th>
                                <th className="px-6 py-4">Клиент</th>
                                <th className="px-6 py-4">Дати</th>
                                <th className="px-6 py-4">Статус</th>
                                <th className="px-6 py-4">Плащане</th>
                                <th className="px-6 py-4 text-center">Печалба</th>
                                <th className="px-6 py-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredReservations.map(res => (
                                <tr key={res.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{res.reservationNumber}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{res.hotel}</td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">{res.guestName}</td>
                                    <td className="px-6 py-4 text-[11px] leading-tight">
                                        <div className="font-bold">{res.checkIn}</div>
                                        <div className="text-gray-400">{res.checkOut}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                            res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{res.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${res.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                                            ● {res.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-gray-900 bg-gray-50/30 text-center">{Number(res.profit || 0).toFixed(2)} лв.</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openPreview(res)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Бърз преглед"><Eye size={17} /></button>
                                            <button onClick={() => { setPrintData(res); setTab('VoucherPrint'); }} className="p-2 text-blue-600 hover:bg-white rounded-lg shadow-sm sm:shadow-none" title="Ваучер"><Printer size={17} /></button>
                                            <button onClick={() => { setPrintData(res); setTab('CustomerContractPrint'); }} className="p-2 text-orange-600 hover:bg-white rounded-lg" title="Договор"><FileText size={17} /></button>
                                            <button onClick={() => openModal(res)} className="p-2 text-indigo-600 hover:bg-white rounded-lg"><Edit2 size={17} /></button>
                                            <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-lg" title="Изтрий"><Trash2 size={17} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL PREVIEW --- */}
            {isPreviewOpen && selectedForPreview && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl p-10 relative border border-indigo-50">
                        <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"><X /></button>
                        <div className="space-y-6">
                            <div className="border-b pb-6">
                                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Детайли за резервация</span>
                                <h3 className="text-4xl font-black text-gray-800">#{selectedForPreview.reservationNumber}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Хотел</label>
                                    <p className="text-lg font-bold text-gray-800 leading-tight">{selectedForPreview.hotel}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Клиент</label>
                                    <p className="text-lg font-bold text-gray-800 leading-tight">{selectedForPreview.guestName}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Престой</label>
                                    <p className="font-bold text-gray-700">{selectedForPreview.checkIn} — {selectedForPreview.checkOut}</p>
                                    <p className="text-xs text-indigo-600 font-bold uppercase">{selectedForPreview.mealPlan}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Статус Плащане</label>
                                    <p className={`font-black uppercase text-sm ${selectedForPreview.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>{selectedForPreview.paymentStatus}</p>
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-3xl flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase">Цена Клиент</p>
                                    <p className="text-2xl font-black text-indigo-900">{Number(selectedForPreview.clientPrice).toFixed(2)} лв.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase">Марж</p>
                                    <p className="text-2xl font-black text-indigo-600">{Number(selectedForPreview.profit).toFixed(2)} лв.</p>
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button onClick={() => { setIsPreviewOpen(false); openModal(selectedForPreview); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">РЕДАКТИРАЙ</button>
                                <button onClick={() => setIsPreviewOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all">ЗАТВОРИ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800">
                                    {editingReservation ? `Редакция на #${reservationForm.reservationNumber}` : 'Нова Резервация'}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Управление на данни за договор и ваучер</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all"><X /></button>
                        </div>
                        
                        <form onSubmit={(e) => { handleReservationSubmit(e); setIsModalOpen(false); }} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Секция 1 */}
                            <div className="space-y-5">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <UserPlus size={14}/> Основна Информация
                                </h4>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Избери Клиент (CRM)</label>
                                    <select className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                                            onChange={(e) => {
                                                const cust = customers.find(c => c.id === e.target.value);
                                                if(cust) handleFormChange('guestName', cust.name);
                                            }}>
                                        <option value="">-- Избери съществуващ --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Име на гост (Lead)</label>
                                    <input type="text" className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={reservationForm.guestName} onChange={e => handleFormChange('guestName', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Тип Пътуване</label>
                                    <select className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl" value={reservationForm.tourType} onChange={e => handleFormChange('tourType', e.target.value)}>
                                        <option value="Hotel">Hotel Only</option>
                                        <option value="Bus Tour">Bus Tour</option>
                                        <option value="Flight">Flight</option>
                                    </select>
                                </div>
                            </div>

                            {/* Секция 2 */}
                            <div className="space-y-5 border-x px-8 border-gray-100">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={14}/> Настаняване
                                </h4>
                                <input type="text" placeholder="Име на хотел" className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold" value={reservationForm.hotel} onChange={e => handleFormChange('hotel', e.target.value)} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Check-In</label>
                                        <input type="date" className="w-full mt-1 p-2 bg-gray-50 border-none rounded-xl text-sm" value={reservationForm.checkIn} onChange={e => handleFormChange('checkIn', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Check-Out</label>
                                        <input type="date" className="w-full mt-1 p-2 bg-gray-50 border-none rounded-xl text-sm" value={reservationForm.checkOut} onChange={e => handleFormChange('checkOut', e.target.value)} required />
                                    </div>
                                </div>
                                <select className="w-full p-3 bg-gray-50 border-none rounded-2xl" value={reservationForm.mealPlan} onChange={e => handleFormChange('mealPlan', e.target.value)}>
                                    <option value="BB">Bed & Breakfast (BB)</option>
                                    <option value="HB">Half Board (HB)</option>
                                    <option value="FB">Full Board (FB)</option>
                                    <option value="AI">All Inclusive (AI)</option>
                                </select>
                            </div>

                            {/* Секция 3 */}
                            <div className="space-y-5">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest">Финанси</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Цена за клиент (BGN)</label>
                                        <input type="number" step="0.01" className="w-full p-3 bg-green-50 border-none rounded-2xl font-black text-green-700 text-xl" value={reservationForm.clientPrice} onChange={e => handleFormChange('clientPrice', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Цена към доставчик</label>
                                        <input type="number" step="0.01" className="w-full p-3 bg-red-50 border-none rounded-2xl font-bold text-red-700" value={reservationForm.providerPrice} onChange={e => handleFormChange('providerPrice', e.target.value)} />
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-indigo-900 rounded-2xl text-white">
                                        <span className="text-xs font-bold uppercase opacity-60">Марж:</span>
                                        <span className="text-xl font-black">{(Number(reservationForm.profit) || 0).toFixed(2)} лв.</span>
                                    </div>
                                    <select className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold" value={reservationForm.paymentStatus} onChange={e => handleFormChange('paymentStatus', e.target.value)}>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Partially Paid">Partially Paid</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-full pt-8 flex gap-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                                    {editingReservation ? 'ОБНОВИ РЕЗЕРВАЦИЯТА' : 'ЗАПИШИ РЕЗЕРВАЦИЯТА'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
