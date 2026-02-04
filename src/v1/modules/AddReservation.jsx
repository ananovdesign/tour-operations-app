import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserPlus, CreditCard, Trash2, Plus, Hotel, Landmark, Plane, Hash } from 'lucide-react';

const AddReservation = ({ 
  onBack, 
  lang = 'bg', 
  tours = [], 
  customers = [],
  reservations = [], 
  loading = false,
  handleSubmitReservation 
}) => {

  // Функция за интелигентно определяне на следващия номер
  const getNextResNumber = (resList) => {
    const START_NUMBER = 100292; // Твоят начален номер
    if (!resList || resList.length === 0) return `dyt${START_NUMBER}`;
    
    const numbers = resList
      .map(r => r.reservationNumber)
      .filter(n => n && n.startsWith('dyt'))
      .map(n => parseInt(n.replace('dyt', '')))
      .filter(n => !isNaN(n));
    
    if (numbers.length === 0) return `dyt${START_NUMBER}`;
    const maxNum = Math.max(...numbers);
    // Ако най-високият в базата е по-малък от началния ти, започни от началния
    return `dyt${Math.max(maxNum + 1, START_NUMBER)}`;
  };

  const [reservationForm, setReservationForm] = useState({
    creationDate: new Date().toISOString().split('T')[0],
    reservationNumber: '', // Ще се запълни динамично
    tourType: 'HOTEL ONLY',
    hotel: '',
    food: '',
    roomType: '',
    place: '',
    checkIn: '',
    checkOut: '',
    nights: 0,
    adults: 1,
    children: 0,
    tourists: [{
      mode: 'new',
      firstName: '',
      fatherName: '',
      familyName: '',
      id: '', 
      realId: '', 
      email: '',
      phone: ''
    }],
    depositPaid: false,
    depositAmount: 0,
    finalAmount: 0,
    owedToHotel: 0,
    approxTransportCost: 0,
    profit: 0,
    tourOperator: '',
    status: 'Pending',
    linkedTourId: '',
  });

  // Ефект за определяне на номера при зареждане на компонента или данните
  useEffect(() => {
    const nextNum = getNextResNumber(reservations);
    setReservationForm(prev => ({ ...prev, reservationNumber: nextNum }));
  }, [reservations]);

  // Автоматични изчисления: Печалба и Нощувки
  useEffect(() => {
    let calculatedNights = 0;
    if (reservationForm.checkIn && reservationForm.checkOut) {
      const start = new Date(reservationForm.checkIn);
      const end = new Date(reservationForm.checkOut);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      calculatedNights = diffDays > 0 ? diffDays : 0;
    }

    const calculatedProfit = Number(reservationForm.finalAmount) - 
                             Number(reservationForm.owedToHotel) - 
                             Number(reservationForm.approxTransportCost);

    setReservationForm(prev => ({ 
      ...prev, 
      profit: calculatedProfit,
      nights: calculatedNights 
    }));
  }, [reservationForm.finalAmount, reservationForm.owedToHotel, reservationForm.approxTransportCost, reservationForm.checkIn, reservationForm.checkOut]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTouristChange = (index, e) => {
    const { name, value } = e.target;
    const newTourists = [...reservationForm.tourists];
    newTourists[index][name] = value;
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const handleTouristModeChange = (index, mode) => {
    const newTourists = [...reservationForm.tourists];
    newTourists[index] = {
      ...newTourists[index],
      mode: mode,
      firstName: '',
      fatherName: '',
      familyName: '',
      id: '',
      realId: ''
    };
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const handleExistingTouristSelect = (index, customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newTourists = [...reservationForm.tourists];
      newTourists[index] = { 
        ...customer, 
        id: customer.id, 
        mode: 'existing' 
      };
      setReservationForm(prev => ({ ...prev, tourists: newTourists }));
    }
  };

  const addTourist = () => {
    setReservationForm(prev => ({
      ...prev,
      tourists: [...prev.tourists, { mode: 'new', firstName: '', fatherName: '', familyName: '', id: '', realId: '', email: '', phone: '' }]
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-bold">
          <ArrowLeft size={20} /> {lang === 'bg' ? 'Назад' : 'Back'}
        </button>
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
                <Hash size={18} className="text-blue-500" />
                <input 
                    type="text" 
                    name="reservationNumber"
                    value={reservationForm.reservationNumber}
                    onChange={handleFormChange}
                    className="text-2xl font-black uppercase tracking-tighter bg-transparent border-none outline-none focus:ring-0 text-slate-800 dark:text-white w-40 text-center"
                />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Промени номера ръчно при нужда</span>
        </div>
        <button 
          onClick={() => handleSubmitReservation(reservationForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center gap-2 font-black uppercase text-xs transition-all active:scale-95"
        >
          <Save size={18} /> {loading ? '...' : (lang === 'bg' ? 'Запази' : 'Save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Секция Хотел */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] mb-6 tracking-widest">Информация за престоя</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input type="text" name="hotel" placeholder="Хотел" value={reservationForm.hotel} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border-none" />
               <input type="text" name="place" placeholder="Град / Дестинация" value={reservationForm.place} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border-none" />
               <div className="grid grid-cols-2 gap-4">
                  <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border-none" />
                  <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border-none" />
               </div>
               <div className="flex gap-4">
                  <input type="text" name="food" placeholder="Храна (HB, AI...)" value={reservationForm.food} onChange={handleFormChange} className="w-1/2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border-none" />
                  <div className="w-1/2 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase">
                    {reservationForm.nights} Нощувки
                  </div>
               </div>
            </div>
          </div>

          {/* Секция Туристи */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Списък Туристи ({customers.length} в базата)</p>
              <button onClick={addTourist} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={20}/></button>
            </div>
            
            <div className="space-y-4">
              {reservationForm.tourists.map((t, idx) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between mb-4">
                    <div className="flex bg-white dark:bg-slate-700 p-1 rounded-xl shadow-sm">
                       <button onClick={() => handleTouristModeChange(idx, 'new')} className={`px-4 py-1 text-[10px] font-black rounded-lg ${t.mode==='new' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>НОВ</button>
                       <button onClick={() => handleTouristModeChange(idx, 'existing')} className={`px-4 py-1 text-[10px] font-black rounded-lg ${t.mode==='existing' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>КЛИЕНТ</button>
                    </div>
                    {reservationForm.tourists.length > 1 && <button onClick={() => {const nt=reservationForm.tourists.filter((_,i)=>i!==idx); setReservationForm(p=>({...p, tourists:nt}))}} className="text-red-400"><Trash2 size={18}/></button>}
                  </div>

                  {t.mode === 'existing' ? (
                    <select 
                      value={t.id || ''} 
                      onChange={(e) => handleExistingTouristSelect(idx, e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-blue-500/10"
                    >
                      <option value="">-- Избери клиент ({customers.length}) --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.fatherName} {c.familyName} ({c.realId})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" name="firstName" placeholder="Име" value={t.firstName} onChange={(e)=>handleTouristChange(idx, e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="fatherName" placeholder="Презиме" value={t.fatherName} onChange={(e)=>handleTouristChange(idx, e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="familyName" placeholder="Фамилия" value={t.familyName} onChange={(e)=>handleTouristChange(idx, e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="realId" placeholder="ЕГН" value={t.realId} onChange={(e)=>handleTouristChange(idx, e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="email" name="email" placeholder="Email" value={t.email} onChange={(e)=>handleTouristChange(idx, e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none col-span-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Дясна колона Финанси и Турове */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <p className="text-emerald-400 font-black uppercase text-[10px] mb-8 tracking-widest">Финанси</p>
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-500 text-[10px] font-black uppercase">Продажна Цена</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleFormChange} className="bg-transparent text-emerald-400 text-2xl font-black outline-none w-24 text-right" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-500 text-[10px] font-black uppercase">Към Хотел</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleFormChange} className="bg-transparent text-white text-lg font-bold outline-none w-24 text-right" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-blue-400 text-[10px] font-black uppercase">Транспорт</span>
                <input type="number" name="approxTransportCost" value={reservationForm.approxTransportCost} onChange={handleFormChange} className="bg-transparent text-white text-lg font-bold outline-none w-24 text-right" />
              </div>
              <div className="bg-emerald-500 p-5 rounded-3xl mt-4">
                 <div className="flex justify-between items-center text-slate-900">
                    <span className="text-[10px] font-black uppercase">Чиста Печалба</span>
                    <span className="text-xl font-black">{reservationForm.profit.toFixed(2)} лв.</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] mb-6 tracking-widest">Връзка с Тур ({tours.length})</p>
            <select 
              name="linkedTourId" 
              value={reservationForm.linkedTourId} 
              onChange={handleFormChange} 
              className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-black text-blue-600 outline-none border-none"
            >
              <option value="">-- Избери съществуващ тур --</option>
              {tours.map(t => (
                <option key={t.id} value={t.tourId}>{t.tourId} | {t.hotel} ({t.startDate})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
