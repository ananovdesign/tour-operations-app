import React, { useState } from 'react';
import { FileText, Users, Bus, ArrowRight } from 'lucide-react';

const DocumentsPage = ({
    reservations,
    tours, // Ако имаш масив с турове в App.jsx
    setTab,
    setPrintData,
    setBusTourPrintData
}) => {
    const [selectedDocType, setSelectedDocType] = useState('individual');

    return (
        <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
                Генератор на Договори
            </h2>

            {/* Избор на тип договор */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => setSelectedDocType('individual')}
                    className={`p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        selectedDocType === 'individual' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                >
                    <div className={`p-3 rounded-full ${selectedDocType === 'individual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Users size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-gray-800">Индивидуален клиент</h3>
                        <p className="text-sm text-gray-500">Договор за организирано пътуване (хотел/пакет)</p>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedDocType('busTour')}
                    className={`p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        selectedDocType === 'busTour' 
                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-purple-200'
                    }`}
                >
                    <div className={`p-3 rounded-full ${selectedDocType === 'busTour' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Bus size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-gray-800">Автобусна програма</h3>
                        <p className="text-sm text-gray-500">Групов договор за организиран тур</p>
                    </div>
                </button>
            </div>

            {/* Списък за избор на данни */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b font-semibold text-gray-700">
                    {selectedDocType === 'individual' 
                        ? 'Избери резервация за попълване на договора' 
                        : 'Избери тур за попълване на договора'}
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {selectedDocType === 'individual' ? (
                        reservations.length > 0 ? (
                            reservations.map(res => (
                                <div key={res.id} className="p-4 hover:bg-blue-50 transition flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-gray-800">{res.guestName}</div>
                                        <div className="text-sm text-gray-500">{res.hotel} | {res.checkIn}</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setPrintData(res);
                                            setTab('CustomerContractPrint');
                                        }}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Генерирай <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400">Няма открити резервации.</div>
                        )
                    ) : (
                        // Логика за турове (ако имаш масив tours, иначе ползваме примерен филтър)
                        <div className="p-8 text-center text-gray-400">
                            Избери тур от списъка с активни програми.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;
