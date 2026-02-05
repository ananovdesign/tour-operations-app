import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Bus, MapPin, Calendar, Users, Plus, Search, 
  Edit3, Trash2, X, User, FileText 
} from 'lucide-react';

const BusTours = ({ lang = 'bg' }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);

  const userId = auth.currentUser?.uid;

  const translations = {
    bg: {
      title: "Автобусни Турове",
      search: "Търси по Тур ID, хотел или фирма...",
      addBtn: "Нов Тур",
      noTours: "Няма намерени турове.",
      edit: "Редакция",
      delete: "Изтрий",
      confirmDelete: "Сигурни ли сте, че искате да изтриете този тур?",
      formTitleNew: "Създаване на Тур",
      formTitleEdit: "Редакция на Тур",
      
      // Fields matching your old code
      tourId: "Номер на Тур (Tour ID)",
      hotel: "Хотел (Основен)",
      transportCompany: "Транспортна Фирма",
      departureDate: "Дата на тръгване",
      arrivalDate: "Дата на връщане",
      nights: "Нощувки",
      daysInclTravel: "Дни (с пътя)",
      maxPassengers: "Макс. пътници",
      price: "Цена (лв)",
      
      // Detailed text fields
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
      contract: "Договор"
    },
    en: {
      title: "Bus Tours",
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
      price: "Price",

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
      contract: "Contract"
    }
  };

  const t = translations[lang] || translations.bg;

  // --- I. DATABASE ---
  useEffect(() => {
    if (!userId) return;
    // ВНИМАНИЕ: Използваме новата структура 'artifacts/...'. 
    // Ако искаш да виждаш старите данни, трябва да ги мигрираш или да сменим пътя тук.
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    
    const unsubscribe = onSnapshot(toursRef, (snapshot) => {
      const toursData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Сортиране по дата на тръгване
      toursData.sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
      setTours(toursData);
      setLoading(false);
    });

    return () => unsubscribe();
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

  // --- III. ACTIONS ---
  const handleSaveTour = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Mapping fields exactly to your old code structure
    const tourData = {
      tourId: formData.get('tourId'),
      hotel: formData.get('hotel'),
      transportCompany: formData.get('transportCompany'),
      departureDate: formData.get('departureDate'),
      arrivalDate: formData.get('arrivalDate'),
      nights: Number(formData.get('nights')) || 0,
      daysInclTravel: Number(formData.get('daysInclTravel')) || 0,
      maxPassengers: Number(formData.get('maxPassengers')) || 45,
      price: Number(formData.get('price')) || 0,
      
      // The detailed text fields
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

  // Helper to calculate booked seats (Mock functionality for now)
  const getBookedCount = (tourId) => {
    // Тук по-късно ще свържем с резервациите
    return 0; 
  };

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <div className="animate-spin text-blue-500 mb-2">
         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
         </svg>
      </div>
      <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans relative pb-20">
      
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
             const booked = getBookedCount(tour.tourId);
             const progress = (booked / (tour.maxPassengers || 1)) * 100;
             
             return (
              <div key={tour.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                
                {/* Decoration Top */}
                <div className="h-2 w-full bg-blue-500"></div>

                <div className="p-6 flex-1">
                  {/* Header: Dates */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">
                        {tour.departureDate} <span className="text-slate-300">➜</span> {tour.arrivalDate}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{tour.nights} нощ.</span>
                  </div>

                  {/* Title & Tour ID */}
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{tour.tourId}</span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mt-1">{tour.hotel}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1"><Bus size={12}/> {tour.transportCompany || 'No Company'}</p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>{booked} {t.seats}</span>
                        <span>{tour.maxPassengers} {t.seats}</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{width: `${progress}%`}}></div>
                     </div>
                  </div>

                  {/* Price */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                     <span className="text-xl font-black text-slate-800 dark:text-white">{Number(tour.price).toFixed(2)} <span className="text-xs">лв.</span></span>
                  </div>
                </div>

                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrentTour(tour); setIsModalOpen(true); }} className="p-2 bg-white shadow-md hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(tour.id)} className="p-2 bg-white shadow-md hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM */}
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
                    <input name="price" defaultValue={currentTour?.price || 0} type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
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
