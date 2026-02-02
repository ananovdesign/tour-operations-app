import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Printer, PlusCircle, Search, FileText, X, UserPlus, Filter, Eye, ChevronDown, ChevronUp, Calendar, CreditCard, Users } from 'lucide-react';

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

    // --- ФИЛТРИРАНЕ И СОРТИРАНЕ ---
    const filteredAndSortedReservations = useMemo(() => {
        if (!reservations) return [];
        
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
            .sort((a, b) => {
                // Сортиране по номер на резервация (низходящо - най-новите отгоре)
                const numA = parseInt(a.reservationNumber?.toString().replace(/\D/g, '')) || 0;
                const numB = parseInt(b.reservationNumber?.toString().replace(/\D/g, '')) || 0;
                return numB - numA;
            });
    }, [reservations, filterReservationStatus, filterReservationHotel, filterReservationTourType, filterReservationCheckInDate, filterReservationCheckOutDate, searchReservationTerm]);

    return (
        <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Hotel Reservations</h2>
                <button 
                    onClick={() => setActiveTab('addReservation')} 
                    className="bg-[#28A745] hover:bg-[#218838] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <PlusCircle size={18} /> New Reservation
                </button>
            </div>

            {/* Filter Panel */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Status</label>
                    <select name="filterReservationStatus" value={filterReservationStatus} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]">
                        <option value="All">All Statuses</option>
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
                        <option value="All">All Types</option>
                        <option value="PARTNER">PARTNER</option>
                        <option value="HOTEL ONLY">HOTEL ONLY</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-in After</label>
                    <input type="date" name="filterReservationCheckInDate" value={filterReservationCheckInDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Check-out Before</label>
                    <input type="date" name="filterReservationCheckOutDate" value={filterReservationCheckOutDate} onChange={handleReservationFilterChange} className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none" />
                </div>
                <div className="xl:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lead Guest Search</label>
                    <input type="text" value={searchReservationTerm} onChange={e => setSearchReservationTerm(e.target.value)} placeholder="Search name..." className="w-full mt-1 p-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#28A745]" />
                </div>
                <div className="flex items-end">
                    <button onClick={resetReservationFilters} className="w-full p-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all uppercase">Reset</button>
                </div>
            </div>

            {/* Reservations Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">№ Number</th>
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">Lead Guest</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Payment Status</th>
                                <th className="px-6 py-4 text-right">Profit</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAndSortedReservations.map(res => {
                                const linkedPayments = financialTransactions.filter(ft => ft.associatedReservationId === res.reservationNumber);
                                const isExpanded = expandedReservationId === res.id;
                                const guest = res.tourists && res.tourists.length > 0 ? res.tourists[0] : null;
                                
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
                                            <td className="px-6 py-4 text-gray-600 font-medium">
                                                {guest ? `${guest.firstName} ${guest.familyName}` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-[11px] leading-tight">
                                                <div className="font-bold text-gray-700">{res.checkIn}</div>
                                                <div className="text-gray-400">{res.checkOut}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                    res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                                                    res.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{res.status}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block ${res.paymentStatusColor || 'bg-gray-100 text-gray-500'}`}>
                                                    {res.paymentStatus || 'No Status'}
                                                </div>
                                                {res.remainingAmount > 0 && (
                                                    <div className="text-[10px] text-red-500 mt-1 font-bold">Due: BGN {res.remainingAmount.toFixed(2)}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 text-right">
                                                BGN {Number(res.profit || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setViewingReservation(res)} className="p-2 text-blue-500 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100" title="View Details"><Eye size={16} /></button>
                                                    <button onClick={() => handleEditReservation(res)} className="p-2 text-[#28A745] hover:bg-white rounded-full transition-all shadow-sm border border-gray-100" title="Edit"><Edit2 size={16} /></button>
                                                    <button onClick={() => { setReservationToPrintVoucher(res); setActiveTab('printVoucher'); }} className="p-2 text-yellow-600 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100" title="Print Voucher"><Printer size={16} /></button>
                                                    <button onClick={() => { setReservationToGenerateContract(res); setActiveTab('customerContract'); }} className="p-2 text-purple-600 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100" title="Print Contract"><FileText size={16} /></button>
                                                    <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-red-500 hover:bg-white rounded-full transition-all shadow-sm border border-gray-100" title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Financial Transactions Sub-Table */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan="8" className="px-12 py-4">
                                                    <div className="bg-white rounded-2xl p-4 shadow-inner border border-gray-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                <CreditCard size={14}/> Financial Transactions History
                                                            </h4>
                                                        </div>
                                                        {linkedPayments.length > 0 ? (
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-gray-400 border-b text-left">
                                                                        <th className="py-2">Date</th>
                                                                        <th className="py-2">Type</th>
                                                                        <th className="py-2">Method</th>
                                                                        <th className="py-2 text-right">Amount</th>
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
                                                                            <td className="py-2 text-right font-bold text-gray-700">BGN {Number(p.amount).toFixed(2)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">No payments found for this reservation.</p>
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

            {/* --- DETAILED PREVIEW MODAL --- */}
            {viewingReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Reservation Details</span>
                                    <h3 className="text-3xl font-black text-gray-800">#{viewingReservation.reservationNumber}</h3>
                                </div>
                            </div>
                            <button onClick={() => setViewingReservation(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X /></button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Grid Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><Calendar size={14}/> Dates & Hotel</h4>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <p className="text-lg font-black text-gray-800">{viewingReservation.hotel}</p>
                                        <p className="text-sm text-gray-500 font-medium mb-2">{viewingReservation.place}</p>
                                        <div className="text-xs space-y-1 text-gray-600">
                                            <p><strong>Check-in:</strong> {viewingReservation.checkIn}</p>
                                            <p><strong>Check-out:</strong> {viewingReservation.checkOut}</p>
                                            <p className="text-indigo-600 font-bold uppercase mt-2">{viewingReservation.totalNights} Nights • {viewingReservation.food}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><CreditCard size={14}/> Financial Overview</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                                            <span className="text-xs font-bold text-green-700">Final Amount:</span>
                                            <span className="text-sm font-black text-green-700">BGN {viewingReservation.finalAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                                            <span className="text-xs font-bold text-red-700">Owed to Hotel:</span>
                                            <span className="text-sm font-black text-red-700">BGN {viewingReservation.owedToHotel?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <span className="text-xs font-bold text-indigo-700">Profit:</span>
                                            <span className="text-sm font-black text-indigo-700">BGN {viewingReservation.profit?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-2"><Users size={14}/> Other Info</h4>
                                    <div className="text-sm space-y-2">
                                        <p><span className="text-gray-400">Status:</span> <span className="font-bold">{viewingReservation.status}</span></p>
                                        <p><span className="text-gray-400">Operator:</span> <span className="font-bold">{viewingReservation.tourOperator}</span></p>
                                        <p><span className="text-gray-400">Tour ID:</span> <span className="font-bold">{viewingReservation.linkedTourId || 'N/A'}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Tourists Table */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase">Tourists ({viewingReservation.adults} Adults, {viewingReservation.children} Children)</h4>
                                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Full Name</th>
                                                <th className="px-6 py-4 text-left">ID / Real ID</th>
                                                <th className="px-6 py-4 text-left">Contact Information</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {viewingReservation.tourists?.map((t, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 font-bold text-gray-800">{t.firstName} {t.familyName}</td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        <div className="font-mono">{t.id}</div>
                                                        <div className="text-[10px] opacity-60">{t.realId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        <div className="text-[11px]">{t.email}</div>
                                                        <div className="text-[11px] font-bold">{t.phone}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-8 bg-gray-50 border-t flex justify-end gap-3">
                            <button 
                                onClick={() => { handleEditReservation(viewingReservation); setViewingReservation(null); }}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-md"
                            >
                                Edit Reservation
                            </button>
                            <button 
                                onClick={() => setViewingReservation(null)} 
                                className="px-8 py-3 bg-white text-gray-500 border border-gray-200 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
