import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Bus, MapPin, Calendar, Users, Clock, Plus, Search, 
  Edit3, Trash2, X, AlertCircle, CheckCircle2, User 
} from 'lucide-react';

const BusTours = ({ lang = 'bg' }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);

  const userId = auth.currentUser?.uid;

  const t = {
    bg: {
      title: "Автобусни Турове",
      search: "Търси по име или дестинация...",
      addBtn: "Нов Тур",
      noTours: "Няма планирани турове.",
      edit: "Редакция",
      delete: "Изтрий",
      confirmDelete: "Сигурни ли сте, че искате да изтриете този тур?",
      formTitleNew: "Създаване на Тур",
      formTitleEdit: "Редакция на Тур",
      tourName: "Име на тура",
      route: "Маршрут (От - До)",
      dates: "Дати",
      startDate: "Начало",
      endDate: "Край",
      busInfo: "Транспорт инфо",
      busNumber: "Рег. номер автобус",
      driver: "Шофьор / Фирма",
      capacity: "Капацитет (Места)",
      price: "Цена на човек",
      status: "Статус",
      save: "Запази",
      cancel: "Отказ",
      loading: "Зареждане...",
      seats: "места",
      perPerson: "на човек",
      statuses: {
        planned: "Планиран",
        confirmed: "Потвърден",
        completed: "Приключил",
        cancelled: "Анулиран"
      }
    },
    en: {
      title: "Bus Tours",
      search: "Search by name or destination...",
      addBtn: "New Tour",
      noTours: "No tours planned.",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this tour?",
      formTitleNew: "Create Tour",
      formTitleEdit: "Edit Tour",
      tourName: "Tour Name",
      route: "Route (From - To)",
      dates: "Dates",
      startDate: "Start Date",
      endDate: "End Date",
      busInfo: "Transport Info",
      busNumber: "Bus Plate #",
      driver: "Driver / Company",
      capacity: "Capacity (Seats)",
      price: "Price per person",
      status: "Status",
      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      seats: "seats",
      perPerson: "pp",
      statuses: {
        planned: "Planned",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled"
      }
    }
  }[lang] || lang.bg;

  // --- I. DATABASE ---
  useEffect(() => {
    if (!userId) return;
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    
    const unsubscribe = onSnapshot(toursRef, (snapshot) => {
      const toursData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Сортиране по начална дата (най-новите първи)
      toursData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setTours(toursData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // --- II. FILTER ---
  const filteredTours = tours.filter(tour => 
    (tour.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tour.route?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- III. ACTIONS ---
  const handleSaveTour = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tourData = {
      name: formData.get('name'),
      route: formData.get('route'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      busNumber: formData.get('busNumber'),
      driver: formData.get('driver'),
      capacity: Number(formData.get('capacity')) || 45,
      price: Number(formData.get('price')) || 0,
      status: formData.get('status'),
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentTour?.id) {
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tours`, currentTour.id), tourData);
      } else {
        tourData.createdAt = new Date().toISOString();
        // В бъдеще тук ще добавим occupiedSeats, които ще се смятат автоматично
        tourData.occupiedSeats = 0; 
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
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
          {filteredTours.map(tour => (
            <div key={tour.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
              
              {/* STATUS BAR */}
              <div className={`h-2 w-full ${
                tour.status === 'confirmed' ? 'bg-emerald-500' : 
                tour.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-400'
              }`}></div>

              <div className="p-6 flex-1">
                {/* Header: Date & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">
                      {tour.startDate} <span className="text-slate-300">/</span> {tour.endDate}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(tour.status)}`}>
                    {t.statuses[tour.status] || tour.status}
                  </span>
                </div>

                {/* Title & Route */}
                <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-2">{tour.name}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-6">
                  <MapPin size={14} /> {tour.route || "No route info"}
                </div>

                {/* Bus Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase mb-1">
                      <Bus size={12} /> {t.busNumber}
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{tour.busNumber || "-"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase mb-1">
                      <User size={12} /> {t.driver}
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{tour.driver || "-"}</p>
                  </div>
                </div>

                {/* Capacity & Price */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {tour.occupiedSeats || 0} <span className="text-slate-400 font-normal">/ {tour.capacity} {t.seats}</span>
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-black">{t.price}</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400">{Number(tour.price).toFixed(2)} лв.</span>
                   </div>
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
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative flex flex-col max-h-[90vh] overflow-y-auto">
            
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
              
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.tourName} *</label>
                    <input required name="name" defaultValue={currentTour?.name} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Shopping in Edirne" />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.route}</label>
                    <input required name="route" defaultValue={currentTour?.route} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sofia - Plovdiv - Edirne" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.startDate} *</label>
                  <input required name="startDate" defaultValue={currentTour?.startDate} type="date" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-400 mb-1 ml-1">{t.endDate} *</label>
                  <input required name="endDate" defaultValue={currentTour?.endDate} type="date" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Bus & Driver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.busNumber}</label>
                    <input name="busNumber" defaultValue={currentTour?.busNumber} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="CB 1234 AB" />
                 </div>
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.driver}</label>
                    <input name="driver" defaultValue={currentTour?.driver} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Transport Firm Ltd." />
                 </div>
              </div>

              {/* Capacity, Price, Status */}
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.capacity}</label>
                    <input name="capacity" defaultValue={currentTour?.capacity || 50} type="number" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.price}</label>
                    <input name="price" defaultValue={currentTour?.price || 0} type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.status}</label>
                    <select name="status" defaultValue={currentTour?.status || 'planned'} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="planned">{t.statuses.planned}</option>
                        <option value="confirmed">{t.statuses.confirmed}</option>
                        <option value="completed">{t.statuses.completed}</option>
                        <option value="cancelled">{t.statuses.cancelled}</option>
                    </select>
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
