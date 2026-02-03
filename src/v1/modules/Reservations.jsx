import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Search, Plus, Eye, Edit3, FileText, Loader2, User
} from 'lucide-react';

const Reservations = ({ lang = 'bg' }) => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    
    const unsub = onSnapshot(resRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

      // ПРАВИЛНО СОРТИРАНЕ ЗА НОМЕРА КАТО "dyt101"
      const sortedData = data.sort((b, a) => {
        // Извличаме само цифрите от номера (напр. "dyt105" става 105)
        const getNum = (str) => {
          if (!str) return 0;
          const cleaned = str.toString().replace(/\D/g, ''); // Маха всичко, което не е цифра
          return parseInt(cleaned) || 0;
        };

        return getNum(a.reservationNumber) - getNum(b.reservationNumber);
      });

      setReservations(sortedData);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const leadGuest = res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : "";
      const resNum = (res.reservationNumber || "").toString().toLowerCase();
      
      const matchesSearch = 
        leadGuest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resNum.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 font-sans">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-slate-400 font-black italic uppercase tracking-widest">Подреждане на резервации...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search guest or #dyt..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-40 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-sm outline-none dark:text-white cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-black uppercase text-[10px]">
            <Plus size={16} /> New Reservation
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Res. Number</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotel</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Guest</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Profit</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-5 font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                    {res.reservationNumber}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold truncate max-w-[140px]">{res.hotel}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold text-sm">
                       {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                    </div>
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
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg w-fit ${
                         res.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {res.paymentStatus || 'Unpaid'}
                      </span>
                      {res.remainingAmount > 0 && (
                        <span className="text-[10px] font-bold text-rose-500 mt-1">
                          Due: {res.remainingAmount.toFixed(2)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
