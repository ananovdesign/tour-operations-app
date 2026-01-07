import React from 'react';
import { Edit2, Trash2, Printer, PlusCircle } from 'lucide-react';

const ReservationsPage = ({
    reservations,
    reservationForm,
    editingReservation,
    handleReservationFormChange,
    handleReservationSubmit,
    handleEditReservation,
    handleDeleteReservation,
    setReservationForm,
    setEditingReservation,
    setTab,
    setPrintData
}) => {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
                Управление на Резервации
            </h2>

            {/* Форма за добавяне/редактиране */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {editingReservation ? 'Редактиране на Резервация' : 'Създаване на Нова Резервация'}
                </h3>
                <form onSubmit={handleReservationSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Хотел"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.hotel}
                        onChange={(e) => handleReservationFormChange('hotel', e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Име на Гост"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.guestName}
                        onChange={(e) => handleReservationFormChange('guestName', e.target.value)}
                        required
                    />
                    <input
                        type="date"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.checkIn}
                        onChange={(e) => handleReservationFormChange('checkIn', e.target.value)}
                        required
                    />
                    <input
                        type="date"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.checkOut}
                        onChange={(e) => handleReservationFormChange('checkOut', e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Възрастни"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.adults}
                        onChange={(e) => handleReservationFormChange('adults', e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Деца"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.children}
                        onChange={(e) => handleReservationFormChange('children', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Тип стая"
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.roomType}
                        onChange={(e) => handleReservationFormChange('roomType', e.target.value)}
                    />
                    <select
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={reservationForm.status}
                        onChange={(e) => handleReservationFormChange('status', e.target.value)}
                    >
                        <option value="Confirmed">Потвърдена</option>
                        <option value="Pending">Изчакваща</option>
                        <option value="Cancelled">Анулирана</option>
                    </select>
                    
                    <div className="lg:col-span-4 flex gap-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                        >
                            <PlusCircle size={20} />
                            {editingReservation ? 'Обнови Резервация' : 'Запази Резервация'}
                        </button>
                        {editingReservation && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingReservation(null);
                                    setReservationForm({
                                        hotel: '', guestName: '', checkIn: '', checkOut: '',
                                        adults: 2, children: 0, roomType: '', status: 'Confirmed',
                                        totalPrice: 0, paidAmount: 0
                                    });
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition shadow-md"
                            >
                                Отказ
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Таблица с резервации */}
            <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Хотел / Гост</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Период</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Детайли</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Статус</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reservations.map((res) => (
                            <tr key={res.id} className="hover:bg-gray-50 transition duration-150">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{res.hotel}</div>
                                    <div className="text-sm text-gray-500">{res.guestName}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div>{res.checkIn}</div>
                                    <div className="text-gray-400">до {res.checkOut}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div>{res.roomType}</div>
                                    <div className="text-xs">{res.adults} възр. / {res.children} деца</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        res.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                        res.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {res.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => {
                                            setPrintData(res);
                                            setTab('VoucherPrint');
                                        }}
                                        className="text-purple-600 hover:text-purple-900 p-1 transition"
                                        title="Печат на Ваучер"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEditReservation(res)}
                                        className="text-blue-600 hover:text-blue-900 p-1 transition"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReservation(res.id)}
                                        className="text-red-600 hover:text-red-900 p-1 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReservationsPage;
