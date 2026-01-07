import React from 'react';

export const NotificationDisplay = ({ notifications, onDismiss }) => (
  <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm">
    {notifications.map(n => (
      <div key={n.id} className={`p-4 rounded-lg shadow-md flex items-center justify-between transition-all ${
        n.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'
      }`}>
        <p className="text-sm font-medium">{n.message}</p>
        <button onClick={() => onDismiss(n.id)} className="ml-4 text-gray-400 hover:text-gray-600">×</button>
      </div>
    ))}
  </div>
);

export const ConfirmationModal = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold mb-4">{message}</h3>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Отказ</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold">Потвърждавам</button>
        </div>
      </div>
    </div>
  );
};
