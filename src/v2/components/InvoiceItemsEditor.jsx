import React from 'react';

const InvoiceItemsEditor = ({ items, setItems }) => {
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800">Артикули / Услуги</h3>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-end border-b pb-4">
          <div className="flex-grow">
            <label className="text-xs text-gray-500">Описание</label>
            <input
              className="w-full p-2 border rounded"
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-500">Кол.</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="w-32">
            <label className="text-xs text-gray-500">Цена (EUR)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={item.price}
              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
            />
          </div>
          <button 
            onClick={() => removeItem(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
          >
            ✕
          </button>
        </div>
      ))}
      <button 
        onClick={addItem}
        className="text-blue-600 font-medium hover:underline"
      >
        + Добави нов ред
      </button>
    </div>
  );
};

export default InvoiceItemsEditor;
