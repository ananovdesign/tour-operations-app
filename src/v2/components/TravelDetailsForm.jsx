import React from 'react';

const TravelDetailsForm = ({ details, onChange }) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm mt-4">
      <h3 className="font-bold text-slate-800 mb-3 border-b pb-1">Детайли за пътуването</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label className="text-xs font-medium text-gray-500">Маршрут</label>
          <input 
            className="w-full p-2 border rounded" 
            placeholder="напр. София - Истанбул - София"
            value={details.route || ''}
            onChange={(e) => onChange('route', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Дата на тръгване</label>
          <input type="date" className="w-full p-2 border rounded" value={details.startDate || ''} onChange={(e) => onChange('startDate', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Дата на връщане</label>
          <input type="date" className="w-full p-2 border rounded" value={details.endDate || ''} onChange={(e) => onChange('endDate', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Транспорт</label>
          <select className="w-full p-2 border rounded" value={details.transportType || ''} onChange={(e) => onChange('transportType', e.target.value)}>
            <option value="bus">Автобус</option>
            <option value="flight">Самолет</option>
            <option value="own">Собствен</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TravelDetailsForm;
