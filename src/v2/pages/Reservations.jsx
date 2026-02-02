import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, FileText, X, UserPlus, Filter, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const ReservationsPage = ({
    // Данни от основния компонент
    reservations, 
    financialTransactions,
    customers,
    
    // Филтри (съвпадащи с твоя стар код)
    filterReservationStatus, 
    filterReservationHotel, 
    filterReservationTourType,
    filterReservationCheckInDate,
    filterReservationCheckOutDate,
    searchReservationTerm,
    
    // Функции за управление
    handleReservationFilterChange,
    setSearchReservationTerm,
    resetReservationFilters,
    handleEditReservation,
    handleDeleteReservation,
    
    // Навигация и Принтиране
    setActiveTab,
    setReservationToGenerateContract,
    setReservationToPrintVoucher
}) => {
    const [expandedReservationId, setExpandedReservationId] = useState(null);
    const [viewingReservation, setViewingReservation] = useState(null);

    // Логика за филтриране (базирана на твоя стар код)
    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const matchesStatus = filterReservationStatus === 'All' || res.status === filterReservationStatus;
            const matchesHotel = !filterReservationHotel || res.hotel.toLowerCase().includes(filterReservationHotel.toLowerCase());
            const matchesTourType = filterReservationTourType === 'All' || res.tourType === filterReservationTourType;
            
            const checkInMatch = !filterReservationCheckInDate || new Date(res.checkIn) >= new Date(filterReservationCheckInDate);
            const checkOutMatch = !filterReservationCheckOutDate || new Date(res.checkOut) <= new Date(filterReservationCheckOutDate);
            
            const guestName = res.tourists && res.tourists.length > 0 
                ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}`.toLowerCase() 
                : '';
            const matchesSearch = !searchReservationTerm || guestName.includes(searchReservationTerm.toLowerCase());

            return matchesStatus && matchesHotel && matchesTourType && checkInMatch && checkOutMatch && matchesSearch;
        });
    }, [reservations, filterReservationStatus, filterReservationHotel, filterReservationTourType, filterReservationCheckInDate, filterReservationCheckOutDate, searchReservationTerm]);

    return (
        <div className="space-y-6 p-2">
            {/* Хедър */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Hotel Reservations</h2>
                <button 
                    onClick={() => setActiveTab('addReservation')} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <PlusCircle size={18} /> New Reservation
                </button>
            </div>

            {/* Панел с филтри (Твоята логика + нов дизайн) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Status</label>
                    <select name="filterReservationStatus" value={filterReservationStatus} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500">
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hotel Name</label>
                    <input type="text" name="filterReservationHotel" value={filterReservationHotel} onChange={handleReservationFilterChange} placeholder="Filter hotel..." className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tour Type</label>
                    <select name="filterReservationTourType" value={filterReservationTourType} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500">
                        <option value="All">All Types</option>
                        <option value="PARTNER">PARTNER</option>
                        <option value="HOTEL ONLY">HOTEL ONLY</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-in After</label>
                    <input type="date" name="filterReservationCheckInDate" value={filterReservationCheckInDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-out Before</label>
                    <input type="date" name="filterReservationCheckOutDate" value={filterReservationCheckOutDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm" />
                </div>
                <div className="xl:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Search Guest</label>
                    <input type="text" value={searchReservationTerm} onChange={e => setSearchReservationTerm(e.target.value)} placeholder="Name..." className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex items-end">
                    <button onClick={resetReservationFilters} className="w-full p-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all uppercase">Reset</button>
                </div>
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-black uppercase tracking-widest">
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
                            {filteredReservations.map(res => {
                                const linkedPayments = financialTransactions.filter(ft => ft.associatedReservationId === res.reservationNumber);
                                const isExpanded = expandedReservationId === res.id;
                                const leadGuest = res.tourists && res.tourists.length > 0 
                                    ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` 
                                    : 'N/A';

                                return (
                                    <React.Fragment key={res.id}>
                                        <tr 
                                            onClick={() => setExpandedReservationId(isExpanded ? null : res.id)}
                                            className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                                    {res.reservationNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800">{res.hotel}</td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{leadGuest}</td>
                                            <td className="px-6 py-4 text-[11px] leading-tight text-gray-500">
                                                <div className="font-bold text-gray-700">{res.checkIn}</div>
                                                <div>{res.checkOut}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                    res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                                                    res.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{res.status}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-full inline-block ${res.paymentStatusColor || 'bg-gray-100'}`}>
                                                    {res.paymentStatus}
                                                </div>
                                                {res.remainingAmount > 0 && (
                                                    <div className="text-[10px] text-red-400 mt-1">Due: {res.remainingAmount.toFixed(2)}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 text-right">BGN {res.profit.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setViewingReservation(res)} className="p-2 text-blue-500 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-blue-100"><Eye size={16} /></button>
                                                    <button onClick={() => handleEditReservation(res)} className="p-2 text-green-600 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-green-100"><Edit2 size={16} /></button>
                                                    <button onClick={() => { setReservationToPrintVoucher(res); setActiveTab('printVoucher'); }} className="p-2 text-yellow-600 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-yellow-100"><Printer size={16} /></button>
                                                    <button onClick={() => { setReservationToGenerateContract(res); setActiveTab('customerContract'); }} className="p-2 text-purple-600 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-purple-100"><FileText size={16} /></button>
                                                    <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-500 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-red-100"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Разгъната секция за транзакции */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan="8" className="px-12 py-4">
                                                    <div className="bg-white rounded-2xl p-4 shadow-inner border border-gray-100">
                                                        <h4 className="text-[11px] font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                            Financial History for {res.reservationNumber}
                                                        </h4>
                                                        {linkedPayments.length > 0 ? (
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-gray-400 border-b">
                                                                        <th className="py-2 font-medium">Date</th>
                                                                        <th className="py-2 font-medium">Type</th>
                                                                        <th className="py-2 font-medium">Method</th>
                                                                        <th className="py-2 text-right font-medium">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {linkedPayments.map(p => (
                                                                        <tr key={p.id}>
                                                                            <td className="py-2">{p.date}</td>
                                                                            <td className="py-2">
                                                                                <span className={`px-2 py-0.5 rounded-md ${p.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.type}</span>
                                                                            </td>
                                                                            <td className="py-2 text-gray-500">{p.method}</td>
                                                                            <td className="py-2 text-right font-bold text-gray-700">BGN {p.amount.toFixed(2)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">No transactions linked to this reservation.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Модал за детайли (viewingReservation) */}
            {viewingReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/20">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Reservation Details</span>
                                <h3 className="text-3xl font-black text-gray-800">#{viewingReservation.reservationNumber}</h3>
                            </div>
                            <button onClick={() => setViewingReservation(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all"><X /></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Hotel & Location</label>
                                    <p className="text-lg font-bold text-gray-800">{viewingReservation.hotel}</p>
                                    <p className="text-sm text-gray-500">{viewingReservation.place}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Stay Dates</label>
                                    <p className="text-lg font-bold text-gray-800">{viewingReservation.checkIn} — {viewingReservation.checkOut}</p>
                                    <p className="text-sm text-indigo-600 font-bold uppercase">{viewingReservation.totalNights} Nights • {viewingReservation.food}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Financial Status</label>
                                    <p className={`text-lg font-black ${viewingReservation.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>{viewingReservation.status}</p>
                                    <p className="text-sm text-gray-500">Op: {viewingReservation.tourOperator}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Final Amount</p>
                                    <p className="text-2xl font-black text-green-400">BGN {viewingReservation.finalAmount?.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Owed to Hotel</p>
                                    <p className="text-2xl font-black text-red-400">BGN {viewingReservation.owedToHotel?.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-300 uppercase">Net Profit</p>
                                    <p className="text-2xl font-black text-blue-300">BGN {viewingReservation.profit?.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-gray-800 uppercase flex items-center gap-2">
                                    Tourists ({viewingReservation.adults} Adults, {viewingReservation.children} Children)
                                </h4>
                                <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Name</th>
                                                <th className="px-4 py-3 text-left">ID / Personal ID</th>
                                                <th className="px-4 py-3 text-left">Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {viewingReservation.tourists?.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 font-bold">{t.firstName} {t.familyName}</td>
                                                    <td className="px-4 py-3 text-gray-500">{t.id} <span className="text-[10px] block opacity-50">{t.realId}</span></td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        <div className="text-[11px]">{t.email}</div>
                                                        <div className="text-[11px]">{t.phone}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setViewingReservation(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg">CLOSE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
