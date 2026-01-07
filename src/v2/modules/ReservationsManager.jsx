import React, { useState } from 'react';
import CurrencyPriceInput from '../components/CurrencyPriceInput';

const ReservationsManager = () => {
  const [res, setRes] = useState({
    clientName: '',
    hotel: '',
    priceEUR: 0,
    status: 'Pending'
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Нова Резервация</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="p-2 border rounded" 
            placeholder="Име на клиент" 
            onChange={(e) => setRes({...res, clientName: e.target.value})}
          />
          <input 
            className="p-2 border rounded" 
            placeholder="Хотел" 
            onChange={(e) => setRes({...res, hotel: e.target.value})}
          />
          <CurrencyPriceInput 
            label="Пакетна цена (EUR)" 
            value={res.priceEUR} 
            onChange={(val) => setRes({...res, priceEUR: val})} 
          />
          <select 
            className="p-2 border rounded"
            onChange={(e) => setRes({...res, status: e.target.value})}
          >
            <option value="Pending">Изчакваща</option>
            <option value="Confirmed">Потвърдена</option>
            <option value="Cancelled">Анулирана</option>
          </select>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
          Запази Резервация
        </button>
      </div>
    </div>
  );
};

export default ReservationsManager;
