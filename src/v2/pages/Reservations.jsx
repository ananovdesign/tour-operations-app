import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, FileText, X, UserPlus, Calendar } from 'lucide-react';

const ReservationsPage = ({
    reservations, customers,
    reservationForm, setReservationForm,
    editingReservation, setEditingReservation,
    handleReservationSubmit, handleDeleteReservation,
    setTab, setPrintData
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Пълни филтри от оригиналния код
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // --- ЛОГИКА ЗА ТЪРСЕНЕ И ФИЛТРИРАНЕ (АНАЛИЗИРАНА ОТ APP.JSX) ---
    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const matchesSearch = 
                res.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.hotel?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
            
            const resDate = new Date(res.checkIn);
            const matchesDate = (!dateRange.start || resDate >= new Date(dateRange.start)) &&
                                (!dateRange.end || resDate <= new Date(dateRange.end));

            return matchesSearch && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
    }, [reservations, searchTerm, statusFilter, dateRange]);

    // --- ФУНКЦИЯ ЗА ИЗБОР НА СЪЩЕСТВУВАЩ КЛИЕНТ ---
    const handleCustomerSelect = (customerId) => {
        const selected = customers.find(c => c.id === customerId);
        if (selected) {
            setReservationForm(prev => ({
                ...prev,
                guestName: selected.name,
                customerRefId: selected.id // Пазим връзката с клиента
            }));
        }
    };

    // --- АВТОМАТИЧНО ИЗЧИСЛЯВАНЕ НА ПЕЧАЛБА (МАРЖ) ---
    const updateFinancials = (field, value) => {
        const updated = { ...reservationForm, [field]: Number(value) };
        const profit = (updated.clientPrice || 0) - (updated.providerPrice || 0);
        setReservationForm({ ...updated, profit });
    };

    const openModal = (res = null) => {
        if (res) {
            setEditingReservation(res);
            setReservationForm(res);
        } else {
            setEditingReservation(null);
            setReservationForm({
                hotel: '', guestName: '', checkIn: '', checkOut: '', 
                adults: 2, children: 0, status: 'Confirmed', 
                clientPrice: 0, providerPrice: 0, profit: 0,
                mealPlan: 'HB', roomType: 'Standard'
            });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Управление на резервации</h2>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                    <PlusCircle size={20} /> Нова Резервация
                </button>
            </div>

            {/* --- РАЗШИРЕН ПАНЕЛ С ФИЛТРИ (КАТО В ОРИГИНАЛА) --- */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" placeholder="Търси гост/хотел..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 col-span-1 md:col-span-2">
                    <input type="date" className="w-full p-2 border rounded-xl text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <input type="date" className="w-full p-2 border rounded-xl text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <select className="w-full p-2 border rounded-xl" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">Всички статуси</option>
                    <option value="Confirmed">Потвърдени</option>
                    <option value="Pending">Изчакващи</option>
                    <option value="Cancelled">Анулирани</option>
                </select>
            </div>

            {/* --- ТАБЛИЦА С ДЕЙСТВИЯ ЗА ПРИНТ --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Хотел и Гост</th>
                            <th className="p-4">Период</th>
                            <th className="p-4">Финанси (BGN)</th>
                            <th className="p-4">Статус</th>
                            <th className="p-4 text-right">Документи и Редакция</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReservations.map(res => (
                            <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold">{res.hotel}</div>
                                    <div className="text-sm text-gray-500">{res.guestName}</div>
                                </td>
                                <td className="p-4 text-sm">
                                    <div>{res.checkIn} / {res.checkOut}</div>
                                    <div className="text-blue-600 font-medium">{res.mealPlan}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs text-gray-400">Марж: {res.profit}</div>
                                    <div className="font-bold text-green-600">{res.clientPrice} BGN</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{res.status}</span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => { setPrintData(res); setTab('VoucherPrint'); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Ваучер"><Printer size={18} /></button>
                                    <button onClick={() => { setPrintData(res); setTab('CustomerContractPrint'); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Договор"><FileText size={18} /></button>
                                    <button onClick={() => openModal(res)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- СЛОЖНА МОДАЛНА ФОРМА (АНАЛИЗИРАНА ОТ ОРИГИНАЛНИЯ КОД) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold">{editingReservation ? 'Редактиране' : 'Нова Резервация'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X /></button>
                        </div>
                        
                        <form onSubmit={(e) => { handleReservationSubmit(e); setIsModalOpen(false); }} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Секция Клиент */}
                            <div className="col-span-1 space-y-4 border-r pr-6">
                                <h4 className="font-bold text-blue-600 flex items-center gap-2"><UserPlus size={16}/> Клиент</h4>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">Избери от съществуващи</label>
                                    <select className="w-full p-2.5 border rounded-xl mt-1" onChange={(e) => handleCustomerSelect(e.target.value)}>
                                        <option value="">-- Нов Клиент --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">Име на гост (Lead)</label>
                                    <input type="text" className="w-full p-2.5 border rounded-xl" value={reservationForm.guestName} onChange={e => setReservationForm({...reservationForm, guestName: e.target.value})} required />
                                </div>
                            </div>

                            {/* Секция Хотел */}
                            <div className="col-span-1 space-y-4 border-r pr-6">
                                <h4 className="font-bold text-blue-600 flex items-center gap-2"><Calendar size={16}/> Детайли престой</h4>
                                <input type="text" placeholder="Хотел" className="w-full p-2.5 border rounded-xl font-bold" value={reservationForm.hotel} onChange={e => setReservationForm({...reservationForm, hotel: e.target.value})} required />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" className="p-2 border rounded-xl text-sm" value={reservationForm.checkIn} onChange={e => setReservationForm({...reservationForm, checkIn: e.target.value})} />
                                    <input type="date" className="p-2 border rounded-xl text-sm" value={reservationForm.checkOut} onChange={e => setReservationForm({...reservationForm, checkOut: e.target.value})} />
                                </div>
                                <select className="w-full p-2 border rounded-xl" value={reservationForm.mealPlan} onChange={e => setReservationForm({...reservationForm, mealPlan: e.target.value})}>
                                    <option value="RO">Само нощувка (RO)</option>
                                    <option value="BB">Закуска (BB)</option>
                                    <option value="HB">Закуска и вечеря (HB)</option>
                                    <option value="FB">Пълен пансион (FB)</option>
                                    <option value="AI">All Inclusive</option>
                                </select>
                            </div>

                            {/* Секция Финанси */}
                            <div className="col-span-1 space-y-4">
                                <h4 className="font-bold text-blue-600">Финанси и Статус</h4>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">Цена към клиент</label>
                                    <input type="number" className="w-full p-2.5 border rounded-xl font-bold" value={reservationForm.clientPrice} onChange={e => updateFinancials('clientPrice', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">Цена към доставчик</label>
                                    <input type="number" className="w-full p-2.5 border rounded-xl" value={reservationForm.providerPrice} onChange={e => updateFinancials('providerPrice', e.target.value)} />
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl text-green-700 font-bold flex justify-between">
                                    <span>Марж:</span>
                                    <span>{(reservationForm.profit || 0).toFixed(2)} BGN</span>
                                </div>
                                <select className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold" value={reservationForm.status} onChange={e => setReservationForm({...reservationForm, status: e.target.value})}>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="col-span-full pt-6 border-t flex gap-4">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">ЗАПАЗИ РЕЗЕРВАЦИЯТА</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Отказ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
