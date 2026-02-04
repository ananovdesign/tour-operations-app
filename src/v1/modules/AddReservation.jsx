import React, { useState } from 'react';
import { ArrowLeft, Save, UserPlus, Calendar, CreditCard } from 'lucide-react';

const AddReservation = ({ onBack, lang = 'bg' }) => {
  const t = {
    bg: { 
      title: "Нова Резервация", 
      back: "Назад", 
      save: "Запази",
      basicInfo: "Основна информация",
      paymentSummary: "Резюме на плащането"
    },
    en: { 
      title: "New Reservation", 
      back: "Back", 
      save: "Save",
      basicInfo: "Basic Information",
      paymentSummary: "Payment Summary"
    }
  }[lang];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={18} /> {t.back}
        </button>
        
        <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
          {t.title}
        </h1>
        
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black uppercase text-[10px]">
          <Save size={16} /> {t.save}
        </button>
      </div>

      {/* Контейнер за формата */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Основна част (Лява колона) */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 font-black uppercase text-[10px] mb-4 tracking-widest">
                {t.basicInfo}
              </p>
              
              {/* Място за твоите инпути - тук можеш да редиш останалия код */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Клиент</label>
                    <div className="relative">
                       <span className="absolute left-4 top-3.5 text-slate-300"><UserPlus size={18}/></span>
                       <input 
                         type="text" 
                         className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                         placeholder="Име на клиент..."
                       />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Дата</label>
                    <div className="relative">
                       <span className="absolute left-4 top-3.5 text-slate-300"><Calendar size={18}/></span>
                       <input 
                         type="date" 
                         className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                    </div>
                 </div>
              </div>
           </div>
        </div>
        
        {/* Страничен панел (Дясна колона) */}
        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
              <p className="text-blue-400 font-black uppercase text-[10px] mb-4 tracking-widest">
                {t.paymentSummary}
              </p>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <span className="text-slate-400 text-xs">Междинна сума</span>
                    <span className="font-bold text-lg">0.00 лв.</span>
                 </div>
                 
                 <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-2xl">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                       <CreditCard size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-500 leading-none">Начин на плащане</p>
                       <p className="text-xs font-bold mt-1">В брой / Карта</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AddReservation;
