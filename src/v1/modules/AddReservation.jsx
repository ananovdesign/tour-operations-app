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

  // Функция, която намира последния номер в базата и добавя +1
  const getNextReservationNumber = () => {
    if (!reservations || reservations.length === 0) return 'dyt100001';
    
    const numbers = reservations
      .map(r => r.reservationNumber)
      .filter(n => n && typeof n === 'string' && n.startsWith('dyt'))
      .map(n => parseInt(n.replace('dyt', ''), 10))
      .filter(n => !isNaN(n));

    if (numbers.length === 0) return 'dyt100001';
    
    const lastNumber = Math.max(...numbers);
    return `dyt${lastNumber + 1}`;
  };

  const [reservationForm, setReservationForm] = useState({
    creationDate: new Date().toISOString().split('T')[0],
    reservationNumber: getNextReservationNumber(),
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

  // Актуализираме номера, ако резервациите се заредят по-късно
  useEffect(() => {
    setReservationForm(prev => ({
      ...prev,
      reservationNumber: getNextReservationNumber()
    }));
  }, [reservations]);

  // Изчисления за печалба и нощувки
  useEffect(() => {
    let calculatedNights = 0;
    if (reservationForm.checkIn && reservationForm.checkOut) {
      const start = new Date(reservationForm.checkIn);
      const end = new Date(reservationForm.checkOut);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedNights = diffDays > 0 ? diffDays : 0;
    }

    const profit = Number(reservationForm.finalAmount || 0) - 
                   Number(reservationForm.owedToHotel || 0) - 
                   Number(reservationForm.approxTransportCost || 0);

    setReservationForm(prev => ({ 
      ...prev, 
      profit: profit,
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
      mode, firstName: '', fatherName: '', familyName: '', 
      id: '', realId: '', address: '', city: '', postCode: '', email: '', phone: '' 
    };
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  // ВРЪЗКА С КЛИЕНТ - фиксирана
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
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> {lang === 'bg' ? 'Назад' : 'Back'}
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
          Резервация #{reservationForm.reservationNumber}
        </h1>
        <button 
          onClick={() => handleSubmitReservation(reservationForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]"
        >
          <Save size={16} /> {loading ? '...' : (lang === 'bg' ? 'Запази' : 'Save')}
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
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Хотел</label>
                <input type="text" name="hotel" value={reservationForm.hotel} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Дестинация</label>
                <input type="text" name="place" value={reservationForm.place} onChange={handleFormChange} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm outline-none" />
              </div>
              <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold outline-none" />
              <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-sm font-bold outline-none" />
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex flex-col justify-center items-center font-black text-blue-500 text-[10px]">
                {reservationForm.nights} НОЩУВКИ
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
              <button type="button" onClick={addTourist} className="bg-blue-600 text-white p-2 rounded-full hover:scale-110 transition-transform"><Plus size={16} /></button>
            </div>

            <div className="space-y-6">
              {reservationForm.tourists.map((tourist, index) => (
                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500">Турист {index + 1}</span>
                    <div className="flex gap-2">
                      <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                        <button type="button" onClick={() => handleTouristModeChange(index, 'new')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${tourist.mode === 'new' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>НОВ</button>
                        <button type="button" onClick={() => handleTouristModeChange(index, 'existing')} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${tourist.mode === 'existing' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>КЛИЕНТ</button>
                      </div>
                      {reservationForm.tourists.length > 1 && <button type="button" onClick={() => removeTourist(index)} className="text-red-400"><Trash2 size={16}/></button>}
                    </div>
                  </div>

                  {tourist.mode === 'existing' ? (
                    <select 
                      value={tourist.id || ''} 
                      onChange={(e) => handleExistingTouristSelect(index, e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-sm font-bold outline-none"
                    >
                      <option value="">-- Избери клиент --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.familyName} ({c.realId})</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" name="firstName" placeholder="Име" value={tourist.firstName} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="fatherName" placeholder="Презиме" value={tourist.fatherName} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="familyName" placeholder="Фамилия" value={tourist.familyName} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold outline-none" />
                      <input type="text" name="realId" placeholder="ЕГН" value={tourist.realId} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm font-bold text-blue-600 outline-none" />
                      <input type="email" name="email" placeholder="Email" value={tourist.email} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm outline-none" />
                      <input type="text" name="phone" placeholder="Телефон" value={tourist.phone} onChange={(e)=>handleTouristChange(index,e)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-sm outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Финанси и Връзка с Тур */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-6 text-emerald-400 font-black uppercase text-[10px] tracking-widest">
              <CreditCard size={18} /> Финанси
            </div>
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
            <div className="flex items-center gap-2 mb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <Landmark size={18} /> Връзка с Тур
            </div>
            <select 
              name="linkedTourId" 
              value={reservationForm.linkedTourId} 
              onChange={handleFormChange} 
              className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm font-black text-blue-600 outline-none"
            >
              <option value="">-- Самостоятелна --</option>
              {tours.map(t => <option key={t.id} value={t.tourId}>{t.tourId} - {t.hotel}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
