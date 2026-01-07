import React from 'react';
import { Plus, Trash2, FileText, Send } from 'lucide-react';

const InvoicesPage = ({
    invoices,
    invoiceForm,
    handleInvoiceFormChange,
    handleProductChange,
    addProductRow,
    removeProductRow,
    handleSubmitInvoice,
    handleDeleteInvoice,
    setTab,
    setInvoicePrintData
}) => {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
                Управление на Фактури
            </h2>

            {/* Форма за нова фактура */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
                    <Plus size={24} /> Нова Фактура
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Номер на фактура</label>
                        <input
                            type="text"
                            className="mt-1 w-full p-2 border rounded-md"
                            value={invoiceForm.invoiceNumber}
                            onChange={(e) => handleInvoiceFormChange('invoiceNumber', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Дата</label>
                        <input
                            type="date"
                            className="mt-1 w-full p-2 border rounded-md"
                            value={invoiceForm.invoiceDate}
                            onChange={(e) => handleInvoiceFormChange('invoiceDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Клиент (Име)</label>
                        <input
                            type="text"
                            className="mt-1 w-full p-2 border rounded-md"
                            value={invoiceForm.clientName}
                            onChange={(e) => handleInvoiceFormChange('clientName', e.target.value)}
                        />
                    </div>
                </div>

                {/* Секция Продукти/Услуги */}
                <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Услуги / Продукти</h4>
                    <div className="space-y-3">
                        {invoiceForm.products.map((product, index) => (
                            <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-end border-b pb-3 md:border-none">
                                <div className="flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Описание"
                                        className="w-full p-2 border rounded"
                                        value={product.productName}
                                        onChange={(e) => handleProductChange(index, 'productName', e.target.value)}
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        placeholder="Кол."
                                        className="w-full p-2 border rounded"
                                        value={product.quantity}
                                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        placeholder="Цена"
                                        className="w-full p-2 border rounded"
                                        value={product.price}
                                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => removeProductRow(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addProductRow}
                        className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <Plus size={18} /> Добави ред
                    </button>
                </div>

                <button
                    onClick={handleSubmitInvoice}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                    <Send size={20} /> Генерирай Фактура
                </button>
            </div>

            {/* Списък с издадени фактури */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No / Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сума</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{inv.invoiceNumber}</div>
                                    <div className="text-sm text-gray-500">{inv.invoiceDate}</div>
                                </td>
                                <td className="px-6 py-4">{inv.clientName}</td>
                                <td className="px-6 py-4 font-semibold text-green-700">
                                    {inv.grandTotal?.toFixed(2)} лв.
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button
                                        onClick={() => {
                                            setInvoicePrintData(inv);
                                            setTab('InvoicePrint');
                                        }}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Печат"
                                    >
                                        <FileText size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteInvoice(inv.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={20} />
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

export default InvoicesPage;
