import React, { useState } from 'react';
import EntityDataForm from '../components/EntityDataForm';
import InvoiceItemsEditor from '../components/InvoiceItemsEditor';
import CurrencyPriceInput from '../components/CurrencyPriceInput';
import { dbService } from '../services/dbService';

// Данни по подразбиране за твоята фирма (Доставчик)
const DEFAULT_PROVIDER = {
  name: 'ДАЙНАМЕКС ТУР ЕООД',
  idNum: '201654158',
  mol: 'КРАСИМИР АНАНОВ',
  address: 'гр. Ракитово, ул. Бор 2',
  bank: 'ДСК',
  iban: 'BG...',
};

const InvoiceManager = () => {
  const [docType, setDocType] = useState('invoice'); // invoice, contract, voucher
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [client, setClient] = useState({ name: '', idNum: '', mol: '', address: '' });
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSave = async () => {
    const docData = {
      type: docType,
      provider,
      client,
      items,
      totalEUR: calculateTotal(),
      notes,
      date: new Date().toISOString()
    };
    
    try {
      const id = await dbService.saveDocument('invoices', docData);
      alert(`Документът е запазен с ID: ${id}. Вече можете да го принтирате.`);
    } catch (e) {
      alert("Грешка при запис.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ИЗБОР НА ТИП ДОКУМЕНТ */}
      <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button 
          onClick={() => setDocType('invoice')}
          className={`px-6 py-2 rounded-xl font-bold transition ${docType === 'invoice' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          📄 Фактура
        </button>
        <button 
          onClick={() => setDocType('contract')}
          className={`px-6 py-2 rounded-xl font-bold transition ${docType === 'contract' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          📜 Договор
        </button>
        <button 
          onClick={() => setDocType('voucher')}
          className={`px-6 py-2 rounded-xl font-bold transition ${docType === 'voucher' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          🎟️ Ваучер
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ЛЯВА КОЛОНА: ДАННИ */}
        <div className="space-y-6">
          <EntityDataForm 
            title="Доставчик / Изпълнител" 
            data={provider} 
            onChange={(field, val) => setProvider({...provider, [field]: val})} 
          />
          <EntityDataForm 
            title="Клиент / Получател" 
            data={client} 
            onChange={(field, val) => setClient({...client, [field]: val})} 
          />
        </div>

        {/* ДЯСНА КОЛОНА: АРТИКУЛИ И СУМИ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <InvoiceItemsEditor items={items} setItems={setItems} />
          
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Общо в ЕВРО:</span>
              <span className="text-2xl font-black text-slate-800">€ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-400 text-sm italic">Равностойност в BGN:</span>
              <span className="text-lg font-bold text-slate-500">{(calculateTotal() * 1.95583).toFixed(2)} лв.</span>
            </div>
            
            <textarea 
              className="w-full p-3 border rounded-xl bg-slate-50 text-sm mb-4" 
              placeholder="Допълнителни бележки / Основание за ДДС..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-4">
              <button 
                onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition"
              >
                💾 ЗАПАЗИ В БАЗАТА
              </button>
              <button 
                className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 shadow-lg shadow-slate-200 transition"
                onClick={() => window.print()}
              >
                🖨️ ПРИНТИРАЙ PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;
