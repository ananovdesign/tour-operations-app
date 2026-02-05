import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Search, 
  ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Filter, X
} from 'lucide-react';

const Finance = ({ lang = 'bg' }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense

  const userId = auth.currentUser?.uid;

  const t = {
    bg: {
      title: "Финанси и Плащания",
      balance: "Текущ Баланс",
      income: "Приходи",
      expenses: "Разходи",
      addTransaction: "Нова Транзакция",
      search: "Търси плащане...",
      type: "Тип",
      category: "Категория",
      amount: "Сума",
      date: "Дата",
      desc: "Описание",
      method: "Метод",
      save: "Запази",
      cancel: "Отказ",
      loading: "Зареждане...",
      confirmDelete: "Изтриване на този запис?",
      types: { income: "Приход", expense: "Разход" },
      methods: { cash: "В брой", bank: "Банков път", card: "Карта" }
    },
    en: {
      title: "Finance & Payments",
      balance: "Current Balance",
      income: "Total Income",
      expenses: "Total Expenses",
      addTransaction: "New Transaction",
      search: "Search payment...",
      type: "Type",
      category: "Category",
      amount: "Amount",
      date: "Date",
      desc: "Description",
      method: "Method",
      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      confirmDelete: "Delete this record?",
      types: { income: "Income", expense: "Expense" },
      methods: { cash: "Cash", bank: "Bank Transfer", card: "Card" }
    }
  }[lang] || lang.bg;

  // --- I. FETCH DATA ---
  useEffect(() => {
    if (!userId) return;
    const financeRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    
    const unsubscribe = onSnapshot(financeRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending (newest first)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // --- II. CALCULATIONS & FILTER ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const matchesSearch = tr.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tr.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || tr.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount)||0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount)||0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // --- III. ACTIONS ---
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const transactionData = {
      type: formData.get('type'), // income / expense
      amount: Number(formData.get('amount')),
      date: formData.get('date'),
      category: formData.get('category'),
      method: formData.get('method'),
      description: formData.get('description'),
      associatedReservationId: formData.get('resId') || '', // Optional link
      createdAt: new Date().toISOString(),
      userId
    };

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`), transactionData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error saving transaction");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm(t.confirmDelete)) {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/financialTransactions`, id));
    }
  };

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center font-sans">
       <div className="animate-spin text-blue-500 mb-2"><Wallet /></div>
       <p className="text-slate-400 text-xs font-black uppercase">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans relative pb-20">
      
      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20"><Wallet size={64} /></div>
            <p className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1">{t.balance}</p>
            <h2 className="text-4xl font-black">{stats.balance.toFixed(2)} <span className="text-lg">лв.</span></h2>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{t.income}</p>
                <h2 className="text-2xl font-black text-emerald-500">+{stats.income.toFixed(2)} лв.</h2>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                <TrendingUp size={24} />
            </div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{t.expenses}</p>
                <h2 className="text-2xl font-black text-rose-500">-{stats.expense.toFixed(2)} лв.</h2>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                <TrendingDown size={24} />
            </div>
        </div>
      </div>

      {/* 2. CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
         <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>All</button>
            <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`}>In</button>
            <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-400'}`}>Out</button>
         </div>

         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
         </div>

         <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap w-full md:w-auto justify-center">
            <Plus size={16} /> {t.addTransaction}
         </button>
      </div>

      {/* 3. TRANSACTIONS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
         {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-bold italic">Няма намерени транзакции.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                     <tr>
                        <th className="p-5">{t.date}</th>
                        <th className="p-5">{t.category}</th>
                        <th className="p-5">{t.desc}</th>
                        <th className="p-5">{t.method}</th>
                        <th className="p-5 text-right">{t.amount}</th>
                        <th className="p-5 text-center"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                     {filteredTransactions.map(tr => (
                        <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                           <td className="p-5">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                 <Calendar size={14} className="text-slate-400" /> {tr.date}
                              </div>
                           </td>
                           <td className="p-5">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                 tr.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              }`}>
                                 {tr.category}
                              </span>
                           </td>
                           <td className="p-5">
                              <p className="font-bold text-sm text-slate-700 dark:text-white">{tr.description}</p>
                              {tr.associatedReservationId && <span className="text-[10px] text-blue-500 font-bold">Ref: {tr.associatedReservationId}</span>}
                           </td>
                           <td className="p-5 text-xs font-bold text-slate-500 uppercase">{t.methods[tr.method] || tr.method}</td>
                           <td className="p-5 text-right">
                              <span className={`text-sm font-black ${tr.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {tr.type === 'income' ? '+' : '-'} {Number(tr.amount).toFixed(2)} лв.
                              </span>
                           </td>
                           <td className="p-5 text-center">
                              <button onClick={() => handleDelete(tr.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* 4. MODAL ADD TRANSACTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase">{t.addTransaction}</h2>
                 <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              
              <form onSubmit={handleSaveTransaction} className="space-y-4">
                 <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <label className="flex-1 cursor-pointer">
                        <input type="radio" name="type" value="income" className="peer hidden" defaultChecked />
                        <div className="text-center py-3 rounded-lg text-xs font-black uppercase text-slate-500 peer-checked:bg-white peer-checked:text-emerald-500 peer-checked:shadow-sm transition-all">
                           {t.types.income}
                        </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                        <input type="radio" name="type" value="expense" className="peer hidden" />
                        <div className="text-center py-3 rounded-lg text-xs font-black uppercase text-slate-500 peer-checked:bg-white peer-checked:text-rose-500 peer-checked:shadow-sm transition-all">
                           {t.types.expense}
                        </div>
                    </label>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.amount} *</label>
                        <input required name="amount" type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.date} *</label>
                        <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.category}</label>
                        <select name="category" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none">
                           <option value="General">Общи</option>
                           <option value="Reservation">Резервация</option>
                           <option value="Hotel">Плащане Хотел</option>
                           <option value="Transport">Транспорт</option>
                           <option value="Office">Офис разходи</option>
                           <option value="Salary">Заплати</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.method}</label>
                        <select name="method" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none">
                           <option value="cash">В брой</option>
                           <option value="bank">Банков път</option>
                           <option value="card">Карта (POS)</option>
                        </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.desc}</label>
                    <input name="description" type="text" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Напр. Капаро от Иван Иванов" />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Свързан номер (по избор)</label>
                    <input name="resId" type="text" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="DYT123..." />
                 </div>

                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black uppercase text-xs mt-4 shadow-lg shadow-blue-500/30 transition-all">{t.save}</button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
