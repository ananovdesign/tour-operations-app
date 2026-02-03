import React, { useState, useEffect, useMemo } from 'react';
// ВНИМАНИЕ: Провери дали този път е верен спрямо разположението на файла
import { db, appId, auth } from '../../firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
  Search, Plus, Printer, MoreVertical, Calendar, User, 
  Loader2, Filter, X, ChevronDown, ChevronUp, Eye, Edit, Trash2, FileText
} from 'lucide-react';

const uiTranslations = {
  bg: {
    status: "Статус", hotel: "Хотел", tourType: "Тип тур", checkInAfter: "Настаняване след",
    checkOutBefore: "Напускане преди", searchLead: "Търси водещ клиент", reset: "Изчисти филтри",
    resNumber: "Номер", leadGuest: "Клиент", dates: "Дати", payment: "Плащане", 
    profit: "Печалба", actions: "Действия", noData: "Няма намерени резервации",
    due: "Дължимо", details: "Детайли", adults: "Възрастни", children: "Деца"
  },
  en: {
    status: "Status", hotel: "Hotel", tourType: "Tour Type", checkInAfter: "Check-in After",
    checkOutBefore: "Check-out Before", searchLead: "Search by Lead Guest", reset: "Reset Filters",
    resNumber: "Res Number", leadGuest: "Lead Guest", dates: "Dates", payment: "Payment Status",
    profit: "Profit", actions: "Actions", noData: "No reservations found",
    due: "Due", details: "Details", adults: "Adults", children: "Children"
  }
};

const Reservations = ({ lang = 'bg' }) => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [viewingRes, setViewingRes] = useState(null);

  // Твоите филтри
  const [filters, setFilters] = useState({
    status: 'All', hotel: '', tourType: 'All', 
    checkIn: '', checkOut: '', search: ''
  });

  const t = useMemo(() => uiTranslations[lang] || uiTranslations.bg, [lang]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    
    // Зареждане на резервации
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(resRef, (snap) => {
      setReservations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Зареждане на транзакции (за логиката с плащанията)
    const transRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const unsubTrans = onSnapshot(transRef, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRes(); unsubTrans(); };
  }, [userId]);

  const filteredData = useMemo(() => {
    return reservations.filter(res => {
      const guestName = res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}`.toLowerCase() : '';
      const matchesSearch = guestName.includes(filters.search.toLowerCase()) || res.reservationNumber?.includes(filters.search);
      const matchesStatus = filters.status === 'All' || res.status === filters.status;
      const matchesHotel = !filters.hotel || res.hotel?.toLowerCase().includes(filters.hotel.toLowerCase());
      const matchesTour = filters.tourType === 'All' || res.tourType === filters.tourType;
      const matchesIn = !filters.checkIn || res.checkIn >= filters.checkIn;
      const matchesOut = !filters.checkOut || res.checkOut <= filters.checkOut;

      return matchesSearch && matchesStatus && matchesHotel && matchesTour && matchesIn && matchesOut;
    });
  }, [reservations, filters]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* СЕКЦИЯ ФИЛТРИ (Твоята логика в нов дизайн) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.status}</label>
          <select 
            value={filters.status} 
            onChange={e => setFilters({...filters, status: e.target.value})}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.hotel}</label>
          <input 
            type="text" 
            placeholder="Hotel name..."
            value={filters.hotel}
            onChange={e => setFilters({...filters, hotel: e.target.value})}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.checkInAfter}</label>
          <input 
            type="date" 
            value={filters.checkIn}
            onChange={e => setFilters({...filters, checkIn: e.target.value})}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none"
          />
        </div>
        <div className="lg:col-span-2 space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{t.searchLead}</label>
          <input 
            type="text" 
            placeholder="Search name..."
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end pb-1">
          <button 
            onClick={() => setFilters({status:'All', hotel:'', tourType:'All', checkIn:'', checkOut:'', search:''})}
            className="w-full p-3 text-xs font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            {t.reset}
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.resNumber}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.leadGuest}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dates}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.payment}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.profit}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredData.map(res => {
                const linkedTrans = transactions.filter(ft => ft.associatedReservationId === res.reservationNumber);
                const isExpanded = expandedId === res.id;

                return (
                  <React.Fragment key={res.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : res.id)}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{res.reservationNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold dark:text-white">
                          {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">{res.hotel}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium dark:text-slate-300">
                        {res.checkIn} — {res.checkOut}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${res.paymentStatusColor || 'bg-slate-100 text-slate-600'}`}>
                          {res.paymentStatus}
                        </span>
                        {res.remainingAmount > 0 && (
                          <div className="text-[10px] mt-1 text-rose-500 font-bold italic">{t.due}: BGN {res.remainingAmount.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-500">
                        BGN {(Number(res.profit) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setViewingRes(res)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"><Eye size={16}/></button>
                            <button className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"><Edit size={16}/></button>
                            <button className="p-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 rounded-lg transition-colors"><Printer size={16}/></button>
                         </div>
                      </td>
                    </tr>
                    
                    {/* Твоят разширяващ се ред с транзакции */}
                    {isExpanded && (
                      <tr className="bg-slate-50/30 dark:bg-slate-800/30">
                        <td colSpan="6" className="px-10 py-4">
                          <div className="border-l-2 border-blue-500 pl-6 space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Transactions</h4>
                            {linkedTrans.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {linkedTrans.map(p => (
                                  <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <span className="font-medium">{p.date} • <span className="uppercase text-blue-500">{p.method}</span></span>
                                    <span className={`font-black ${p.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {p.type === 'income' ? '+' : '-'} BGN {p.amount.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-400">No linked payments.</p>
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
    </div>
  );
};

export default Reservations;
