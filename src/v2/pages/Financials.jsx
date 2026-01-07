import React from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialsPage = ({
    financialEntries,
    entryForm,
    handleEntryFormChange,
    handleEntrySubmit,
    handleDeleteEntry
}) => {
    // Изчисляване на статистиката (Логика от App.jsx)
    const income = financialEntries
        .filter(e => e.type === 'Income')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const expenses = financialEntries
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const balance = income - expenses;

    const chartData = [
        { name: 'Приходи', сума: income },
        { name: 'Разходи', сума: expenses },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
                Финансово Управление
            </h2>

            {/* Обобщаващи карти и Графика */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium uppercase">Приходи</p>
                                <h3 className="text-2xl font-bold text-green-700">{income.toFixed(2)} лв.</h3>
                            </div>
                            <TrendingUp className="text-green-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium uppercase">Разходи</p>
                                <h3 className="text-2xl font-bold text-red-700">{expenses.toFixed(2)} лв.</h3>
                            </div>
                            <TrendingDown className="text-red-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium uppercase">Баланс</p>
                                <h3 className="text-2xl font-bold text-blue-700">{balance.toFixed(2)} лв.</h3>
                            </div>
                            <Wallet className="text-blue-500" size={32} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100 min-h-[300px]">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Визуализация на потоците</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Legend />
                            <Bar dataKey="сума" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Форма за нов запис */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">Добавяне на трансакция</h3>
                <form onSubmit={handleEntrySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Описание"
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={entryForm.description}
                        onChange={(e) => handleEntryFormChange('description', e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Сума"
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={entryForm.amount}
                        onChange={(e) => handleEntryFormChange('amount', e.target.value)}
                        required
                    />
                    <select
                        className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={entryForm.type}
                        onChange={(e) => handleEntryFormChange('type', e.target.value)}
                    >
                        <option value="Income">Приход</option>
                        <option value="Expense">Разход</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-bold shadow-sm"
                    >
                        <PlusCircle size={20} /> Добави
                    </button>
                </form>
            </div>

            {/* Списък с записи */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Описание</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Тип</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Сума</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {financialEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-gray-800 font-medium">{entry.description}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        entry.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {entry.type === 'Income' ? 'Приход' : 'Разход'}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 font-bold ${
                                    entry.type === 'Income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {entry.type === 'Income' ? '+' : '-'}{parseFloat(entry.amount).toFixed(2)} лв.
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        className="text-red-400 hover:text-red-600 p-1 transition"
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

export default FinancialsPage;
