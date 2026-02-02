import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, FileText, X, Eye, ChevronDown, ChevronUp, Calendar, CreditCard, Users, Search } from 'lucide-react';

const ReservationsPage = ({
    reservations = [], 
    financialTransactions = [],
    // Филтри (състояния) подадени от App.js
    filterReservationStatus, 
    filterReservationHotel, 
    filterReservationTourType,
    filterReservationCheckInDate,
    filterReservationCheckOutDate,
    searchReservationTerm,
    // Функции за промяна подадени от App.js
    handleReservationFilterChange,
    setSearchReservationTerm,
    resetReservationFilters,
    // Действия (Actions)
    handleEditReservation,
    handleDeleteReservation,
    setActiveTab,
    setReservationToGenerateContract,
    setReservationToPrintVoucher
}) => {
    const [expandedReservationId, setExpandedReservationId] = useState(null);
    const [viewingReservation, setViewingReservation] = useState(null);

    // --- ФИКСИРАНА ЛОГИКА ЗА ФИЛТРИРАНЕ ---
    const filteredReservations = useMemo(() => {
        return reservations
            .filter(res => {
                // 1. Статус (Мачва точно или ако е "All" пропуска)
                const matchesStatus = !filterReservationStatus || filterReservationStatus === 'All' || res.status === filterReservationStatus;
                
                // 2. Хотел (Търси съвпадение на стринг, без значение главни/малки букви)
                const matchesHotel = !filterReservationHotel || (res.hotel && res.hotel.toLowerCase().includes(filterReservationHotel.toLowerCase()));
                
                // 3. Тип тур
                const matchesTourType = !filterReservationTourType || filterReservationTourType === 'All' || res.tourType === filterReservationTourType;
                
                // 4. Дати (Преобразуваме към времеви отпечатък за коректно сравнение)
                const checkInMatch = !filterReservationCheckInDate || (res.checkIn && new Date(res.checkIn) >= new Date(filterReservationCheckInDate));
                const checkOutMatch = !filterReservationCheckOutDate || (res.checkOut && new Date(res.checkOut) <= new Date(filterReservationCheckOutDate));
                
                // 5. Търсене по Lead Guest Име или Номер на резервация
                let matchesSearch = true;
                if (searchReservationTerm) {
                    const term = searchReservationTerm.toLowerCase();
                    const guestName = res.tourists && res.tourists.length > 0 
                        ? `${res.tourists[0].firstName || ''} ${res.tourists[0].familyName || ''}`.toLowerCase()
                        : '';
                    const resNum = (res.reservationNumber || '').toLowerCase();
                    matchesSearch = guestName.includes(term) || resNum.includes(term);
                }

                return matchesStatus && matchesHotel && matchesTourType && checkInMatch && checkOutMatch && matchesSearch;
            })
            .map(res => { 
                // Изчисляване на плащания и баланс в движение
                const paymentsForRes = financialTransactions.filter(ft =>
                    ft.type === 'income' && ft.associatedReservationId === res.reservationNumber
                );
                const totalPaid = paymentsForRes.reduce((sum, ft) => sum + (Number(ft.amount) || 0), 0);
                const remainingAmount = (Number(res.finalAmount) || 0) - totalPaid;

                let paymentStatus = 'Unpaid';
                let paymentStatusColor = 'bg-red-100 text-red-800';
                
                if (totalPaid >= (Number(res.finalAmount) || 0) && Number(res.finalAmount) > 0) {
                    paymentStatus = 'Paid';
                    paymentStatusColor = 'bg-green-100 text-green-800';
                } else if (totalPaid > 0) {
                    paymentStatus = 'Partially Paid';
                    paymentStatusColor = 'bg-yellow-100 text-yellow-800';
                }

                return { ...res, totalPaid, remainingAmount, paymentStatus, paymentStatusColor };
            })
            .sort((a, b) => {
                // Сортиране по номер (низходящо)
                const numA = parseInt(a.reservationNumber?.replace(/\D/g, '') || '0', 10);
                const numB = parseInt(b.reservationNumber?.replace(/\D/g, '') || '0', 10);
                return numB - numA;
            });
    }, [reservations, financialTransactions, filterReservationStatus, filterReservationHotel, filterReservationTourType, filterReservationCheckInDate, filterReservationCheckOutDate, searchReservationTerm]);

    return (
        <div className="space-y-6 p-2 uppercase">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Hotel Reservations</h2>
                <button 
                    onClick={() => setActiveTab('addReservation')} 
                    className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <PlusCircle size={18} /> New Reservation
                </button>
            </div>

            {/* ГРИД С ФИЛТРИ - С КОРЕКТНИ NAME АТРИБУТИ */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Status</label>
                    <select 
                        name="filterReservationStatus" 
                        value={filterReservationStatus} 
                        onChange={handleReservationFilterChange} 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold"
                    >
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Hotel</label>
                    <input 
                        type="text" 
                        name="filterReservationHotel" 
                        value={filterReservationHotel} 
                        onChange={handleReservationFilterChange} 
                        placeholder="Search hotel..." 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold" 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Tour Type</label>
                    <select 
                        name="filterReservationTourType" 
                        value={filterReservationTourType} 
                        onChange={handleReservationFilterChange} 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold"
                    >
                        <option value="All">All</option>
                        <option value="PARTNER">PARTNER</option>
                        <option value="HOTEL ONLY">HOTEL ONLY</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Check-in</label>
                    <input 
                        type="date" 
                        name="filterReservationCheckInDate" 
                        value={filterReservationCheckInDate} 
                        onChange={handleReservationFilterChange} 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold" 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Check-out</label>
                    <input 
                        type="date" 
                        name="filterReservationCheckOutDate" 
                        value={filterReservationCheckOutDate} 
                        onChange={handleReservationFilterChange} 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold" 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 ml-1">Lead Guest</label>
                    <input 
                        type="text" 
                        value={searchReservationTerm} 
                        onChange={e => setSearchReservationTerm(e.target.value)} 
                        placeholder="Name or RES#" 
                        className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold" 
                    />
                </div>
                <div className="flex items-end">
                    <button onClick={resetReservationFilters} className="w-full p-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all">RESET</button>
                </div>
            </div>

            {/* ТАБЛИЦА С РЕЗЕРВАЦИИ */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Number</th>
                            <th className="px-6 py-4">Hotel</th>
                            <th className="px-6 py-4">Lead Guest</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Payment</th>
                            <th className="px-6 py-4 text-right">Profit</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredReservations.map(res => (
                            <React.Fragment key={res.id}>
                                <tr 
                                    onClick={() => setExpandedReservationId(expandedReservationId === res.id ? null : res.id)} 
                                    className={`cursor-pointer transition-all ${expandedReservationId === res.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 flex items-center gap-2">
                                        {expandedReservationId === res.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        {res.reservationNumber}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{res.hotel}</td>
                                    <td className="px-6 py-4 text-gray-600 font-medium lowercase first-letter:uppercase">
                                        {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-[11px] leading-tight">
                                        <div className="font-bold text-gray-700">{res.checkIn}</div>
                                        <div className="text-gray-400">{res.checkOut}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${res.paymentStatusColor}`}>
                                            {res.paymentStatus}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-gray-900 text-right">BGN {(Number(res.profit) || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setViewingReservation(res)} className="p-2 text-blue-500 hover:bg-white rounded-full shadow-sm border border-gray-100"><Eye size={16} /></button>
                                            <button onClick={() => handleEditReservation(res)} className="p-2 text-[#28A745] hover:bg-white rounded-full shadow-sm border border-gray-100"><Edit2 size={16} /></button>
                                            <button onClick={() => { setReservationToPrintVoucher(res); setActiveTab('printVoucher'); }} className="p-2 text-yellow-600 hover:bg-white rounded-full shadow-sm border border-gray-100"><Printer size={16} /></button>
                                            <button onClick={() => { setReservationToGenerateContract(res); setActiveTab('customerContract'); }} className="p-2 text-purple-600 hover:bg-white rounded-full shadow-sm border border-gray-100"><FileText size={16} /></button>
                                            <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-500 hover:bg-white rounded-full shadow-sm border border-gray-100"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedReservationId === res.id && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan="8" className="px-12 py-4">
                                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                                <h4 className="text-[11px] font-black text-gray-400 mb-3 flex items-center gap-2"><CreditCard size={14}/> Payments Info</h4>
                                                <div className="flex gap-10 text-xs font-bold">
                                                    <div>Total: <span className="text-indigo-600">BGN {res.finalAmount}</span></div>
                                                    <div>Paid: <span className="text-green-600">BGN {res.totalPaid.toFixed(2)}</span></div>
                                                    <div className="text-red-600">Owed: BGN {res.remainingAmount.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL ЗА ДЕТАЙЛЕН ПРЕГЛЕД */}
            {viewingReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 lowercase">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col uppercase">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-3xl font-black text-gray-800">#{viewingReservation.reservationNumber}</h3>
                            <button onClick={() => setViewingReservation(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X /></button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-gray-50 p-5 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black text-gray-400 mb-2 italic">Hotel</h4>
                                    <p className="text-lg font-black text-gray-800 leading-tight">{viewingReservation.hotel}</p>
                                    <p className="text-xs text-indigo-600 font-black mt-2">{viewingReservation.food}</p>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black text-gray-400 mb-2 italic">Financials</h4>
                                    <p className="font-bold">Total: BGN {viewingReservation.finalAmount}</p>
                                    <p className="text-indigo-600 font-black">Profit: BGN {viewingReservation.profit}</p>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black text-gray-400 mb-2 italic">Stay</h4>
                                    <p className="font-bold">IN: {viewingReservation.checkIn}</p>
                                    <p className="font-bold">OUT: {viewingReservation.checkOut}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setViewingReservation(null)} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-lg uppercase text-xs">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
