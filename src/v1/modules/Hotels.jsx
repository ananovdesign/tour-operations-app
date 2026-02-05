import React, { useState, useEffect } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Building2, MapPin, Star, Phone, Mail, Plus, Search, 
  Edit3, Trash2, X, Globe, Loader2 
} from 'lucide-react';

const Hotels = ({ lang = 'bg' }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State за модалния прозорец (формата)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(null); // Ако е null -> добавяме, ако има обект -> редактираме

  const userId = auth.currentUser?.uid;

  const t = {
    bg: {
      title: "Управление на Хотели",
      search: "Търси хотел по име или град...",
      addBtn: "Добави Хотел",
      noHotels: "Няма намерени хотели. Добавете първия си хотел!",
      edit: "Редакция",
      delete: "Изтрий",
      confirmDelete: "Сигурни ли сте, че искате да изтриете този хотел?",
      formTitleNew: "Добавяне на нов хотел",
      formTitleEdit: "Редакция на хотел",
      name: "Име на хотела",
      city: "Град / Дестинация",
      stars: "Звезди",
      email: "Имейл",
      phone: "Телефон",
      address: "Адрес",
      website: "Уебсайт",
      save: "Запази",
      cancel: "Отказ",
      loading: "Зареждане..."
    },
    en: {
      title: "Hotel Management",
      search: "Search hotel by name or city...",
      addBtn: "Add Hotel",
      noHotels: "No hotels found. Add your first one!",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this hotel?",
      formTitleNew: "Add New Hotel",
      formTitleEdit: "Edit Hotel",
      name: "Hotel Name",
      city: "City / Destination",
      stars: "Stars",
      email: "Email",
      phone: "Phone",
      address: "Address",
      website: "Website",
      save: "Save",
      cancel: "Cancel",
      loading: "Loading..."
    }
  }[lang] || lang.bg;

  // --- 1. ИЗВЛИЧАНЕ НА ДАННИ ---
  useEffect(() => {
    if (!userId) return;
    const hotelsRef = collection(db, `artifacts/${appId}/users/${userId}/hotels`);
    
    const unsubscribe = onSnapshot(hotelsRef, (snapshot) => {
      const hotelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Сортиране по име
      hotelsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setHotels(hotelsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // --- 2. ФИЛТРИРАНЕ ---
  const filteredHotels = hotels.filter(h => 
    (h.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (h.city?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- 3. CRUD ОПЕРАЦИИ ---
  
  const handleSaveHotel = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const hotelData = {
      name: formData.get('name'),
      city: formData.get('city'),
      stars: formData.get('stars'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      website: formData.get('website'),
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentHotel?.id) {
        // Update
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/hotels`, currentHotel.id);
        await updateDoc(docRef, hotelData);
      } else {
        // Create
        hotelData.createdAt = new Date().toISOString();
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/hotels`), hotelData);
      }
      setIsModalOpen(false);
      setCurrentHotel(null);
    } catch (error) {
      console.error("Error saving hotel:", error);
      alert("Грешка при запис.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/hotels`, id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const openEditModal = (hotel) => {
    setCurrentHotel(hotel);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setCurrentHotel(null);
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans text-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans relative pb-20">
      
      {/* HEADER & SEARCH */}
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
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap"
        >
          <Plus size={16} /> {t.addBtn}
        </button>
      </div>

      {/* HOTELS GRID */}
      {filteredHotels.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-bold italic">
          {t.noHotels}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map(hotel => (
            <div key={hotel.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative">
              
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(hotel)} className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-colors">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(hotel.id)} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-1 pr-16">{hotel.name}</h3>
                  <div className="flex items-center text-yellow-400 gap-1 text-xs">
                    {[...Array(Number(hotel.stars) || 0)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    {(Number(hotel.stars) === 0) && <span className="text-slate-300 text-[10px] uppercase font-bold">No Stars</span>}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-500">
                  <Building2 size={24} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={16} className="shrink-0" />
                  <span className="font-medium">{hotel.city || '-'}</span>
                </div>
                {hotel.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Phone size={16} className="shrink-0" />
                    <span className="truncate">{hotel.phone}</span>
                  </div>
                )}
                {hotel.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">{hotel.email}</span>
                  </div>
                )}
                 {hotel.website && (
                  <div className="flex items-center gap-3 text-sm text-blue-500">
                    <Globe size={16} className="shrink-0" />
                    <a href={hotel.website} target="_blank" rel="noreferrer" className="truncate hover:underline">Website</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
              {currentHotel ? t.formTitleEdit : t.formTitleNew}
            </h2>

            <form onSubmit={handleSaveHotel} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.name} *</label>
                <input required name="name" defaultValue={currentHotel?.name} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Grand Hotel..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.city} *</label>
                  <input required name="city" defaultValue={currentHotel?.city} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sofia..." />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.stars}</label>
                  <select name="stars" defaultValue={currentHotel?.stars || "3"} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.address}</label>
                <input name="address" defaultValue={currentHotel?.address} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Street name..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.phone}</label>
                  <input name="phone" defaultValue={currentHotel?.phone} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.email}</label>
                  <input name="email" defaultValue={currentHotel?.email} type="email" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
               <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">{t.website}</label>
                <input name="website" defaultValue={currentHotel?.website} type="text" className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>

              <div className="pt-4 flex gap-3">
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

export default Hotels;
