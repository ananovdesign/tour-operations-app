import React from 'react';

const EntityDataForm = ({ title, data, onChange, readOnly = false }) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-3 border-b pb-1">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">Име на фирма / Лице</label>
          <input 
            className="w-full p-2 border rounded bg-slate-50" 
            value={data.name || ''} 
            onChange={(e) => onChange('name', e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">ЕИК / Булстат</label>
          <input 
            className="w-full p-2 border rounded" 
            value={data.idNum || ''} 
            onChange={(e) => onChange('idNum', e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">МОЛ</label>
          <input 
            className="w-full p-2 border rounded" 
            value={data.mol || ''} 
            onChange={(e) => onChange('mol', e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">Адрес</label>
          <input 
            className="w-full p-2 border rounded" 
            value={data.address || ''} 
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default EntityDataForm;
