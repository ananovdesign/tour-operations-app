import React, { useState } from 'react';
import { ArrowLeft, Save, UserPlus, Calendar, CreditCard, Trash2, Plus, Info, Landmark } from 'lucide-react';

const AddReservation = ({ 
  onBack, 
  lang = 'bg', 
  selectedReservation = null, 
  reservationForm, 
  handleReservationFormChange, 
  handleTouristChange, 
  handleTouristModeChange, 
  handleExistingTouristSelect, 
  addTourist, 
  removeTourist, 
  handleSubmitReservation,
  tours = [],
  customers = [],
  loading = false
}) => {
  
  const t = {
    bg: { title: "Нова Резервация", editTitle: "Редакция на резервация", back: "Назад", save: "Запази", basic: "Основна информация", association: "Асоциация с тур", tourists: "Данни за туристите", financial: "Финансова информация" },
    en: { title: "New Reservation", editTitle: "Edit Reservation", back: "Back", save: "Save", basic: "Basic Information", association: "Tour Association", tourists: "Tourist Details", financial: "Financial Info" }
  }[lang];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <button 
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={18} /> {t.back}
        </button>
        
        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
          {selectedReservation ? t.editTitle : t.title}
        </h1>
        
        <button 
          onClick={handleSubmitReservation}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50"
        >
          <Save size={16} /> {loading ? '...' : t.save}
        </button>
      </div>

      <form onSubmit={handleSubmitReservation} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Лява страна: Основна форма */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Секция 1: Основна информация */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Info size={18} className="text-blue-500" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{t.basic}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Creation Date</label>
                <input type="date" name="creationDate" value={reservationForm.creationDate} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Reservation Number</label>
                <input type="text" name="reservationNumber" value={reservationForm.reservationNumber} onChange={handleReservationFormChange} disabled={!!selectedReservation} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm outline-none opacity-70" placeholder="Auto-generated" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Hotel</label>
                <input type="text" name="hotel" value={reservationForm.hotel} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tour Type</label>
                <select name="tourType" value={reservationForm.tourType} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="PARTNER">PARTNER</option>
                  <option value="HOTEL ONLY">HOTEL ONLY</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Check-In</label>
                <input type="date" name="checkIn" value={reservationForm.checkIn} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Check-Out</label>
                <input type="date" name="checkOut" value={reservationForm.checkOut} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>
          </div>

          {/* Секция 2: Туристи (Динамичен списък) */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{t.tourists}</p>
              </div>
              <button type="button" onClick={addTourist} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {reservationForm.tourists.map((tourist, index) => (
                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Турист {index + 1}</span>
                    <div className="flex gap-2">
                       <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                          <button type="button" onClick={() => handleTouristModeChange(index, 'new')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${tourist.mode === 'new' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}>NEW</button>
                          <button type="button" onClick={() => handleTouristModeChange(index, 'existing')} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${tourist.mode === 'existing' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}>EXISTING</button>
                       </div>
                       {reservationForm.tourists.length > 1 && (
                         <button type="button" onClick={() => removeTourist(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                       )}
                    </div>
                  </div>

                  {tourist.mode === 'existing' ? (
                    <select value={tourist.id || ''} onChange={(e) => handleExistingTouristSelect(index, e.target.value)} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-sm outline-none">
                      <option value="">-- Избор на клиент --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.familyName}</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" name="firstName" placeholder="Име" value={tourist.firstName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none" />
                      <input type="text" name="familyName" placeholder="Фамилия" value={tourist.familyName} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none" />
                      <input type="text" name="realId" placeholder="ЕГН/ЛНЧ" value={tourist.realId} onChange={(e) => handleTouristChange(index, e)} className="bg-white dark:bg-slate-900 border-none rounded-xl py-2 px-4 text-sm outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Дясна страна: Финанси и Асоциации */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard size={18} className="text-emerald-400" />
              <p className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">{t.financial}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-bold uppercase">Final Amount</span>
                <input type="number" name="finalAmount" value={reservationForm.finalAmount} onChange={handleReservationFormChange} className="bg-transparent text-right font-black text-xl outline-none w-24 text-emerald-400" />
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-bold uppercase">Owed Hotel</span>
                <input type="number" name="owedToHotel" value={reservationForm.owedToHotel} onChange={handleReservationFormChange} className="bg-transparent text-right font-bold outline-none w-24" />
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                <span className="text-emerald-400 text-[10px] font-black uppercase">Profit</span>
                <span className="font-black text-emerald-400">{Number(reservationForm.profit).toFixed(2)} лв.</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="depositPaid" id="depositPaid" checked={reservationForm.depositPaid} onChange={handleReservationFormChange} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500" />
                <label htmlFor="depositPaid" className="text-xs font-bold text-slate-300 uppercase">Deposit Paid</label>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Landmark size={18} className="text-blue-500" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{t.association}</p>
            </div>
            <div className="space-y-4">
               <select name="linkedTourId" value={reservationForm.linkedTourId} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none">
                  <option value="">-- Свържи с тур --</option>
                  {tours.map(tour => <option key={tour.id} value={tour.tourId}>{tour.tourId} - {tour.hotel}</option>)}
               </select>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Status</label>
                  <select name="status" value={reservationForm.status} onChange={handleReservationFormChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm outline-none font-bold text-blue-600">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
               </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddReservation;
