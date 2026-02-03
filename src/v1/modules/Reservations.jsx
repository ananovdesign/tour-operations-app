import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Search, Plus, Eye, Edit3, FileText, Loader2, User, ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

const Reservations = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]); // За плащанията
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // СЛЕДЕНЕ НА РЕЗЕРВАЦИИ
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(resRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => {
        const getNum = (str) => parseInt(str?.toString().replace(/\D/g, '')) || 0;
        return getNum(b.reservationNumber) - getNum(a.reservationNumber);
      });
      setReservations(sorted);
      setLoading(false);
    });

    // СЛЕДЕНЕ НА ТРАНЗАКЦИИ
    const transRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const unsubTrans = onSnapshot(transRef, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRes(); unsubTrans(); };
  }, [userId]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const leadGuest = res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : "";
      const matchesSearch = leadGuest.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (res.reservationNumber || "").toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-slate-400 font-black italic uppercase">Зареждане на плащания...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* ФИЛТРИ */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by guest or #dyt..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-bold text-sm outline-none dark:text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
          </select>
          <button className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]">
            <Plus size={16} /> New Res
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5">Number</th>
                <th className="px-6 py-5">Hotel</th>
                <th className="px-6 py-5">Lead Guest</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Payment</th>
                <th className="px-6 py-5 text-right">Profit</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredReservations.map((res) => {
                const linkedPayments = transactions.filter(t => t.associatedReservationId === res.reservationNumber);
                const isExpanded = expandedId === res.id;

                return (
                  <React.Fragment key={res.id}>
                    <tr 
                      onClick={() => toggleExpand(res.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-6 py-5 font-black text-blue-600">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {res.reservationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold">{res.hotel}</td>
                      <td className="px-6 py-5 font-bold text-sm italic">
                        {res.tourists?.[0] ? `${res.tourists[0].firstName} ${res.tourists[0].familyName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${res.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase ${res.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {res.paymentStatus}
                          </span>
                          {res.remainingAmount > 0 && <span className="text-[10px] text-rose-500 font-bold italic">Due: {res.remainingAmount.toFixed(2)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-sm text-right">{res.profit?.toFixed(2)} BGN</td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-blue-100 rounded-xl text-blue-600"><Eye size={14} /></button>
                          <button className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-600"><Edit3 size={14} /></button>
                        </div>
                      </td>
                    </tr>

                    {/* РАЗГЪВАЩА СЕ ЧАСТ С ПЛАЩАНИЯ */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/40 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan="7" className="px-10 py-6">
                          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-inner">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2 tracking-widest">
                              <FileText size={14} /> Linked Financial Transactions
                            </h4>
                            {linkedPayments.length > 0 ? (
                              <div className="space-y-2">
                                {linkedPayments.map(p => (
                                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                      <div className={`p-2 rounded-xl ${p.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {p.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">{p.method}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{p.date}</p>
                                      </div>
                                    </div>
                                    <p className={`font-black text-sm ${p.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {p.type === 'income' ? '+' : '-'} {p.amount.toFixed(2)} BGN
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 font-bold italic">No payments found for this reservation.</p>
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
