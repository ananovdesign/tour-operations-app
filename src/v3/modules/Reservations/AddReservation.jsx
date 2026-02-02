import React, { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { db, appId } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Save, Calculator } from 'lucide-react';

const AddReservation = ({ userId, onClose }) => {
    const { EUR_TO_BGN, convert } = useCurrency();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        leadGuest: '',
        phone: '',
        email: '',
        destination: '',
        travelDate: '',
        totalAmount: 0,
        currency: 'BGN', // По подразбиране
        status: 'Confirmed',
        notes: ''
    });

    // Автоматично преизчисляване за визуализация
    const equivalentAmount = formData.currency === 'BGN' 
        ? (formData.totalAmount / EUR_TO_BGN).toFixed(2) + ' EUR'
        : (formData.totalAmount * EUR_TO_BGN).toFixed(2) + ' BGN';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const path = `artifacts/${appId}/users/${userId}/reservations`;
            await addDoc(collection(db, path), {
                ...formData,
                totalAmount: Number(formData.totalAmount),
                // Записваме и стойността в основната валута (EUR) за статистиките
                amountInEUR: formData.currency === 'EUR' 
                    ? Number(formData.totalAmount) 
                    : Number(formData.totalAmount) / EUR_TO_BGN,
                createdAt: serverTimestamp(),
                reservationNumber: `RES-${Date.now().toString().slice(-6)}`
            });
            onClose();
        } catch (error) {
            console.error("Грешка при запис:", error);
            alert("Възникна грешка при запазването.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">Нова Резервация</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* СЕКЦИЯ: КЛИЕНТ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Основен клиент</label>
                            <input 
                                required
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.leadGuest}
                                onChange={e => setFormData({...formData, leadGuest: e.target.value})}
                                placeholder="Име и Фамилия"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Телефон</label>
                            <input 
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* СЕКЦИЯ: ПЪТУВАНЕ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Дестинация</label>
                            <input 
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.destination}
                                onChange={e => setFormData({...formData, destination: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Дата на отпътуване</label>
                            <input 
                                type="date"
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.travelDate}
                                onChange={e => setFormData({...formData, travelDate: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* СЕКЦИЯ: ФИНАНСИ (ЕВРО ЛОГИКА) */}
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-bold text-blue-900 mb-1 text-center">Цена и Валута</label>
                                <div className="flex">
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full border-y border-l rounded-l-lg p-2.5 focus:ring-0 outline-none"
                                        value={formData.totalAmount}
                                        onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                                    />
                                    <select 
                                        className="bg-white border rounded-r-lg p-2.5 font-bold text-blue-600 outline-none cursor-pointer"
                                        value={formData.currency}
                                        onChange={e => setFormData({...formData, currency: e.target.value})}
                                    >
                                        <option value="BGN">BGN</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-center md:text-left pb-3">
                                <span className="text-xs text-blue-500 uppercase font-bold block">Равностойност:</span>
                                <span className="text-lg font-mono font-bold text-blue-800">{equivalentAmount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Отказ
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex justify-center items-center gap-2"
                        >
                            {loading ? 'Запис...' : <><Save size={18}/> Запази Резервация</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddReservation;
