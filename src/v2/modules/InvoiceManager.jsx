import React, { useState } from 'react';

const FIXED_RATE = 1.95583;

const InvoiceManager = () => {
    const [priceEUR, setPriceEUR] = useState(0);

    // Автоматично смятане на лева
    const priceBGN = (priceEUR * FIXED_RATE).toFixed(2);

    return (
        <div className="p-8 bg-slate-50 min-height-screen">
            <h1 className="text-3xl font-bold text-blue-900 mb-6">Нова Фактура (v2 - EUR)</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-md max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Въведи сума в ЕВРО:
                </label>
                <input 
                    type="number" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00 €"
                    onChange={(e) => setPriceEUR(parseFloat(e.target.value) || 0)}
                />

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-blue-800 font-semibold text-lg">
                        Общо: {priceEUR.toFixed(2)} €
                    </p>
                    <p className="text-blue-600 text-sm italic">
                        Равностойност: {priceBGN} лв. (курс {FIXED_RATE})
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvoiceManager;
