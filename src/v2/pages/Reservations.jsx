import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, FileText, X, Eye, ChevronDown, ChevronUp, Calendar, CreditCard, Users } from 'lucide-react';

const ReservationsPage = ({
    reservations = [], 
    financialTransactions = [],
    filterReservationStatus, 
    filterReservationHotel, 
    filterReservationTourType,
    filterReservationCheckInDate,
    filterReservationCheckOutDate,
    searchReservationTerm,
    handleReservationFilterChange,
    setSearchReservationTerm,
    resetReservationFilters,
    handleEditReservation,
    handleDeleteReservation,
    setActiveTab,
    setReservationToGenerateContract,
    setReservationToPrintVoucher
}) => {
    const [expandedReservationId, setExpandedReservationId] = useState(null);
    const [viewingReservation, setViewingReservation] = useState(null);

    // --- ТВОЯТА ЛОГИКА ЗА ИЗЧИСЛЯВАНЕ, ФИЛТРИРАНЕ И СОРТИРАНЕ ---
    const filteredReservations = useMemo(() => {
        return reservations
            .filter(res => {
                const matchesStatus = !filterReservationStatus || filterReservationStatus === 'All' || res.status === filterReservationStatus;
                const matchesHotel = !filterReservationHotel || (res.hotel && res.hotel.toLowerCase().includes(filterReservationHotel.toLowerCase()));
                const matchesTourType = !filterReservationTourType || filterReservationTourType === 'All' || res.tourType === filterReservationTourType;
                const checkInMatch = !filterReservationCheckInDate || (res.checkIn && new Date(res.checkIn) >= new Date(filterReservationCheckInDate));
                const checkOutMatch = !filterReservationCheckOutDate || (res.checkOut && new Date(res.checkOut) <= new Date(filterReservationCheckOutDate));
                
                const guestName = res.tourists && res.tourists.length > 0 
                    ? `${res.tourists[0].firstName || ''} ${res.tourists[0].familyName || ''}`.toLowerCase() 
                    : '';
                const matchesSearch = !searchReservationTerm || guestName.includes(searchReservationTerm.toLowerCase());

                return matchesStatus && matchesHotel && matchesTourType && checkInMatch && checkOutMatch && matchesSearch;
            })
            .map(res => { 
                // ТВОЯТА ЛОГИКА ЗА PAYMENT STATUS
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

                return {
                    ...res,
                    totalPaid,
                    remainingAmount,
                    paymentStatus,
                    paymentStatusColor,
                };
            })
            .sort((a, b) => {
                // ТВОЕТО СОРТИРАНЕ (substring(3) за махане на префикса)
                const numA = parseInt(a.reservationNumber?.substring(3) || '0', 10);
                const numB = parseInt(b.reservationNumber?.substring(3) || '0', 10);
                return numB - numA;
            });
    }, [reservations, financialTransactions, filterReservationStatus, filterReservationHotel, filterReservationTourType, filterReservationCheckInDate, filterReservationCheckOutDate, searchReservationTerm]);

    return (
        <div className="space-y-6 p-2">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Hotel Reservations</h2>
                <button 
                    onClick={() => setActiveTab('addReservation')} 
                    className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <PlusCircle size={18} /> New Reservation
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Status</label>
                    <select name="filterReservationStatus" value={filterReservationStatus} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]">
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Past">Past</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hotel</label>
                    <input type="text" name="filterReservationHotel" value={filterReservationHotel} onChange={handleReservationFilterChange} placeholder="Filter hotel..." className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tour Type</label>
                    <select name="filterReservationTourType" value={filterReservationTourType} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]">
                        <option value="All">All</option>
                        <option value="PARTNER">PARTNER</option>
                        <option value="HOTEL ONLY">HOTEL ONLY</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-in</label>
                    <input type="date" name="filterReservationCheckInDate" value={filterReservationCheckInDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-out</label>
                    <input type="date" name="filterReservationCheckOutDate" value={filterReservationCheckOutDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm" />
                </div>
                <div className="xl:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lead Guest</label>
                    <input type="text" value={searchReservationTerm} onChange={e => setSearchReservationTerm(e.target.value)} placeholder="Search name..." className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]" />
                </div>
                <div className="flex items-end">
                    <button onClick={resetReservationFilters} className="w-full p-2.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black hover:bg-gray-200 uppercase transition-all">Reset</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
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
                        {filteredReservations.map(res => (
                            <React.Fragment key={res.id}>
                                <tr onClick={() => setExpandedReservationId(expandedReservationId === res.id ? null : res.id)} className={`cursor-pointer transition-all ${expandedReservationId === res.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 flex items-center gap-2">
                                        {expandedReservationId === res.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                        {res.reservationNumber}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{res.hotel}</td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-[11px] leading-tight">
                                        <div className="font-bold text-gray-700">{res.checkIn}</div>
                                        <div className="text-gray-400">{res.checkOut}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black inline-block shadow-sm ${res.paymentStatusColor}`}>
                                            {res.paymentStatus}
                                        </div>
                                        {res.remainingAmount > 0 && (
                                            <div className="text-[10px] text-red-500 mt-1 font-bold italic">Due: BGN {res.remainingAmount.toFixed(2)}</div>
                                        )}
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
                                    <tr className="bg-gray-50/50 shadow-inner">
                                        <td colSpan="8" className="px-12 py-4">
                                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <CreditCard size={14}/> Payments for this reservation
                                                </h4>
                                                {financialTransactions.filter(ft => ft.associatedReservationId === res.reservationNumber).length > 0 ? (
                                                    <table className="w-full text-xs">
                                                        <thead className="text-gray-400 border-b text-left">
                                                            <tr>
                                                                <th className="py-2">Date</th>
                                                                <th className="py-2">Type</th>
                                                                <th className="py-2">Method</th>
                                                                <th className="py-2 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {financialTransactions.filter(ft => ft.associatedReservationId === res.reservationNumber).map(p => (
                                                                <tr key={p.id}>
                                                                    <td className="py-2">{p.date}</td>
                                                                    <td className="py-2">
                                                                        <span className={`px-2 py-0.5 rounded-md ${p.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.type}</span>
                                                                    </td>
                                                                    <td className="py-2 text-gray-500">{p.method}</td>
                                                                    <td className="py-2 text-right font-bold">BGN {Number(p.amount).toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <p className="text-xs text-gray-400 italic">No transactions found.</p>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Detail View */}
            {viewingReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white"><FileText size={24} /></div>
                                <div>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Detail View</span>
                                    <h3 className="text-3xl font-black text-gray-800">#{viewingReservation.reservationNumber}</h3>
                                </div>
                            </div>
                            <button onClick={() => setViewingReservation(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X /></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><Calendar size={14}/> Hotel & Stay</h4>
                                    <div className="bg-gray-50 p-5 rounded-[2rem]">
                                        <p className="text-lg font-black text-gray-800 leading-tight mb-1">{viewingReservation.hotel}</p>
                                        <p className="text-sm text-gray-500 font-medium mb-4">{viewingReservation.place}</p>
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <p><strong>Check-in:</strong> {viewingReservation.checkIn}</p>
                                            <p><strong>Check-out:</strong> {viewingReservation.checkOut}</p>
                                            <p className="text-indigo-600 font-black uppercase mt-2">{viewingReservation.totalNights} Nights • {viewingReservation.food}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><CreditCard size={14}/> Financials</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-3 bg-green-50 rounded-xl text-green-700 font-bold">
                                            <span className="text-xs">Final Amount:</span>
                                            <span className="text-sm">BGN {Number(viewingReservation.finalAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-red-50 rounded-xl text-red-700 font-bold">
                                            <span className="text-xs">Owed Hotel:</span>
                                            <span className="text-sm">BGN {Number(viewingReservation.owedToHotel).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-black">
                                            <span className="text-xs uppercase">Net Profit:</span>
                                            <span className="text-sm">BGN {Number(viewingReservation.profit).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><Users size={14}/> System Data</h4>
                                    <div className="text-sm space-y-2 p-1 font-medium">
                                        <p className="flex justify-between border-b pb-1"><span className="text-gray-400">Status:</span> <span>{viewingReservation.status}</span></p>
                                        <p className="flex justify-between border-b pb-1"><span className="text-gray-400">Operator:</span> <span>{viewingReservation.tourOperator}</span></p>
                                        <p className="flex justify-between border-b pb-1"><span className="text-gray-400">Type:</span> <span>{viewingReservation.tourType}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase">Tourists List ({viewingReservation.adults} Adults, {viewingReservation.children} Kids)</h4>
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Name</th>
                                                <th className="px-6 py-4 text-left">IDs</th>
                                                <th className="px-6 py-4 text-left">Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 font-medium">
                                            {viewingReservation.tourists?.map((t, i) => (
                                                <tr key={i}>
                                                    <td className="px-6 py-4 text-gray-800">{t.firstName} {t.familyName}</td>
                                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{t.id} <br/> <span className="opacity-40">{t.realId}</span></td>
                                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                                        <div>{t.email}</div>
                                                        <div className="text-indigo-600 font-bold">{t.phone}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setViewingReservation(null)} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-lg uppercase text-xs tracking-widest">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
