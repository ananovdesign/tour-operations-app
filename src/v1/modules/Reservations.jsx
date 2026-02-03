import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  Search, Filter, Plus, Printer, MoreVertical, 
  Calendar, User, Tag, ChevronRight, Loader2 
} from 'lucide-react';

const uiTranslations = {
  bg: {
    title: "Резервации",
    searchPlaceholder: "Търси по име или номер...",
    newRes: "Нова резервация",
    all: "Всички",
    confirmed: "Потвърдена",
    pending: "Изчакваща",
    cancelled: "Анулирана",
    customer: "Клиент",
    date: "Дата",
    status: "Статус",
    actions: "Действия",
    noData: "Няма намерени резервации"
  },
  en: {
    title: "Reservations",
    searchPlaceholder: "Search by name or ID...",
    newRes: "New Booking",
    all: "All",
    confirmed: "Confirmed",
    pending: "Pending",
    cancelled: "Cancelled",
    customer: "Customer",
    date: "Date",
    status: "Status",
    actions: "Actions",
    noData: "No reservations found"
  }
};

const Reservations = ({ lang = 'bg' }) => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const t = useMemo(() => uiTranslations[lang] || uiTranslations.bg, [lang]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const q = query(resRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesSearch = 
        res.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.resId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ЛЕНТА С ИНСТРУМЕНТИ */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-40 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-sm outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t.all}</option>
            <option value="Confirmed">{t.confirmed}</option>
            <option value="Pending">{t.pending}</option>
            <option value="Cancelled">{t.cancelled}</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 font-black uppercase text-xs">
            <Plus size={18} />
            <span className="hidden sm:inline">{t.newRes}</span>
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА / СПИСЪК */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.customer}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.status}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredReservations.length > 0 ? filteredReservations.map((res) => (
                <tr key={res.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white text-slate-800">{res.customerName}</p>
                        <p className="text-xs text-slate-400">ID: {res.resId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {res.checkIn}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusStyle(res.status)}`}>
                      {t[res.status?.toLowerCase()] || res.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                        <Printer size={18} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    {t.noData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
