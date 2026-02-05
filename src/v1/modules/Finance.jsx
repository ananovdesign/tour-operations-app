import React, { useState, useEffect, useMemo } from 'react';
import { db, appId, auth } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Search, 
  Trash2, Calendar, Bus, Users, X, Link as LinkIcon, Filter, Edit3 
} from 'lucide-react';

const Finance = ({ lang = 'bg' }) => {
  const [transactions, setTransactions] = useState([]);
  const [reservations, setReservations] = useState([]); 
  const [tours, setTours] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null); // За редакция
  const [searchTerm, setSearchTerm] = useState('');
  
  // Филтри
  const [filterType, setFilterType] = useState('all'); 
  const [filterMethod, setFilterMethod] = useState('all'); 

  const userId = auth.currentUser?.uid;

  const t = {
    bg: {
      title: "Финанси",
      balance: "Текущ Баланс",
      income: "Приходи",
      expenses: "Разходи",
      addTransaction: "Нова Транзакция",
      editTransaction: "Редакция на Транзакция",
      search: "Търси...",
      date: "Дата",
      category: "Категория",
      desc: "Описание",
      method: "Каса / Сметка",
      amount: "Сума",
      linkedTo: "Свързано с",
      save: "Запази",
      update: "Обнови",
      cancel: "Отказ",
      loading: "Зареждане...",
      noData: "Няма намерени транзакции.",
      selectRes: "-- Избери Резервация --",
      selectTour: "-- Избери Тур --",
      methods: { "Cash": "Kaca 1 (Cash)", "Cash 2": "Каса 2 (Cash 2)", "Bank": "Банка (Bank)" },
      confirmDelete: "Сигурни ли сте, че искате да изтриете този запис?"
    },
    en: {
      title: "Finance",
      balance: "Balance",
      income: "Income",
      expenses: "Expenses",
      addTransaction: "New Transaction",
      editTransaction: "Edit Transaction",
      search: "Search...",
      date: "Date",
      category: "Category",
      desc: "Description",
      method: "Account / Method",
      amount: "Amount",
      linkedTo: "Linked To",
      save: "Save",
      update: "Update",
      cancel: "Cancel",
      loading: "Loading...",
      noData: "No transactions found.",
      selectRes: "-- Select Reservation --",
      selectTour: "-- Select Tour --",
      methods: { "Cash": "Cash", "Cash 2": "Cash 2", "Bank": "Bank" },
      confirmDelete: "Are you sure you want to delete this record?"
    }
  }[lang] || lang.bg;

  // --- I. ИЗВЛИЧАНЕ НА ДАННИ ---
  useEffect(() => {
    if (!userId) return;

    // 1. Transactions
    const financeRef = collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`);
    const unsubFinance = onSnapshot(financeRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(data);
    });

    // 2. Reservations
    const resRef = collection(db, `artifacts/${appId}/users/${userId}/reservations`);
    const unsubRes = onSnapshot(resRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.reservationNumber || '').localeCompare(a.reservationNumber || ''));
      setReservations(data);
    });

    // 3. Tours
    const toursRef = collection(db, `artifacts/${appId}/users/${userId}/tours`);
    const unsubTours = onSnapshot(toursRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTours(data);
      setLoading(false);
    });

    return () => {
      unsubFinance();
      unsubRes();
      unsubTours();
    };
  }, [userId]);

  // --- II. ХЕЛПЪРИ ---
  // Поправка за цветовете: проверяваме и 'income', и 'Income'
  const isIncome = (type) => type && type.toLowerCase() === 'income';

  // --- III. ФИЛТРИРАНЕ ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const desc = tr.description || tr.reasonDescription || '';
      const cat = tr.category || '';
      const method = tr.method || '';
      const type = tr.type || '';
      
      const matchesSearch = desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            cat.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || type.toLowerCase() === filterType.toLowerCase();
      const matchesMethod = filterMethod === 'all' || method === filterMethod;

      return matchesSearch && matchesType && matchesMethod;
    });
  }, [transactions, searchTerm, filterType, filterMethod]);

  const stats = useMemo(() => {
    const sourceData = filteredTransactions; 
    const income = sourceData.filter(t => isIncome(t.type)).reduce((sum, t) => sum + (Number(t.amount)||0), 0);
    const expense = sourceData.filter(t => !isIncome(t.type)).reduce((sum, t) => sum + (Number(t.amount)||0), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // --- IV. CRUD ОПЕРАЦИИ ---
  
  // Отваряне на модал за нова транзакция
  const openNewModal = () => {
    setCurrentTransaction(null);
    setIsModalOpen(true);
  };

  // Отваряне на модал за редакция
  const openEditModal = (tr) => {
    setCurrentTransaction(tr);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const transactionData = {
      type: formData.get('type'),
      amount: Number(formData.get('amount')),
      date: formData.get('date'),
      category: formData.get('category'),
      method: formData.get('method'),
      
      description: formData.get('description'),
      reasonDescription: formData.get('description'), // Поддържаме и старото име за съвместимост
      
      associatedReservationId: formData.get('associatedReservationId') || null,
      associatedTourId: formData.get('associatedTourId') || null,
      
      updatedAt: new Date().toISOString(),
      userId
    };

    try {
      if (currentTransaction?.id) {
        // UPDATE
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/financialTransactions`, currentTransaction.id);
        await updateDoc(docRef, transactionData);
      } else {
        // CREATE
        transactionData.createdAt = new Date().toISOString();
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/financialTransactions`), transactionData);
      }
      setIsModalOpen(false);
      setCurrentTransaction(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Грешка при запис.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm(t.confirmDelete)) {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/financialTransactions`, id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
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
            <p className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1">
                {filterMethod === 'all' ? t.balance : `${t.balance} (${filterMethod})`}
            </p>
            <h2 className="text-4xl font-black">{stats.balance.toFixed(2)} <span className="text-lg">лв.</span></h2>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{t.income}</p>
                <h2 className="text-2xl font-black text-emerald-500">+{stats.income.toFixed(2)} лв.</h2>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><TrendingUp size={24} /></div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{t.expenses}</p>
                <h2 className="text-2xl font-black text-rose-500">-{stats.expense.toFixed(2)} лв.</h2>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown size={24} /></div>
        </div>
      </div>

      {/* 2. CONTROLS & FILTERS */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
         
         <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
             {/* Type Filter */}
             <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>All</button>
                <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`}>In</button>
                <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filterType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-400'}`}>Out</button>
             </div>

             {/* Method Filter */}
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
                <Filter size={14} className="text-slate-400"/>
                <select 
                    value={filterMethod} 
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                >
                    <option value="all">Всички сметки</option>
                    <option value="Cash">Cash (Каса 1)</option>
                    <option value="Cash 2">Cash 2 (Каса 2)</option>
                    <option value="Bank">Bank (Банка)</option>
                </select>
             </div>
         </div>

         <div className="flex gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                type="text" 
                placeholder={t.search} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
            </div>

            <button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px] whitespace-nowrap">
                <Plus size={16} /> {t.addTransaction}
            </button>
         </div>
      </div>

      {/* 3. TRANSACTIONS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
         {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-bold italic">{t.noData}</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                     <tr>
                        <th className="p-5">{t.date}</th>
                        <th className="p-5">{t.category}</th>
                        <th className="p-5">{t.method}</th>
                        <th className="p-5">{t.desc}</th>
                        <th className="p-5">{t.linkedTo}</th>
                        <th className="p-5 text-right">{t.amount}</th>
                        <th className="p-5 text-center"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                     {filteredTransactions.map(tr => {
                        const isInc = isIncome(tr.type);
                        return (
                        <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                           <td className="p-5">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                 <Calendar size={14} className="text-slate-400" /> {tr.date}
                              </div>
                           </td>
                           <td className="p-5">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                 isInc ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                              }`}>
                                 {tr.category}
                              </span>
                           </td>
                           <td className="p-5">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${
                                  tr.method === 'Bank' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                  tr.method === 'Cash 2' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                  {tr.method}
                              </span>
                           </td>
                           <td className="p-5">
                              <p className="font-bold text-sm text-slate-700 dark:text-white truncate max-w-[200px]">
                                {tr.description || tr.reasonDescription}
                              </p>
                           </td>
                           <td className="p-5">
                              {tr.associatedReservationId && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit mb-1">
                                    <Users size={12} /> {tr.associatedReservationId}
                                </div>
                              )}
                              {tr.associatedTourId && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded w-fit">
                                    <Bus size={12} /> {tr.associatedTourId}
                                </div>
                              )}
                              {!tr.associatedReservationId && !tr.associatedTourId && (
                                <span className="text-slate-300 text-[10px]">-</span>
                              )}
                           </td>
                           <td className="p-5 text-right">
                              <span className={`text-sm font-black ${isInc ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {isInc ? '+' : '-'} {Number(tr.amount).toFixed(2)} лв.
                              </span>
                           </td>
                           <td className="p-5 text-center flex items-center justify-center gap-1">
                              <button onClick={() => openEditModal(tr)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                 <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDelete(tr.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     )})}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* 4. MODAL ADD/EDIT TRANSACTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl p-8 flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase">
                    {currentTransaction ? t.editTransaction : t.addTransaction}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              
              <form onSubmit={handleSaveTransaction} className="space-y-4">
                 
                 {/* Type Selection */}
                 <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <label className="flex-1 cursor-pointer">
                        <input 
                            type="radio" 
                            name="type" 
                            value="income" 
                            className="peer hidden" 
                            defaultChecked={currentTransaction ? isIncome(currentTransaction.type) : true} 
                        />
                        <div className="text-center py-3 rounded-lg text-xs font-black uppercase text-slate-500 peer-checked:bg-white peer-checked:text-emerald-500 peer-checked:shadow-sm transition-all">
                           {t.income}
                        </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                        <input 
                            type="radio" 
                            name="type" 
                            value="expense" 
                            className="peer hidden" 
                            defaultChecked={currentTransaction ? !isIncome(currentTransaction.type) : false}
                        />
                        <div className="text-center py-3 rounded-lg text-xs font-black uppercase text-slate-500 peer-checked:bg-white peer-checked:text-rose-500 peer-checked:shadow-sm transition-all">
                           {t.expenses}
                        </div>
                    </label>
                 </div>

                 {/* Date & Amount */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.amount} *</label>
                        <input 
                            required 
                            name="amount" 
                            type="number" 
                            step="0.01" 
                            defaultValue={currentTransaction?.amount}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.date} *</label>
                        <input 
                            required 
                            name="date" 
                            type="date" 
                            defaultValue={currentTransaction?.date || new Date().toISOString().split('T')[0]} 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                 </div>

                 {/* Category & Method */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.category}</label>
                        <select 
                            name="category" 
                            defaultValue={currentTransaction?.category}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none cursor-pointer"
                        >
                           <option value="Reservation">Резервация</option>
                           <option value="Hotel">Плащане към Хотел</option>
                           <option value="Transport">Транспорт</option>
                           <option value="Office">Офис/Наем</option>
                           <option value="Salary">Заплати</option>
                           <option value="General">Други</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.method}</label>
                        <select 
                            name="method" 
                            defaultValue={currentTransaction?.method}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none cursor-pointer"
                        >
                           <option value="Cash">Cash (В брой)</option>
                           <option value="Cash 2">Cash 2 (Втора каса)</option>
                           <option value="Bank">Bank (Банка)</option>
                        </select>
                    </div>
                 </div>

                 {/* Description */}
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{t.desc}</label>
                    <input 
                        name="description" 
                        type="text" 
                        defaultValue={currentTransaction?.description || currentTransaction?.reasonDescription}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Напр. Капаро от Иван..." 
                    />
                 </div>

                 {/* Links */}
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <LinkIcon size={14}/> Връзки (Опционално)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Резервация</label>
                            <select 
                                name="associatedReservationId" 
                                defaultValue={currentTransaction?.associatedReservationId}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none cursor-pointer text-xs"
                            >
                                <option value="">{t.selectRes}</option>
                                {reservations.map(res => (
                                    <option key={res.id} value={res.reservationNumber}>
                                        {res.reservationNumber} - {res.hotel?.substring(0, 15)}...
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Тур</label>
                            <select 
                                name="associatedTourId" 
                                defaultValue={currentTransaction?.associatedTourId}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-white outline-none cursor-pointer text-xs"
                            >
                                <option value="">{t.selectTour}</option>
                                {tours.map(tour => (
                                    <option key={tour.id} value={tour.tourId}>
                                        {tour.tourId} - {tour.hotel?.substring(0, 15)}...
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black uppercase text-xs mt-4 shadow-lg shadow-blue-500/30 transition-all">
                    {currentTransaction ? t.update : t.save}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
