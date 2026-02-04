import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserPlus, Calendar, CreditCard, Trash2, Plus, Info, Landmark } from 'lucide-react';

const AddReservation = ({ onBack, lang = 'bg', selectedReservation = null, tours = [], customers = [] }) => {
  // Вграждаме състоянието директно тук
  const [reservationForm, setReservationForm] = useState({
    creationDate: '',
    reservationNumber: '',
    tourType: 'HOTEL ONLY',
    hotel: '',
    food: '',
    roomType: '',
    place: '',
    checkIn: '',
    checkOut: '',
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
    profit: 0,
    tourOperator: '',
    status: 'Pending',
    linkedTourId: '',
    approxTransportCost: 0,
  });

  // Автоматично изчисляване на печалбата (Profit)
  useEffect(() => {
    const profit = Number(reservationForm.finalAmount) - Number(reservationForm.owedToHotel);
    setReservationForm(prev => ({ ...prev, profit: profit }));
  }, [reservationForm.finalAmount, reservationForm.owedToHotel]);

  // Функции за управление на формата
  const handleReservationFormChange = (e) => {
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
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const addTourist = () => {
    setReservationForm(prev => ({
      ...prev,
      tourists: [...prev.tourists, { mode: 'new', firstName: '', familyName: '', id: '' }]
    }));
  };

  const removeTourist = (index) => {
    const newTourists = reservationForm.tourists.filter((_, i) => i !== index);
    setReservationForm(prev => ({ ...prev, tourists: newTourists }));
  };

  const t = {
    bg: { title: "Нова Резервация", back: "Назад", save: "Запази", basic: "Основна информация", tourists: "Данни за туристите", financial: "Финанси" },
    en: { title: "New Reservation", back: "Back", save: "Save", basic: "Basic Information", tourists: "Tourist Details", financial: "Financial Info" }
  }[lang];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> {t.back}
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t.title}</h1>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]">
          <Save size={16} /> {t.save}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Лява колона */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-[10px] mb-6 tracking-widest">{t.basic}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" name="creationDate" value={reservationForm.creationDate} onChange={handleReservationFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" name="hotel" placeholder="Хотел" value={reservationForm.hotel} onChange={handleReservationFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleReservationFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleReservationFormChange} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{t.tourists}</p>
              <button type="button" onClick={addTourist} className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"><Plus size={16} /></button>
            </div>
            {reservationForm.tourists.map((tourist, index) => (
              <div key={index} className="mb-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-blue-500 uppercase">Турист {index + 1}</span>
                  {reservationForm.tourists.length > 1 && (
                    <button type="button" onClick={() => removeTourist(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" name="firstName" placeholder="Име" value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none" />
                  <input type="text" name="familyName" placeholder="Фамилия" value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 rounded-xl p-2 text-sm outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Дясна колона */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <p className="text-emerald-400 font-black uppercase text-[10px] mb-6 tracking-widest">{t.financial}</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-bold uppercase">Final Amount</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleReservationFormChange} className="bg-transparent text-right font-black text-xl outline-none w-24 text-emerald-400" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-bold uppercase">Owed Hotel</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleReservationFormChange} className="bg-transparent text-right font-bold outline-none w-24 text-white" />
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] font-black uppercase">Profit</span>
                <span className="font-black text-emerald-400 text-lg">{reservationForm.profit.toFixed(2)} лв.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
