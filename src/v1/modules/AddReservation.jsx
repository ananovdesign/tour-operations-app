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

  // 1. ПОПРАВКА: Генериране на номер (Старт от 100292)
  const generateNextResNumber = () => {
    const START_NUM = 100292;
    if (!reservations || reservations.length === 0) return `dyt${START_NUM}`;
    
    const numericParts = reservations
      .map(r => r.reservationNumber)
      .filter(n => n && n.startsWith('dyt'))
      .map(n => parseInt(n.replace('dyt', '')))
      .filter(n => !isNaN(n));

    if (numericParts.length === 0) return `dyt${START_NUM}`;
    const maxNum = Math.max(...numericParts);
    return `dyt${Math.max(maxNum + 1, START_NUM)}`;
  };

  const [reservationForm, setReservationForm] = useState({
    creationDate: new Date().toISOString().split('T')[0],
    reservationNumber: '', 
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

  // Инициализиране на номера при зареждане
  useEffect(() => {
    setReservationForm(prev => ({
      ...prev,
      reservationNumber: generateNextResNumber()
    }));
  }, [reservations]);

  // 2. Автоматични изчисления: Печалба и Нощувки
  useEffect(() => {
    let calculatedNights = 0;
    if (reservationForm.checkIn && reservationForm.checkOut) {
      const start = new Date(reservationForm.checkIn);
      const end = new Date(reservationForm.checkOut);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      calculatedNights = diffDays > 0 ? diffDays : 0;
    }

    const calculatedProfit = Number(reservationForm.finalAmount || 0) - 
                             Number(reservationForm.owedToHotel || 0) - 
                             Number(reservationForm.approxTransportCost || 0);

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
      mode: mode,
      firstName: '', fatherName: '', familyName: '',
      id: '', realId: '', address: '', city: '', 
      postCode: '', email: '', phone: ''
    };
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  // 3. ПОПРАВКА: Избор на клиент (Customer)
  const handleExistingTouristSelect = (index, customerId) => {
    const customer = customers.find(c => (c.id === customerId || c.uid === customerId));
    if (customer) {
      const newTourists = [...reservationForm.tourists];
      newTourists[index] = { 
        ...customer, 
        id: customer.id || customer.uid || '',
        mode: 'existing' 
      };
      setReservationForm(prev => ({ ...prev, tourists: newTourists }));
    }
  };

  const addTourist = () => {
    setReservationForm(prev => ({
      ...prev,
      tourists: [...prev.tourists, { 
        mode: 'new', firstName: '', fatherName: '', familyName: '', 
        id: '', realId: '', address: '', city: '', postCode: '', 
        email: '', phone: '' 
      }]
    }));
  };

  const removeTourist = (index) => {
    if (reservationForm.tourists.length > 1) {
      setReservationForm(prev => ({
        ...prev,
        tourists: prev.tourists.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-bold">
          <ArrowLeft size={20} /> {lang === 'bg' ? 'Назад' : 'Back'}
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
            Резервация #{reservationForm.reservationNumber}
          </h1>
        </div>
        <button 
          onClick={() => handleSubmitReservation(reservationForm)}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-black uppercase text-xs transition-all"
        >
          <Save size={18} /> {loading ? '...' : (lang === 'bg' ? 'Запази' : 'Save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Информация за престоя */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Hotel size={18} className="text-blue-500" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Информация за престоя</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Хотел</label>
                <input type="text" name="hotel" value={reservationForm.hotel} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Град</label>
                <input type="text" name="place" value={reservationForm.place} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none" />
              </div>
              <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none" />
              <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none" />
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex flex-col justify-center items-center">
                <span className="text-[9px] font-black uppercase text-blue-500">{reservationForm.nights} нощувки</span>
              </div>
            </div>
          </div>

          {/* Секция Туристи */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Туристи</p>
              </div>
              <button onClick={addTourist} className="bg-blue-600 text-white p-2 rounded-full hover:scale-110 transition-transform"><Plus size={18} /></button>
            </div>

            <div className="space-y-6">
              {reservationForm.tourists.map((t, idx) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500">Турист {idx + 1}</span>
                    <div className="flex gap-2">
                      <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                        <button onClick={() => handleTouristModeChange(idx, 'new')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${t.mode === 'new' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}>НОВ</button>
                        <button onClick={() => handleTouristModeChange(idx, 'existing')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${t.mode === 'existing' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}>КЛИЕНТ</button>
                      </div>
                      {reservationForm.tourists.length > 1 && <button onClick={() => removeTourist(idx)} className="text-red-400"><Trash2 size={18}/></button>}
                    </div>
                  </div>

                  {t.mode === 'existing' ? (
                    <select 
                      value={t.id || ''} 
                      onChange={(e) => handleExistingTouristSelect(idx, e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-sm font-bold border-none outline-none"
                    >
                      <option value="">-- Избери клиент от базата ({customers?.length || 0}) --</option>
                      {customers && customers.map(c => (
                        <option key={c.id || c.uid} value={c.id || c.uid}>
                          {c.firstName} {c.familyName} ({c.realId || 'Няма ЕГН'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" name="firstName" placeholder="Име" value={t.firstName} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="fatherName" placeholder="Презиме" value={t.fatherName} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="familyName" placeholder="Фамилия" value={t.familyName} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="realId" placeholder="ЕГН" value={t.realId} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none font-bold text-blue-600" />
                      <input type="email" name="email" placeholder="Email" value={t.email} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none" />
                      <input type="text" name="phone" placeholder="Телефон" value={t.phone} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none" />
                      <input type="text" name="city" placeholder="Град" value={t.city} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none" />
                      <input type="text" name="address" placeholder="Адрес" value={t.address} onChange={(e)=>handleTouristChange(idx,e)} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm outline-none col-span-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Дясна страна: Финанси и Връзка с Тур */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
            <p className="text-emerald-400 font-black uppercase text-[10px] mb-6 tracking-widest">Финанси</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black">ПРОДАЖНА</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleFormChange} className="bg-transparent text-right font-black text-xl text-emerald-400 outline-none w-24" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-[10px] font-black">КЪМ ХОТЕЛ</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleFormChange} className="bg-transparent text-right font-bold outline-none w-24" />
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] font-black">ПЕЧАЛБА</span>
                <span className="font-black text-emerald-400 text-lg">{reservationForm.profit.toFixed(2)} лв.</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] mb-4 tracking-widest">Връзка с Тур</p>
            <select 
              name="linkedTourId" 
              value={reservationForm.linkedTourId} 
              onChange={handleFormChange} 
              className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm font-black text-blue-600 outline-none border-none"
            >
              <option value="">-- Самостоятелна --</option>
              {tours && tours.map(tour => (
                <option key={tour.id || tour.tourId} value={tour.tourId || tour.id}>
                  {tour.tourId || 'Тур'} - {tour.hotel || tour.destination}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
