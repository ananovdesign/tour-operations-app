import React, { useState } from 'react';
import { db, appId } from '../../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Save, Bus } from 'lucide-react';

const CreateTour = ({ userId, onClose }) => {
    const [formData, setFormData] = useState({
        tourName: '',
        destination: '',
        startDate: '',
        endDate: '',
        busPlate: '',
        guideName: '',
        maxSeats: 50,
        basePrice: 0,
        currency: 'BGN'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const path = `artifacts/${appId}/users/${userId}/tours`;
            await addDoc(collection(db, path), {
                ...formData,
                createdAt: new Date().toISOString(),
                linkedReservations: []
            });
            onClose();
        } catch (err) { alert("Грешка при запис"); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Bus size={28} />
                        <h3 className="text-xl font-bold">Планиране на нов Тур</h3>
                    </div>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Име на програмата</label>
                        <input required className="w-full border-b-2 border-slate-200 py-2 focus:border-emerald-500 outline-none text-lg font-medium" 
                               onChange={e => setFormData({...formData, tourName: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дестинация</label>
                        <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                               onChange={e => setFormData({...formData, destination: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Автобус (номер)</label>
                        <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                               onChange={e => setFormData({...formData, busPlate: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дата на тръгване</label>
                        <input type="date" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                               onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Места</label>
                        <input type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                               onChange={e => setFormData({...formData, maxSeats: e.target.value})} />
                    </div>

                    <div className="col-span-2 flex gap-4 mt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Отказ</button>
                        <button type="submit" className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center justify-center gap-2">
                            <Save size={20} /> Запази Програмата
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTour;
