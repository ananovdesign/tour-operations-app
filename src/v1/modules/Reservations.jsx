import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase'; 
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Search, Plus, Eye, Edit3, Trash2, FileText, Loader2, 
  ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, 
  Calendar, Building2, Ticket, ArrowLeft, X, User, MapPin, CreditCard, Info
} from 'lucide-react';

import AddReservation from './AddReservation';
import VoucherPrint from '../../VoucherPrint';
import CustomerContractPrint from '../../CustomerContractPrint';

// ОФИЦИАЛЕН ФИКСИРАН КУРС
const FIXED_EXCHANGE_RATE = 1.95583;

// --- Helper за конвертиране към Евро ---
const toEuro = (amount, currency) => {
    const val = Number(amount) || 0;
    if (currency === 'EUR') return val;
    return val / FIXED_EXCHANGE_RATE;
};

// --- Helper за форматиране на валута ---
const formatMoney = (val) => {
    return `€${Number(val || 0).toFixed(2)}`;
};

// --- КОМПОНЕНТ ЗА POP-UP ПРЕГЛЕД ---
const ReservationPreviewModal = ({ reservation, onClose, t }) => {
  if (!reservation) return null;

  const leadGuest = reservation.tourists?.[0] || {};

  // Изчисляваме всичко в Евро за прегледа
  const finalEuro = toEuro(reservation.finalAmount, reservation.currency);
  const paidEuro = toEuro(reservation.totalPaid, 'EUR'); // totalPaid е вече сумиран в Евро
  const remainingEuro = finalEuro - paidEuro;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
              {reservation.reservationNumber}
            </h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                reservation.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                reservation.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                'bg-rose-100 text-rose-700'
            }`}>
              {reservation.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                <Building2 size={14} /> Хотел / Hotel
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight">{reservation.hotel}</p>
              <p className="text-sm text-slate-500">{reservation.place}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                <Calendar size={14} /> Дати / Dates
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Настаняване</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{reservation.checkIn}</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Напускане</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{reservation.checkOut}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-blue-500 mt-1">{reservation.nights} нощувки</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border border-slate-100 dark:border-slate-800">
              <div><p className="text-[10px] text-slate-400 font-black uppercase">Туроператор</p><p className="font-bold text-sm dark:text-white">{reservation.tourOperator || '-'}</p></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase">Стая</p><p className="font-bold text-sm dark:text-white">{reservation.roomType || 'Std'}</p></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase">Храна</p><p className="font-bold text-sm dark:text-white">{reservation.food || 'BB'}</p></div>
              <div><p className="text-[10px] text-slate-400 font-black uppercase">Гости</p><p className="font-bold text-sm dark:text-white">{reservation.adults} Adl / {reservation.children} Chd</p></div>
          </div>

          <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
                 <User size={14} /> Водещ Турист
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-400">Име</p><p className="font-bold dark:text-white">{leadGuest.firstName} {leadGuest.familyName}</p>
                 </div>
                 <div className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-400">Телефон</p><p className="font-bold dark:text-white">{leadGuest.phone || '-'}</p>
                 </div>
                 <div className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-400">Имейл</p><p className="font-bold dark:text-white break-all">{leadGuest.email || '-'}</p>
                 </div>
              </div>
          </div>

          <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
                 <CreditCard size={14} /> Финанси (EUR)
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-blue-400">Цена</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatMoney(finalEuro)}</p>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-400">Платено</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(paidEuro)}</p>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase text-rose-400">Остатък</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{formatMoney(Math.max(0, remainingEuro))}</p>
                 </div>
              </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold uppercase text-xs">Затвори</button>
        </div>
      </div>
    </div>
  );
};


const Reservations = ({ lang = 'bg' }) => {
  const [view, setView] = useState('list');
  const [selectedRes, setSelectedRes] = useState(null); 

  const translations = {
    bg: {
      loading: "Зареждане...",
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
      thProfit: "Печалба (€)",
      thActions: "Действия",
      financialRecords: "Финансови записи:",
      noPayments: "Няма открити плащания.",
      due: "Дължими:",
      confirmDelete: "Сигурни ли сте? Действието е необратимо.",
      backToList: "Обратно към списъка"
    },
    en: {
      loading: "Loading...",
      searchPlaceholder: "Search guest...",
      hotelPlaceholder: "Filter hotel...",
      checkInAfter: "Check-in after:",
      allStatus: "All Status",
      newRes: "New Reservation",
      thNumber: "Res. #",
      thHotel: "Hotel",
      thGuest: "Guest",
      thDates: "Dates",
      thStatus: "Status",
      thPayment: "Payment",
      thProfit: "Profit (€)",
      thActions: "Actions",
      financialRecords: "Financial Records:",
      noPayments: "No payments found.",
      due: "Due:",
      confirmDelete: "Are you sure? This cannot be undone.",
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

  // --- I. ИЗВЛИЧАНЕ НА ДАННИ (С EURO CONVERSION) ---
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
          // 1. Намираме всички плащания към тази резервация
          const paymentsForRes = allTrans.filter(ft =>
            ft.type === 'income' && ft.associatedReservationId === res.reservationNumber
          );
          
          // 2. Сумираме плащанията, като ги превръщаме в Евро
          const totalPaidEuro = paymentsForRes.reduce((sum, ft) => sum + toEuro(ft.amount, ft.currency), 0);
          
          // 3. Взимаме цената на резервацията и я правим в Евро
          const finalAmtEuro = toEuro(res.finalAmount, res.currency);
          
          // 4. Изчисляваме остатък и печалба в Евро
          const owedToHotelEuro = toEuro(res.owedToHotel, res.currency);
          const transportCostEuro = toEuro(res.approxTransportCost, res.currency);
          
          const remainingEuro = finalAmtEuro - totalPaidEuro;
          const profitEuro = finalAmtEuro - owedToHotelEuro - transportCostEuro;

          let paymentStatus = "Unpaid";
          let paymentStatusColor = 'bg-rose-100 text-rose-800';
          
          if (finalAmtEuro <= 0 && totalPaidEuro === 0) {
              // 0 price case
          } else if (remainingEuro <= 0.05) { // Толеранс за закръгляне 
            paymentStatus = "Paid";
            paymentStatusColor = 'bg-emerald-100 text-emerald-800';
          } else if (totalPaidEuro > 0) {
            paymentStatus = "Partial";
            paymentStatusColor = 'bg-amber-100 text-amber-800';
          }

          return {
            ...res,
            finalAmountEuro: finalAmtEuro,
            profitEuro: profitEuro,
            totalPaidEuro: totalPaidEuro,
            remainingEuro: remainingEuro < 0 ? 0 : remainingEuro,
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

  // --- III. ACTIONS ---

  const handleSubmitReservation = async (reservationData) => {
    try {
        const finalData = {
            ...reservationData,
            // ВИНАГИ ЗАПИСВАМЕ В ЕВРО ОТ СЕГА НАТАТЪК
            currency: 'EUR',
            finalAmount: Number(reservationData.finalAmount) || 0,
            owedToHotel: Number(reservationData.owedToHotel) || 0,
            approxTransportCost: Number(reservationData.approxTransportCost) || 0,
            depositAmount: Number(reservationData.depositAmount) || 0,
            userId: userId,
            updatedAt: new Date().toISOString()
        };

        if (view === 'edit' && selectedRes?.id) {
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/reservations`, selectedRes.id);
            await updateDoc(docRef, finalData);
            alert("Успешна редакция!");
        } else {
            finalData.createdAt = new Date().toISOString();
            if (!finalData.reservationNumber || finalData.reservationNumber.includes('...')) {
                finalData.reservationNumber = `DYT${Math.floor(Date.now() / 1000)}`;
            }
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/reservations`), finalData);
            alert("Резервацията е създадена!");
        }
        
        setView('list');
        setSelectedRes(null);

    } catch (error) {
        console.error("Error saving reservation:", error);
        alert("Грешка: " + error.message);
    }
  };

  const handleDelete = async (e, resId) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reservations`, resId));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Неуспешно изтриване.");
        }
    }
  };

  const handleEdit = (e, res) => {
    e.stopPropagation();
    // Ако е стар запис (BGN), може да се наложи да го конвертираме, за да се покаже във формата като Евро
    // Или AddReservation формата да поеме логиката. Засега подаваме raw данните.
    const editData = { ...res };
    if (editData.currency !== 'EUR') {
        editData.finalAmount = toEuro(editData.finalAmount).toFixed(2);
        editData.owedToHotel = toEuro(editData.owedToHotel).toFixed(2);
        editData.approxTransportCost = toEuro(editData.approxTransportCost).toFixed(2);
        editData.depositAmount = toEuro(editData.depositAmount).toFixed(2);
    }
    
    setSelectedRes(editData);
    setView('edit');
  };

// Намери този ред в Reservations.jsx
const handlePrint = (e, res, type) => {
    e.stopPropagation();
    setSelectedRes(res); // Първо се уверяваме, че данните са в стейта
    setTimeout(() => {
        setView(type);   // След кратко забавяне сменяме изгледа
    }, 100);
};

  const handlePreview = (e, res) => {
    e.stopPropagation();
    setSelectedRes(res);
    setView('preview');
  };

  // --- IV. RENDER VIEWS ---

  if (view === 'voucher' && selectedRes) {
      return (
          <div className="bg-white min-h-screen relative">
              <div className="p-4 bg-slate-100 flex justify-between items-center no-print border-b">
                  <button onClick={() => setView('list')} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600">
                      <ArrowLeft size={20} /> {t.backToList}
                  </button>
                  <h2 className="text-xl font-black uppercase text-slate-400">Преглед на Ваучер</h2>
                  <div className="w-20"></div>
              </div>
              <VoucherPrint 
                  reservationData={selectedRes} 
                  onPrintFinish={() => setView('list')} 
              />
          </div>
      );
  }

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
              <CustomerContractPrint 
                  reservationData={selectedRes} 
                  onPrintFinish={() => setView('list')}
              />
          </div>
      );
  }

  if (view === 'add' || view === 'edit') {
    return (
      <AddReservation 
        lang={lang} 
        onBack={() => { setView('list'); setSelectedRes(null); }} 
        tours={tours} 
        customers={customers} 
        reservations={reservations} 
        handleSubmitReservation={handleSubmitReservation}
        initialData={view === 'edit' ? selectedRes : null} 
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
    <div className="space-y-6 animate-in fade-in duration-500 font-sans relative">
      
      {/* POP-UP MODAL */}
      {view === 'preview' && selectedRes && (
        <ReservationPreviewModal reservation={selectedRes} onClose={() => { setView('list'); setSelectedRes(null); }} t={t} />
      )}

      {/* FILTERS */}
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
            
            <button onClick={() => { setSelectedRes(null); setView('add'); }} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap">
              <Plus size={16} /> {t.newRes}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={t.hotelPlaceholder} className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm" value={hotelSearch} onChange={(e) => setHotelSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <div className="absolute left-12 top-2 text-[9px] font-black uppercase text-slate-400">{t.checkInAfter}</div>
            <input type="date" className="w-full pl-12 pr-4 pt-5 pb-1 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
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
                // За разширения изглед показваме оригиналните транзакции в евро (преизчислени)
                const linkedPayments = transactions
                    .filter(t => t.associatedReservationId === res.reservationNumber)
                    .map(t => ({...t, euroAmount: toEuro(t.amount, t.currency)}));

                return (
                  <React.Fragment key={res.id}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : res.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
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
                        }`}>{res.status}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg w-fit ${res.paymentStatusColor}`}>{res.paymentStatus}</span>
                          {res.remainingEuro > 0.05 && (
                              <span className="text-[10px] font-bold text-rose-500 mt-1">
                                {t.due} €{res.remainingEuro.toFixed(2)}
                              </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-sm text-right">
                        {res.profitEuro.toFixed(2)} <span className="text-[9px] text-slate-400">€</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handlePreview(e, res)} title="Преглед" className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl"><Eye size={16} /></button>
                            <button onClick={(e) => handlePrint(e, res, 'voucher')} title="Ваучер" className="p-2 hover:bg-purple-50 text-purple-500 rounded-xl"><Ticket size={16} /></button>
                            <button onClick={(e) => handlePrint(e, res, 'contract')} title="Договор" className="p-2 hover:bg-indigo-50 text-indigo-500 rounded-xl"><FileText size={16} /></button>
                            <button onClick={(e) => handleEdit(e, res)} title="Редакция" className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl"><Edit3 size={16} /></button>
                            <button onClick={(e) => handleDelete(e, res.id)} title="Изтриване" className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={16} /></button>
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
                                    {p.type === 'income' ? '+' : '-'} €{p.euroAmount.toFixed(2)}
                                  </span>
                                </div>
                              ))
                            ) : <p className="text-[10px] italic text-slate-400 uppercase font-bold px-2">{t.noPayments}</p>}
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
