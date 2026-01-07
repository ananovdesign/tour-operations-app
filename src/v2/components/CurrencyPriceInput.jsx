import React from 'react';

const FIXED_RATE = 1.95583;

const CurrencyPriceInput = ({ label, value, onChange }) => {
  const bgnEquivalent = (value * FIXED_RATE).toFixed(2);

  return (
    <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full p-2 border rounded-md pr-12 focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">EUR</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500 italic">
        Равностойност: {bgnEquivalent} BGN
      </p>
    </div>
  );
};

export default CurrencyPriceInput;
