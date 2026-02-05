import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Search, Plus, Eye, Edit3, Trash2, FileText, Loader2, 
  ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, 
  Calendar, Building2, Printer, Ticket, ArrowLeft 
} from 'lucide-react';

import AddReservation from './AddReservation';
// ПОПРАВКА: Добавихме още едно "../", за да излезем в главната src папка
import VoucherPrint from '../../VoucherPrint';
import CustomerContractPrint from '../../CustomerContractPrint';

const Reservations = ({ lang = 'bg' }) => {
  // view може да бъде: 'list', 'add', 'edit', 'voucher', 'contract'
  const [view, setView] = useState('list');
  const [selectedRes, setSelectedRes] = useState(null); // Данни за избраната резервация (за редакция или печат)

  const translations = {
    bg: {
      loading: "Зареждане на резервации...",
      searchPlaceholder: "Търси гост или #dyt...",
      hotelPlaceholder: "Филтрирай по хотел...",
      checkInAfter: "Настаняване след:",
      allStatus: "Всички статуси",
      newRes: "Нова резервация",
      thNumber: "Номер",
      thHotel: "Хотел",
      thGuest: "Турист",
      thDates: "Дати",
      thStatus: "Статус",
      thPayment: "Плащане",
      thProfit: "Печалба",
      thActions: "Действия",
      financialRecords: "Финансови записи:",
      noPayments: "Няма открити плащания.",
      due: "Дължими:",
      confirmDelete: "Сигурни ли сте, че искате да изтриете тази резервация? Това действие е необратимо.",
      backToList: "Обратно към списъка"
    },
    en: {
      loading: "Loading reservations...",
      searchPlaceholder: "Search guest or #dyt...",
      hotelPlaceholder: "Filter by hotel...",
      checkInAfter: "Check-in after:",
      allStatus: "All Status",
      newRes: "New Reservation",
      thNumber: "Res. Number",
      thHotel: "Hotel",
      thGuest: "Lead Guest",
      thDates: "Dates",
      thStatus: "Status",
      thPayment: "Payment",
      thProfit: "Profit",
      thActions: "Actions",
      financialRecords: "Financial Records:",
      noPayments: "No linked payments found.",
      due: "Due:",
      confirmDelete: "Are you sure you want to delete this reservation? This action cannot be undone.",
      backToList: "Back to List"
    }
  };

  const t = translations[lang] || translations.bg;

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tours, setTours] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const userId = auth.currentUser?.uid;

  // --- I. ИЗВЛИЧАНЕ НА ДАННИ ОТ FIREBASE ---
  useEffect(() => {
    if (!userId) return;

    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const transRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    const custRef = collection(db, `artifacts/${appId}/users/${userId}/customers`);

    const unsubTours = onSnapshot(toursRef, (snap) => setTours(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubCust = onSnapshot(custRef, (snap) => setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const unsubTrans = onSnapshot(transRef, (transSnapshot) => {
      const allTrans = transSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(allTrans);

      const unsubRes = onSnapshot(resRef, (resSnapshot) => {
        const rawData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const dataWithPayments = rawData.map(res => {
          const paymentsForRes = allTrans.filter(ft =>
            ft.type === 'income' && ft.associatedReservationId === res.reservationNumber
          );
          
          const totalPaid = paymentsForRes.reduce((sum, ft) => sum + (ft.amount || 0), 0);
          const finalAmt = res.finalAmount || 0;
          const remainingAmount = finalAmt - totalPaid;

          let paymentStatus = "Unpaid";
          let paymentStatusColor = 'bg-rose-100 text-rose-800';
          
          if (finalAmt <= 0 && totalPaid === 0) {
             // Handle 0 price logic if needed
          } else if (remainingAmount <= 0.01) { // tolerance for float errors
            paymentStatus = "Paid";
            paymentStatusColor = 'bg-emerald-100 text-emerald-800';
          } else if (totalPaid > 0) {
            paymentStatus = "Partial";
            paymentStatusColor = 'bg-amber-100 text-amber-800';
          }

          return {
            ...res,
            totalPaid,
            remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
            paymentStatus,
            paymentStatusColor,
          };
        });

        const sortedData = dataWithPayments.sort((b, a) => {
          // Sort by reservation number logic
          const getNum = (str) => parseInt(str?.toString().replace(/\D/g, '')) || 0;
          return getNum(a.reservationNumber) - getNum(b.reservationNumber);
        });

        setReservations(sortedData);
        setLoading(false);
      });
      return () => unsubRes();
    });

    return () => {
      unsubTrans();
      unsubTours();
      unsubCust();
    };
  }, [userId]);

  // --- II. ФИЛТРИРАНЕ ---
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const leadGuest = res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : "";
      const resNum = (res.reservationNumber || "").toString().toLowerCase();
      const hotelName = (res.hotel || "").toLowerCase();
      
      const matchesSearch = leadGuest.toLowerCase().includes(searchTerm.toLowerCase()) || resNum.includes(searchTerm.toLowerCase());
      const matchesHotel = hotelName.includes(hotelSearch.toLowerCase());
      const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
      const matchesDate = !dateFilter || (res.checkIn >= dateFilter);

      return matchesSearch && matchesHotel && matchesStatus && matchesDate;
    });
  }, [reservations, searchTerm, hotelSearch, dateFilter, statusFilter]);

  // --- III. ACTIONS (Действия) ---

  // 1. ЗАПИСВАНЕ (НОВА или РЕДАКЦИЯ)
  const handleSubmitReservation = async (reservationData) => {
    try {
        const finalData = {
            ...reservationData,
            userId: userId,
            updatedAt: new Date().toISOString()
        };

        if (view === 'edit' && selectedRes?.id) {
            // UPDATE съществуваща
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/reservations`, selectedRes.id);
            await updateDoc(docRef, finalData);
            alert("Резервацията е обновена успешно!");
        } else {
            // CREATE нова
            // Генерираме номер само ако е нова
            finalData.createdAt = new Date().toISOString();
            finalData.reservationNumber = reservationData.reservationNumber || `DYT${Math.floor(Date.now() / 1000)}`;
            
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/reservations`), finalData);
            alert("Резервацията е създадена успешно!");
        }
        
        setView('list');
        setSelectedRes(null);

    } catch (error) {
        console.error("Error saving reservation:", error);
        alert("Грешка при запис: " + error.message);
    }
  };

  // 2. ИЗТРИВАНЕ
  const handleDelete = async (e, resId) => {
    e.stopPropagation(); // Спираме отварянето на реда
    if (window.confirm(t.confirmDelete)) {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, resId));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Неуспешно изтриване.");
        }
    }
  };

  // 3. РЕДАКЦИЯ
  const handleEdit = (e, res) => {
    e.stopPropagation();
    setSelectedRes(res);
    setView('edit');
  };

  // 4. ПЕЧАТ (Ваучер или Договор)
  const handlePrint = (e, res, type) => {
    e.stopPropagation();
    setSelectedRes(res);
    setView(type); // 'voucher' or 'contract'
  };

  // --- IV. RENDER VIEWS ---

  // VIEW: ВАУЧЕР
  if (view === 'voucher' && selectedRes) {
      return (
          <div className="bg-white min-h-screen relative">
              <div className="p-4 bg-slate-100 flex justify-between items-center no-print border-b">
                  <button onClick={() => setView('list')} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600">
                      <ArrowLeft size={20} /> {t.backToList}
                  </button>
                  <h2 className="text-xl font-black uppercase text-slate-400">Преглед на Ваучер</h2>
                  <div className="w-20"></div> {/* Spacer for center alignment */}
              </div>
              <VoucherPrint reservation={selectedRes} />
          </div>
      );
  }

  // VIEW: ДОГОВОР
  if (view === 'contract' && selectedRes) {
      return (
          <div className="bg-white min-h-screen relative">
              <div className="p-4 bg-slate-100 flex justify-between items-center no-print border-b">
                  <button onClick={() => setView('list')} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600">
                      <ArrowLeft size={20} /> {t.backToList}
                  </button>
                  <h2 className="text-xl font-black uppercase text-slate-400">Преглед на Договор</h2>
                  <div className="w-20"></div>
              </div>
              <CustomerContractPrint reservationData={selectedRes} />
          </div>
      );
  }

  // VIEW: ДОБАВЯНЕ / РЕДАКЦИЯ
  if (view === 'add' || view === 'edit') {
    return (
      <AddReservation 
        lang={lang} 
        onBack={() => { setView('list'); setSelectedRes(null); }} 
        tours={tours} 
        customers={customers} 
        reservations={reservations} 
        handleSubmitReservation={handleSubmitReservation}
        initialData={view === 'edit' ? selectedRes : null} // ПОДАВАМЕ ДАННИТЕ ЗА РЕДАКЦИЯ
      />
    );
  }

  // LOADING STATE
  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">{t.loading}</p>
    </div>
  );

  // VIEW: СПИСЪК (DEFAULT)
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* FILTERS SECTION */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="flex-1 md:w-40 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-bold text-sm outline-none dark:text-white cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">{t.allStatus}</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            
            <button 
              onClick={() => { setSelectedRes(null); setView('add'); }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap"
            >
              <Plus size={16} /> {t.newRes}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={t.hotelPlaceholder}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm"
              value={hotelSearch}
              onChange={(e) => setHotelSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <div className="absolute left-12 top-2 text-[9px] font-black uppercase text-slate-400">{t.checkInAfter}</div>
            <input 
              type="date"
              className="w-full pl-12 pr-4 pt-5 pb-1 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.thNumber}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.thHotel}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.thGuest}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.thDates}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.thStatus}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.thPayment}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.thProfit}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredReservations.map((res) => {
                const isExpanded = expandedId === res.id;
                const linkedPayments = transactions.filter(t => t.associatedReservationId === res.reservationNumber);

                return (
                  <React.Fragment key={res.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : res.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-5 font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {res.reservationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold truncate max-w-[140px]">{res.hotel}</td>
                      <td className="px-6 py-5 font-bold text-sm">
                        {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-5 text-[10px] font-bold text-slate-500 italic leading-tight">
                        {res.checkIn} <br/> {res.checkOut}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          res.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                          res.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg w-fit ${res.paymentStatusColor}`}>
                            {res.paymentStatus}
                          </span>
                          {res.remainingAmount > 0 && (
                            <span className="text-[10px] font-bold text-rose-500 mt-1">
                              {t.due} {res.remainingAmount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-sm text-right">
                        {res.profit?.toFixed(2)} <span className="text-[9px] text-slate-400">BGN</span>
                      </td>
                      
                      {/* ACTIONS BUTTONS */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* PRINT VOUCHER */}
                            <button 
                                onClick={(e) => handlePrint(e, res, 'voucher')}
                                title="Ваучер"
                                className="p-2 hover:bg-purple-50 text-purple-500 rounded-xl"
                            >
                                <Ticket size={16} />
                            </button>

                            {/* PRINT CONTRACT */}
                            <button 
                                onClick={(e) => handlePrint(e, res, 'contract')}
                                title="Договор"
                                className="p-2 hover:bg-indigo-50 text-indigo-500 rounded-xl"
                            >
                                <FileText size={16} />
                            </button>

                            {/* EDIT */}
                            <button 
                                onClick={(e) => handleEdit(e, res)} 
                                title="Редакция"
                                className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl"
                            >
                                <Edit3 size={16} />
                            </button>

                            {/* DELETE */}
                            <button 
                                onClick={(e) => handleDelete(e, res.id)} 
                                title="Изтриване"
                                className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-l-4 border-blue-500">
                        <td colSpan="8" className="px-12 py-4 animate-in slide-in-from-top-1 duration-200">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.financialRecords}</p>
                            {linkedPayments.length > 0 ? (
                              linkedPayments.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] shadow-sm">
                                  <div className="flex items-center gap-3 font-bold">
                                    {p.type === 'income' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-rose-500" />}
                                    <span className="uppercase">{p.method}</span>
                                    <span className="text-slate-400 font-normal italic">{p.date}</span>
                                  </div>
                                  <span className={`font-black ${p.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {p.type === 'income' ? '+' : '-'} {p.amount?.toFixed(2)} BGN
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] italic text-slate-400 uppercase font-bold px-2">{t.noPayments}</p>
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
