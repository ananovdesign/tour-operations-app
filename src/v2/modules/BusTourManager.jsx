import React, { useState } from 'react';
import CurrencyPriceInput from '../components/CurrencyPriceInput';

const BusTourManager = () => {
  const [tour, setTour] = useState({
    routeName: '',
    busPlate: 'PA0472MB', // От твоя шаблон
    busModel: 'BOVA FUTURA',
    distanceKm: 0,
    priceEUR: 0,
    driverName: ''
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">🚌 Създаване на Автобусен Тур</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          className="p-2 border rounded md:col-span-2" 
          placeholder="Маршрут (напр. Ракитово - Истанбул)"
          value={tour.routeName}
          onChange={(e) => setTour({...tour, routeName: e.target.value})}
        />
        <input 
          className="p-2 border rounded" 
          placeholder="Регистрационен номер"
          value={tour.busPlate}
          onChange={(e) => setTour({...tour, busPlate: e.target.value})}
        />
        <input 
          className="p-2 border rounded" 
          placeholder="Километри"
          type="number"
          onChange={(e) => setTour({...tour, distanceKm: e.target.value})}
        />
        <CurrencyPriceInput 
          label="Цена на транспортната услуга (EUR)" 
          value={tour.priceEUR} 
          onChange={(val) => setTour({...tour, priceEUR: val})} 
        />
        <button className="bg-blue-600 text-white p-3 rounded-lg font-bold md:col-span-2 hover:bg-blue-700">
          Генерирай Договор за Транспорт
        </button>
      </div>
    </div>
  );
};

export default BusTourManager;
