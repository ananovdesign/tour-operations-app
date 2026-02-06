import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Bus, MapPin, Calendar, Users, Plus, Search, 
  Edit3, Trash2, X, User, Eye, FileText, CheckCircle, ArrowLeft, Euro 
} from 'lucide-react';

// Импорт на новия компонент за печат
import BusTourContractPrint from '../../BusTourContractPrint'; 

// ОФИЦИАЛЕН ФИКСИРАН КУРС
const FIXED_EXCHANGE_RATE = 1.95583;

// Helper за конвертиране
const toEuro = (amount, currency) => {
    const val = Number(amount) || 0;
    if (currency === 'EUR') return val;
    return val / FIXED_EXCHANGE_RATE;
};

// --- КОМПОНЕНТ ЗА ДЕТАЙЛЕН ПРЕГЛЕД (PREVIEW) ---
const TourPreviewModal = ({ tour, linkedReservations, onClose, t }) => {
  if (!tour) return null;

  const totalPax = linkedReservations.reduce((sum, res) => sum + (Number(res.adults)||0) + (Number(res.children)||0), 0);
  const occupancy = tour.maxPassengers > 0 ? (totalPax / tour.maxPassengers) * 100 : 0;
  
  // Конвертиране за преглед
  const priceEuro = toEuro(tour.price, tour.currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                    {tour.tourId}
                </span>
                <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                {tour.hotel}
                </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <MapPin size={14}/> {tour.transportCompany}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 overflow-y-auto space-y-8">
          
          {/* Stats Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center">
             <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase text-slate-400">Дати</p>
                <p className="font-bold text-slate-700 dark:text-white text-sm">{tour.departureDate} ➜ {tour.arrivalDate}</p>
             </div>
             <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase text-slate-400">Заети Места</p>
                <p className={`font-black text-lg ${occupancy >= 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {totalPax} <span className="text-slate-400 text-xs font-medium">/ {tour.maxPassengers}</span>
                </p>
             </div>
             <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Цена</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">€{priceEuro.toFixed(2)}</p>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <h3 className="font-black text-sm uppercase text-slate-400 border-b pb-2">Логистика</h3>
                <div>
                    <p className="text-xs text-slate-400">Тръгване</p>
                    <p className="font-medium text-sm dark:text-white">{tour.departureDateTimePlace || '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-400">Транспорт</p>
                    <p className="font-medium text-sm dark:text-white">{tour.transportDescription || '-'}</p>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="font-black text-sm uppercase text-slate-400 border-b pb-2">Настаняване</h3>
                <div>
                    <p className="text-xs text-slate-400">Хотели</p>
                    <p className="font-medium text-sm dark:text-white">{tour.tourHotels || '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-400">Стаи</p>
                    <p className="font-medium text-sm dark:text-white">{tour.tourRoomSummary || '-'}</p>
                </div>
             </div>
          </div>

          {/* Linked Reservations Table */}
          <div>
            <h3 className="font-black text-sm uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Users size={16}/> Списък Пътници ({linkedReservations.length} резервации)
            </h3>
            {linkedReservations.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="p-3 text-xs font-black text-slate-400 uppercase">Резервация</th>
                                <th className="p-3 text-xs font-black text-slate-400 uppercase">Водещ Турист</th>
                                <th className="p-3 text-xs font-black text-slate-400 uppercase text-center">Възрастни</th>
                                <th className="p-3 text-xs font-black text-slate-400 uppercase text-center">Деца</th>
                                <th className="p-3 text-xs font-black text-slate-400 uppercase">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {linkedReservations.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-blue-600">{res.reservationNumber}</td>
                                    <td className="p-3 font-medium dark:text-white">
                                        {res.tourists?.[0]?.firstName} {res.tourists?.[0]?.familyName}
                                    </td>
                                    <td className="p-3 text-center">{res.adults}</td>
                                    <td className="p-3 text-center">{res.children}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                            res.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>{res.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-slate-400 italic text-xs">
                    Няма свързани резервации с този тур.
                </div>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold uppercase text-xs transition-colors">Затвори</button>
        </div>
      </div>
    </div>
  );
};


const BusTours = ({ lang = 'bg' }) => {
  const [tours, setTours] = useState([]);
  const [reservations, setReservations] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
  const [previewTour, setPreviewTour] = useState(null); 
  const [contractTour, setContractTour] = useState(null); 

  const userId = auth.currentUser?.uid;

  const translations = {
    bg: {
      title: "Турове",
      search: "Търси по Тур ID, хотел или фирма...",
      addBtn: "Нов Тур",
      noTours: "Няма намерени турове.",
      edit: "Редакция",
      delete: "Изтрий",
      confirmDelete: "Сигурни ли сте, че искате да изтриете този тур?",
      formTitleNew: "Създаване на Тур",
      formTitleEdit: "Редакция на Тур",
      
      tourId: "Номер на Тур (Tour ID)",
      hotel: "Хотел (Основен)",
      transportCompany: "Транспортна Фирма",
      departureDate: "Дата на тръгване",
      arrivalDate: "Дата на връщане",
      nights: "Нощувки",
      daysInclTravel: "Дни (с пътя)",
      maxPassengers: "Макс. пътници",
      price: "Цена (€)", // Сменено на Евро
      
      departureDateTimePlace: "Час и място на тръгване",
      transportDescription: "Описание на транспорта",
      insuranceDetails: "Застраховка (инфо)",
      tourHotels: "Хотели по тура (описание)",
      tourRoomSummary: "Обобщение стаи",
      mealsIncluded: "Включени хранения",

      save: "Запази",
      cancel: "Отказ",
      loading: "Зареждане...",
      seats: "места",
      contract: "Договор",
      backToList: "Обратно към списъка"
    },
    en: {
      title: "Tours",
      search: "Search by Tour ID, Hotel or Company...",
      addBtn: "New Tour",
      noTours: "No tours found.",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Delete this tour?",
      formTitleNew: "Create Tour",
      formTitleEdit: "Edit Tour",
      
      tourId: "Tour ID",
      hotel: "Hotel (Main)",
      transportCompany: "Transport Company",
      departureDate: "Departure Date",
      arrivalDate: "Arrival Date",
      nights: "Nights",
      daysInclTravel: "Days (incl. Travel)",
      maxPassengers: "Max Passengers",
      price: "Price (€)", // Changed to Euro

      departureDateTimePlace: "Departure Time & Place",
      transportDescription: "Transport Description",
      insuranceDetails: "Insurance Details",
      tourHotels: "Tour Hotels",
      tourRoomSummary: "Room Summary",
      mealsIncluded: "Meals Included",

      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      seats: "seats",
      contract: "Contract",
      backToList: "Back to List"
    }
  };

  const t = translations[lang] || translations.bg;

  // --- I. DATABASE ---
  useEffect(() => {
    if (!userId) return;
    
    // 1. Fetch Tours
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    const unsubTours = onSnapshot(toursRef, (snapshot) => {
      const toursData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      toursData.sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
      setTours(toursData);
    });

    // 2. Fetch Reservations
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(resRef, (snapshot) => {
        const resData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReservations(resData);
        setLoading(false); 
    });

    return () => {
        unsubTours();
        unsubRes();
    };
  }, [userId]);

  // --- II. FILTER ---
  const filteredTours = tours.filter(tour => {
    const s = searchTerm.toLowerCase();
    return (
      (tour.tourId?.toLowerCase().includes(s)) ||
      (tour.hotel?.toLowerCase().includes(s)) ||
      (tour.transportCompany?.toLowerCase().includes(s))
    );
  });

  // --- III. HELPERS ---
  const getLinkedReservations = (tourId) => {
      if (!tourId) return [];
      return reservations.filter(r => r.linkedTourId && r.linkedTourId.toString().trim() === tourId.toString().trim());
  };

  const getBookedCount = (tourId) => {
      const linked = getLinkedReservations(tourId);
      return linked.reduce((sum, r) => sum + (Number(r.adults) || 0) + (Number(r.children) || 0), 0);
  };

  // --- IV. ACTIONS ---
  const handleSaveTour = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const tourData = {
      tourId: formData.get('tourId'),
      hotel: formData.get('hotel'),
      transportCompany: formData.get('transportCompany'),
      departureDate: formData.get('departureDate'),
      arrivalDate: formData.get('arrivalDate'),
      nights: Number(formData.get('nights')) || 0,
      daysInclTravel: Number(formData.get('daysInclTravel')) || 0,
      maxPassengers: Number(formData.get('maxPassengers')) || 45,
      
      // ВИНАГИ ЗАПИСВАМЕ В ЕВРО
      price: Number(formData.get('price')) || 0,
      currency: 'EUR',

      departureDateTimePlace: formData.get('departureDateTimePlace'),
      transportDescription: formData.get('transportDescription'),
      insuranceDetails: formData.get('insuranceDetails'),
      tourHotels: formData.get('tourHotels'),
      tourRoomSummary: formData.get('tourRoomSummary'),
      mealsIncluded: formData.get('mealsIncluded'),
      
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentTour?.id) {
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tours`, currentTour.id), tourData);
      } else {
        tourData.createdAt = new Date().toISOString();
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tours`), tourData);
      }
      setIsModalOpen(false);
      setCurrentTour(null);
    } catch (error) {
      console.error("Error saving tour:", error);
      alert("Error saving tour.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tours`, id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  // --- V. RENDER CONTRACT VIEW ---
  if (contractTour) {
      return (
          <div className="bg-white min-h-screen relative">
              <div className="p-4 bg-slate-100 flex justify-between items-center no-print border-b">
                  <button onClick={() => setContractTour(null)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-blue-600">
                      <ArrowLeft size={20} /> {t.backToList}
                  </button>
                  <h2 className="text-xl font-black uppercase text-slate-400">Генератор на Договор</h2>
                  <div className="w-20"></div>
              </div>
              
              <BusTourContractPrint 
                  tourData={contractTour} 
                  allReservations={reservations} 
                  onPrintFinish={() => setContractTour(null)}
              />
          </div>
      );
  }

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <div className="animate-spin text-blue-500 mb-2">
         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans relative pb-20">
      
      {/* --- PREVIEW MODAL --- */}
      {previewTour && (
        <TourPreviewModal 
            tour={previewTour} 
            linkedReservations={getLinkedReservations(previewTour.tourId)}
            onClose={() => setPreviewTour(null)}
            t={t}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.search}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setCurrentTour(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap"
        >
          <Plus size={16} /> {t.addBtn}
        </button>
      </div>

      {/* TOURS GRID */}
      {filteredTours.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-bold italic">{t.noTours}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map(tour => {
             // Calculate real occupancy
             const booked = getBookedCount(tour.tourId);
             const progress = (booked / (tour.maxPassengers || 1)) * 100;
             const isFull = booked >= tour.maxPassengers;
             const priceEuro = toEuro(tour.price, tour.currency);
             
             return (
              <div key={tour.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                
                {/* Decoration Top */}
                <div className={`h-2 w-full ${isFull ? 'bg-rose-500' : 'bg-blue-500'}`}></div>

                <div className="p-6 flex-1">
                  {/* Header: Dates & ID */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                        {tour.tourId || 'NO ID'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {tour.nights} нощ.
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <Calendar size={10} /> 
                        {tour.departureDate} ➜ {tour.arrivalDate}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-1 truncate" title={tour.hotel}>
                        {tour.hotel || 'No Hotel Name'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Bus size={12}/> {tour.transportCompany || '-'}
                    </p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>Заети: <span className={isFull ? 'text-rose-500' : 'text-emerald-500'}>{booked}</span></span>
                        <span>Капацитет: {tour.maxPassengers}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-emerald-400'}`} 
                            style={{width: `${Math.min(progress, 100)}%`}}
                        ></div>
                      </div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 text-right">
                      <span className="text-xl font-black text-slate-800 dark:text-white">€{priceEuro.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setPreviewTour(tour)} title="Преглед" className="p-2 bg-white shadow-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-colors">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setContractTour(tour)} title="Договор" className="p-2 bg-white shadow-md hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-xl transition-colors">
                    <FileText size={16} />
                  </button>
                  <button onClick={() => { setCurrentTour(tour); setIsModalOpen(true); }} title="Редакция" className="p-2 bg-white shadow-md hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(tour.id)} title="Изтриване" className="p-2 bg-white shadow-md hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD/EDIT MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative flex flex-col max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {currentTour ? t.formTitleEdit : t.formTitleNew}
                </h2>
                <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                <X size={24} className="text-slate-500" />
                </button>
            </div>

            <form onSubmit={handleSaveTour} className="space-y-6">
              
              {/* Top Row: ID, Hotel, Transport */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.tourId} *</label>
                    <input required name="tourId" defaultValue={currentTour?.tourId} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. TR-2025-01" />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.hotel}</label>
                    <input name="hotel" defaultValue={currentTour?.hotel} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.transportCompany}</label>
                    <input name="transportCompany" defaultValue={currentTour?.transportCompany} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.departureDate} *</label>
                  <input required name="departureDate" defaultValue={currentTour?.departureDate} type="date" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.arrivalDate} *</label>
                  <input required name="arrivalDate" defaultValue={currentTour?.arrivalDate} type="date" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.nights}</label>
                  <input name="nights" defaultValue={currentTour?.nights} type="number" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.daysInclTravel}</label>
                  <input name="daysInclTravel" defaultValue={currentTour?.daysInclTravel} type="number" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.maxPassengers}</label>
                    <input name="maxPassengers" defaultValue={currentTour?.maxPassengers || 50} type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.price}</label>
                    <input 
                        name="price" 
                        // Ако редактираме стар тур, показваме цената конвертирана в евро
                        defaultValue={currentTour ? toEuro(currentTour.price, currentTour.currency).toFixed(2) : 0} 
                        type="number" 
                        step="0.01" 
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                 </div>
              </div>

              {/* --- DETAILED TEXT AREAS (From old code) --- */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <h3 className="text-sm font-black uppercase text-slate-400">Детайли за Договор и Ваучер</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.departureDateTimePlace}</label>
                        <input name="departureDateTimePlace" defaultValue={currentTour?.departureDateTimePlace} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="06:00, София..." />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.transportDescription}</label>
                        <input name="transportDescription" defaultValue={currentTour?.transportDescription} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="Лицензиран автобус..." />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.insuranceDetails}</label>
                        <textarea name="insuranceDetails" defaultValue={currentTour?.insuranceDetails} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.tourHotels}</label>
                        <textarea name="tourHotels" defaultValue={currentTour?.tourHotels} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.tourRoomSummary}</label>
                        <textarea name="tourRoomSummary" defaultValue={currentTour?.tourRoomSummary} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.mealsIncluded}</label>
                        <textarea name="mealsIncluded" defaultValue={currentTour?.mealsIncluded} rows="2" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl font-bold uppercase text-xs transition-colors">{t.cancel}</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold uppercase text-xs transition-colors">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusTours;
