import React, { useState } from 'react';
import { ArrowLeft, Save, UserPlus, Calendar, CreditCard } from 'lucide-react';

const AddReservation = ({ onBack, lang }) => {
  const t = {
    bg: { title: "Нова Резервация", back: "Назад", save: "Запази" },
    en: { title: "New Reservation", back: "Back", save: "Save" }
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
        {/* Тук ще добавяме секциите една по една */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 font-black uppercase text-[10px] mb-4 tracking-widest">Основна информация</p>
              {/* Формата започва тук */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Инпути */}
              </div>
           </div>
        </div>
        
        {/* Страничен панел за суми и статус */}
        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
              <p className="text-blue-400 font-black uppercase text-[10px] mb-4 tracking-widest">Резюме на плащането</p>
              {/* Суми */}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AddReservation;
