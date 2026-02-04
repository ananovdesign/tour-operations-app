import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserPlus, CreditCard, Trash2, Plus, Hotel, Landmark, Plane } from 'lucide-react';

const AddReservation = ({ 
  onBack, 
  lang = 'bg', 
  tours = [], 
  customers = [],
  reservations = [], // Подаваме текущите резервации за определяне на номер
  loading = false,
  handleSubmitReservation 
}) => {

  // Функция за автоматичен номер (напр. dyt100251 -> dyt100252)
  const generateNextResNumber = () => {
    if (!reservations || reservations.length === 0) return 'dyt100001';
    const lastNum = [...reservations]
      .map(r => r.reservationNumber)
      .filter(n => n && n.startsWith('dyt'))
      .sort()
      .pop();
    
    if (!lastNum) return 'dyt100001';
    const numericPart = parseInt(lastNum.replace('dyt', ''));
    return `dyt${numericPart + 1}`;
  };

  const [reservationForm, setReservationForm] = useState({
    creationDate: new Date().toISOString().split('T')[0],
    reservationNumber: generateNextResNumber(),
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
      id: '', // Firebase UID
      realId: '', // ЕГН
      address: '',
      city: '',
      postCode: '',
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

  // Автоматични изчисления: Печалба и Нощувки
  useEffect(() => {
    // 1. Изчисляване на нощувки
    let calculatedNights = 0;
    if (reservationForm.checkIn && reservationForm.checkOut) {
      const start = new Date(reservationForm.checkIn);
      const end = new Date(reservationForm.checkOut);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedNights = diffDays > 0 ? diffDays : 0;
    }

    // 2. Изчисляване на печалба: Продажна - (Хотел + Транспорт)
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
    newTourists[index].mode = mode;
    // Нулираме данните при смяна на режима
    if (mode === 'existing') {
      newTourists[index].firstName = '';
      newTourists[index].familyName = '';
      newTourists[index].id = '';
      newTourists[index].realId = '';
    }
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const handleExistingTouristSelect = (index, customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newTourists = [...reservationForm.tourists];
      newTourists[index] = { 
        ...customer, 
        id: customer.id, // Това е Firebase UID
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

  const removeTourist = (index) => {
    if (reservationForm.tourists.length > 1) {
      const newTourists = reservationForm.tourists.filter((_, i) => i !== index);
      setReservationForm(prev => ({ ...prev, tourists: newTourists }));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> {lang === 'bg' ? 'Назад' : 'Back'}
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
            Резервация #{reservationForm.reservationNumber}
          </h1>
        </div>
        <button 
          onClick={() => handleSubmitReservation ? handleSubmitReservation(reservationForm) : console.log(reservationForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]"
        >
          <Save size={16} /> {loading ? '...' : (lang === 'bg' ? 'Запази' : 'Save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Секция: Основна информация */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Hotel size={18} className="text-blue-500" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Информация за престоя</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Хотел</label>
                <input type="text" name="hotel" placeholder="Име на хотел" value={reservationForm.hotel} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Град / Дестинация</label>
                <input type="text" name="place" placeholder="Град/Курорт" value={reservationForm.place} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Настаняване</label>
                <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Напускане</label>
                <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-bold" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex flex-col justify-center items-center border border-blue-100 dark:border-blue-800">
                <span className="text-[9px] font-black uppercase text-blue-500">Престой</span>
                <span className="text-sm font-black">{reservationForm.nights} нощувки</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Храна</label>
                <input type="text" name="food" placeholder="HB, All Inclusive..." value={reservationForm.food} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Тип стая</label>
                <input type="text" name="roomType" placeholder="Двойна стая..." value={reservationForm.roomType} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Възрастни</label>
                  <input type="number" name="adults" value={reservationForm.adults} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Деца</label>
                  <input type="number" name="children" value={reservationForm.children} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Секция: Туристи */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Туристи (Три имена и ЕГН)</p>
              </div>
              <button type="button" onClick={addTourist} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-6">
              {reservationForm.tourists.map((tourist, index) => (
                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Турист {index + 1}</span>
                    <div className="flex gap-2">
                       <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                          <button type="button" onClick={() => handleTouristModeChange(index, 'new')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${tourist.mode === 'new' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800' : 'text-slate-500'}`}>НОВ</button>
                          <button type="button" onClick={() => handleTouristModeChange(index, 'existing')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${tourist.mode === 'existing' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800' : 'text-slate-500'}`}>КЛИЕНТ</button>
                       </div>
                       {reservationForm.tourists.length > 1 && (
                         <button type="button" onClick={() => removeTourist(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                       )}
                    </div>
                  </div>

                  {tourist.mode === 'existing' ? (
                    <select value={tourist.id || ''} onChange={(e) => handleExistingTouristSelect(index, e.target.value)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-sm outline-none font-bold">
                      <option value="">-- Търси клиент в базата --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.fatherName} {c.familyName} (ЕГН: {c.realId})</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" name="firstName" placeholder="Име" value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none shadow-sm font-bold" />
                      <input type="text" name="fatherName" placeholder="Презиме" value={tourist.fatherName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none shadow-sm font-bold" />
                      <input type="text" name="familyName" placeholder="Фамилия" value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none shadow-sm font-bold" />
                      <input type="text" name="realId" placeholder="ЕГН" value={tourist.realId} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none shadow-sm" />
                      <input type="text" name="id" placeholder="Firebase ID (Опционално)" value={tourist.id} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-[11px] font-mono outline-none shadow-sm opacity-50" />
                      <input type="email" name="email" placeholder="Email" value={tourist.email} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none shadow-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Дясна страна: Финанси */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard size={18} className="text-emerald-400" />
              <p className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Финансов Баланс</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black uppercase">Продажна Цена</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleFormChange} className="bg-transparent text-right font-black text-xl outline-none w-24 text-emerald-400" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black uppercase">Нетна цена към хотел</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleFormChange} className="bg-transparent text-right font-bold outline-none w-24" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1 text-blue-400">
                  <Plane size={12} />
                  <span className="text-[10px] font-black uppercase">Разход Транспорт</span>
                </div>
                <input type="number" name="approxTransportCost" value={reservationForm.approxTransportCost} onChange={handleFormChange} className="bg-transparent text-right font-bold outline-none w-24 text-blue-400" />
              </div>
              
              <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] font-black uppercase">Чиста Печалба</span>
                <span className="font-black text-emerald-400 text-lg">{reservationForm.profit.toFixed(2)} лв.</span>
              </div>
              
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Платен Депозит?</label>
                   <input type="checkbox" name="depositPaid" checked={reservationForm.depositPaid} onChange={handleFormChange} className="w-5 h-5 rounded-lg border-none bg-slate-800 text-emerald-500 focus:ring-0" />
                </div>
                {reservationForm.depositPaid && (
                   <input type="number" name="depositAmount" placeholder="Сума на депозит" value={reservationForm.depositAmount} onChange={handleFormChange} className="w-full bg-slate-800 rounded-xl p-2 text-xs outline-none border-none text-white font-bold" />
                )}
              </div>
            </div>
          </div>

          {/* Асоциации и Статус */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Landmark size={18} className="text-blue-500" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Асоциация и Статус</p>
            </div>
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Тур Оператор</label>
                  <input type="text" name="tourOperator" placeholder="Напр. АБВ Турс" value={reservationForm.tourOperator} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Връзка с Тур (ID)</label>
                  <select name="linkedTourId" value={reservationForm.linkedTourId} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-bold text-blue-600">
                    <option value="">-- Самостоятелна резервация --</option>
                    {tours.map(tour => <option key={tour.id} value={tour.tourId}>{tour.tourId} - {tour.hotel}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Статус</label>
                  <select name="status" value={reservationForm.status} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none border-none font-black text-blue-600 uppercase">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
