import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore'; // Добавих query и addDoc
import { 
  Search, Plus, Eye, Edit3, FileText, Loader2, User, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, Calendar, Building2
} from 'lucide-react';
import AddReservation from './AddReservation';

const Reservations = ({ lang = 'bg' }) => {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  
  // Данни от Firebase
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tours, setTours] = useState([]);       // НОВО: За списъка с турове
  const [customers, setCustomers] = useState([]); // НОВО: За списъка с клиенти

  // Филтри
  const [searchTerm, setSearchTerm] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const userId = auth.currentUser?.uid;

  // Речник с преводи
  const translations = {
    bg: {
      loading: "Подреждане на резервации...",
      searchPlaceholder: "Търси гост или #dyt...",
      hotelPlaceholder: "Филтрирай по хотел...",
      checkInAfter: "Настаняване след:",
      allStatus: "Всички статуси",
      pending: "Изчакваща",
      confirmed: "Потвърдена",
      cancelled: "Анулирана",
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
      unpaid: "Неплатена",
      paid: "Платена",
      partiallyPaid: "Частично платена",
      due: "Дължими:"
    },
    en: {
      loading: "Sorting reservations...",
      searchPlaceholder: "Search guest or #dyt...",
      hotelPlaceholder: "Filter by hotel...",
      checkInAfter: "Check-in after:",
      allStatus: "All Status",
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
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
      unpaid: "Unpaid",
      paid: "Paid",
      partiallyPaid: "Partially Paid",
      due: "Due:"
    }
  };

  const t = translations[lang] || translations.bg;

  // ЕФЕКТ: СЛУШАЛКИ ЗА ДАННИ (Real-time)
  useEffect(() => {
    if (!userId) return;

    // Пътища до колекциите
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const transRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    const custRef = collection(db, `artifacts/${appId}/users/${userId}/customers`);

    // 1. Слушалка за турове
    const unsubTours = onSnapshot(toursRef, (snap) => {
      setTours(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Слушалка за клиенти
    const unsubCust = onSnapshot(custRef, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Слушалка за транзакции и резервации (твоята логика)
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

          let paymentStatus = t.unpaid;
          let paymentStatusColor = 'bg-rose-100 text-rose-800';
          
          if (finalAmt <= 0) {
            paymentStatus = t.paid;
            paymentStatusColor = 'bg-emerald-100 text-emerald-800';
          } else if (totalPaid >= finalAmt) {
            paymentStatus = t.paid;
            paymentStatusColor = 'bg-emerald-100 text-emerald-800';
          } else if (totalPaid > 0) {
            paymentStatus = t.partiallyPaid;
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
          const getNum = (str) => parseInt(str?.toString().replace(/\D/g, '')) || 0;
          return getNum(a.reservationNumber) - getNum(b.reservationNumber);
        });

        setReservations(sortedData);
        setLoading(false);
      });
      return () => unsubRes();
    });

    return () => {
      unsubTours();
      unsubCust();
      unsubTrans();
    };
  }, [userId, t]);

  // Функция за запис на нова резервация
  const handleSubmitReservation = async (data) => {
    try {
      const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
      await addDoc(resRef, {
        ...data,
        createdAt: new Date().toISOString()
      });
      setView('list'); // Връщане към списъка след успех
    } catch (error) {
      console.error("Error saving reservation:", error);
      alert("Грешка при запис!");
    }
  };

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

  // АКО ИЗБЕРЕМ ДОБАВЯНЕ: Подаваме всички масиви като пропове!
  if (view === 'add') {
    return (
      <AddReservation 
        lang={lang} 
        onBack={() => setView('list')} 
        tours={tours} 
        customers={customers} 
        reservations={reservations}
        handleSubmitReservation={handleSubmitReservation}
      />
    );
  }

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Тук следва твоят JSX за таблицата и филтрите (остава непроменен) */}
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
              <option value="Pending">{t.pending}</option>
              <option value="Confirmed">{t.confirmed}</option>
              <option value="Cancelled">{t.cancelled}</option>
            </select>
            
            <button 
              onClick={() => setView('add')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap"
            >
              <Plus size={16} /> {t.newRes}
            </button>
          </div>
        </div>
        {/* ... останалите филтри ... */}
      </div>

      {/* TABLE SECTION (Твоят код за таблицата) */}
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
                const linkedPayments = transactions.filter(tr => tr.associatedReservationId === res.reservationNumber);

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
                          {t[res.status?.toLowerCase()] || res.status}
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
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl"><Eye size={14} /></button>
                          <button className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl"><Edit3 size={14} /></button>
                          <button className="p-2 hover:bg-purple-50 text-purple-500 rounded-xl"><FileText size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    {/* ... expanded row logic ... */}
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
