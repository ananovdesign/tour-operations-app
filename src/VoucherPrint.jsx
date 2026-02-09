import React, { useEffect, useState, useCallback } from 'react';
import Logo from './Logo.png'; // Увери се, че логото е там, или ползвай URL

// --- Helper Functions ---
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Format: YYYY-MM-DDThh:mm for datetime-local input
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    
    // --- STATE ---
    const [voucherNumber, setVoucherNumber] = useState('');
    const [voucherType, setVoucherType] = useState('original');
    
    // Destinations
    const [destBg, setDestBg] = useState('');
    const [destEn, setDestEn] = useState('');
    
    // Pax
    const [adultsBg, setAdultsBg] = useState(0);
    const [adultsEn, setAdultsEn] = useState(0);
    const [chdRegBg, setChdRegBg] = useState(0);
    const [chdRegEn, setChdRegEn] = useState(0);
    const [chdExtBg, setChdExtBg] = useState(0);
    const [chdExtEn, setChdExtEn] = useState(0);

    // Details
    const [itinBg, setItinBg] = useState('');
    const [itinEn, setItinEn] = useState('');
    const [placeBg, setPlaceBg] = useState('');
    const [placeEn, setPlaceEn] = useState('');
    
    // Dates
    const [startBg, setStartBg] = useState('');
    const [endBg, setEndBg] = useState('');
    const [startEn, setStartEn] = useState('');
    const [endEn, setEndEn] = useState('');
    
    // Accom & Room
    const [accomBg, setAccomBg] = useState('');
    const [accomEn, setAccomEn] = useState('');
    const [roomBg, setRoomBg] = useState('');
    const [roomEn, setRoomEn] = useState('');
    
    // Check In/Out
    const [checkInBg, setCheckInBg] = useState('');
    const [checkInEn, setCheckInEn] = useState('');
    const [checkOutBg, setCheckOutBg] = useState('');
    const [checkOutEn, setCheckOutEn] = useState('');

    // Extras
    const [excBg, setExcBg] = useState('');
    const [excEn, setExcEn] = useState('');
    const [otherBg, setOtherBg] = useState('');
    const [otherEn, setOtherEn] = useState('');
    const [noteBg, setNoteBg] = useState('');
    const [noteEn, setNoteEn] = useState('');

    // Footer
    const [dateIssuedBg, setDateIssuedBg] = useState('');
    const [dateIssuedEn, setDateIssuedEn] = useState('');
    const [payDocNum, setPayDocNum] = useState(''); // Shared for both usually
    const [payDocDate, setPayDocDate] = useState('');

    const [tourists, setTourists] = useState([]);

    // --- EFFECT: POPULATE DATA ---
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(reservationData.reservationNumber || '');
            
            // Auto-populate logic
            const hotel = reservationData.hotel || '';
            const place = reservationData.place || '';
            
            setDestBg(hotel); setDestEn(hotel);
            setPlaceBg(place); setPlaceEn(place);
            setItinBg(`${place}, ${hotel}`); setItinEn(`${place}, ${hotel}`);
            setAccomBg(hotel); setAccomEn(hotel);
            
            setAdultsBg(reservationData.adults || 0); setAdultsEn(reservationData.adults || 0);
            setChdRegBg(reservationData.children || 0); setChdRegEn(reservationData.children || 0);
            
            setStartBg(formatDateForInput(reservationData.checkIn));
            setStartEn(formatDateForInput(reservationData.checkIn));
            setEndBg(formatDateForInput(reservationData.checkOut));
            setEndEn(formatDateForInput(reservationData.checkOut));
            
            setCheckInBg(formatDateTimeForInput(reservationData.checkIn));
            setCheckInEn(formatDateTimeForInput(reservationData.checkIn));
            setCheckOutBg(formatDateTimeForInput(reservationData.checkOut));
            setCheckOutEn(formatDateTimeForInput(reservationData.checkOut));
            
            setRoomBg(reservationData.roomType || ''); setRoomEn(reservationData.roomType || '');
            
            const today = formatDateForInput(new Date());
            setDateIssuedBg(today); setDateIssuedEn(today);

            // Tourists
            if (reservationData.tourists && reservationData.tourists.length > 0) {
                setTourists(reservationData.tourists.map(t => ({
                    bg: `${t.firstName || ''} ${t.familyName || ''}`.trim(),
                    en: `${t.firstName || ''} ${t.familyName || ''}`.trim()
                })));
            } else {
                setTourists([{ bg: '', en: '' }]);
            }
        }
    }, [reservationData]);

    // --- HANDLERS ---
    const handlePrint = () => {
        const timer = setTimeout(() => {
            window.print();
            window.onafterprint = () => {
                if (onPrintFinish) onPrintFinish();
                window.onafterprint = null;
            };
        }, 300);
        return () => clearTimeout(timer);
    };

    const addTourist = () => setTourists([...tourists, { bg: '', en: '' }]);
    const removeTourist = (idx) => setTourists(tourists.filter((_, i) => i !== idx));
    const updateTourist = (idx, field, val) => {
        const newArr = [...tourists];
        newArr[idx][field] = val;
        // Auto-sync EN if empty
        if (field === 'bg' && !newArr[idx].en) newArr[idx].en = val;
        setTourists(newArr);
    };

    // Generic Sync Handler (updates EN if EN is empty when BG changes)
    const handleSync = (val, setterBg, setterEn, currentEn) => {
        setterBg(val);
        if (!currentEn) setterEn(val);
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            
            {/* INJECT PRINT STYLES */}
            <style>{`
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { background: white; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print-container {
                        box-shadow: none !important;
                        margin: 5mm auto !important;
                        width: 100% !important;
                        border: none !important;
                        transform: scale(0.95); /* KEY FIX: Scale down to fit 1 page */
                        transform-origin: top center;
                    }
                    input, textarea, select {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        resize: none !important;
                    }
                    /* Force borders to print */
                    .voucher-grid, .voucher-row, .voucher-col { border-color: #000 !important; }
                    .header-bg { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
                }
                
                /* Custom Grid Classes */
                .voucher-grid { border: 1px solid #64748b; }
                .voucher-row { display: flex; border-bottom: 1px solid #64748b; }
                .voucher-row:last-child { border-bottom: none; }
                .voucher-col { flex: 1; padding: 2px 6px; border-right: 1px solid #64748b; display: flex; flex-direction: column; justify-content: center; }
                .voucher-col:last-child { border-right: none; }
                
                .input-clean { width: 100%; background: transparent; font-weight: 600; font-size: 0.8rem; outline: none; }
                .label-clean { font-size: 0.55rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
            `}</style>

            {/* CONTROLS */}
            <div className="no-print fixed bottom-6 right-6 flex gap-4 z-50">
                <button onClick={addTourist} className="bg-white text-blue-600 border border-blue-200 px-4 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition">
                    + Турист
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    🖨️ Принтирай
                </button>
            </div>

            {/* A4 PAPER CONTAINER */}
            <div className="print-container bg-white w-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden p-8 text-slate-900">
                
                {/* LOGO */}
                <div className="flex justify-center mb-2">
                    <img src={Logo} alt="Logo" className="h-16 object-contain" onError={(e) => e.target.style.display='none'} />
                </div>

                {/* GRID START */}
                <div className="voucher-grid text-sm">
                    
                    {/* Header */}
                    <div className="header-bg bg-slate-200 text-center font-black text-[10px] p-1 border-b border-slate-500 uppercase">
                        Република България / Republic of Bulgaria
                    </div>

                    <div className="voucher-row bg-slate-50">
                        <div className="w-full p-2 flex justify-between items-center">
                            <span className="font-black text-lg uppercase">Ваучер / Voucher:</span>
                            <input 
                                type="text" 
                                className="text-right text-xl font-black text-red-600 bg-transparent outline-none w-1/2" 
                                value={voucherNumber}
                                onChange={e => setVoucherNumber(e.target.value)}
                                placeholder="№"
                            />
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="voucher-row"><div className="voucher-col font-bold text-[10px]">ДАЙНАМЕКС ТУР ЕООД</div><div className="voucher-col font-bold text-[10px]">DYNAMEX TOUR LTD</div></div>
                    <div className="voucher-row"><div className="voucher-col text-[9px]">ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</div><div className="voucher-col text-[9px]">TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</div></div>
                    <div className="voucher-row"><div className="voucher-col text-[9px]">ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</div><div className="voucher-col text-[9px]">ID: 208193140, ADDRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</div></div>

                    {/* Type */}
                    <div className="voucher-row bg-blue-50/50">
                        <div className="w-full text-center p-1">
                            <select className="bg-transparent font-bold uppercase text-center w-full text-[10px] outline-none appearance-none" value={voucherType} onChange={e => setVoucherType(e.target.value)}>
                                <option value="original">ОРИГИНАЛ / ORIGINAL</option>
                                <option value="copy">КОПИЕ / COPY</option>
                            </select>
                        </div>
                    </div>

                    {/* Dest */}
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <span className="label-clean">За представяне в:</span>
                            <input className="input-clean" value={destBg} onChange={e => handleSync(e.target.value, setDestBg, setDestEn, destEn)} />
                        </div>
                        <div className="voucher-col">
                            <span className="label-clean">To:</span>
                            <input className="input-clean" value={destEn} onChange={e => setDestEn(e.target.value)} />
                        </div>
                    </div>

                    {/* Tourists Header */}
                    <div className="header-bg bg-slate-200 text-center font-black text-[10px] p-1 border-y border-slate-500 uppercase">
                        Име и Фамилия на Туриста / Name and Surname of Tourist
                    </div>

                    {/* Tourists List */}
                    <div className="voucher-row">
                        <div className="w-full p-1 space-y-1">
                            {tourists.map((t, idx) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <input className="input-clean border-b border-dashed border-slate-300" value={t.bg} onChange={e => updateTourist(idx, 'bg', e.target.value)} placeholder="Име (BG)" />
                                    <span className="text-slate-300">/</span>
                                    <input className="input-clean border-b border-dashed border-slate-300" value={t.en} onChange={e => updateTourist(idx, 'en', e.target.value)} placeholder="Name (EN)" />
                                    <button onClick={() => removeTourist(idx)} className="no-print text-red-400 hover:text-red-600 text-xs px-1 opacity-0 group-hover:opacity-100 transition">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pax */}
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <div className="flex justify-between"><span className="label-clean">Възрастни:</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={adultsBg} onChange={e => {setAdultsBg(e.target.value); setAdultsEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <div className="flex justify-between"><span className="label-clean">Adults:</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={adultsEn} onChange={e => setAdultsEn(e.target.value)} /></div>
                        </div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1 mb-1"><span className="label-clean">Деца (Редовно):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={chdRegBg} onChange={e => {setChdRegBg(e.target.value); setChdRegEn(e.target.value)}} /></div>
                            <div className="flex justify-between"><span className="label-clean">Деца (Доп.):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={chdExtBg} onChange={e => {setChdExtBg(e.target.value); setChdExtEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1 mb-1"><span className="label-clean">Chd (Regular):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={chdRegEn} onChange={e => setChdRegEn(e.target.value)} /></div>
                            <div className="flex justify-between"><span className="label-clean">Chd (Extra):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent" value={chdExtEn} onChange={e => setChdExtEn(e.target.value)} /></div>
                        </div>
                    </div>

                    {/* Itinerary */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Маршрут:</span><input className="input-clean" value={itinBg} onChange={e => handleSync(e.target.value, setItinBg, setItinEn, itinEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Itinerary:</span><input className="input-clean" value={itinEn} onChange={e => setItinEn(e.target.value)} /></div>
                    </div>

                    {/* Place */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Място:</span><input className="input-clean" value={placeBg} onChange={e => handleSync(e.target.value, setPlaceBg, setPlaceEn, placeEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Destination:</span><input className="input-clean" value={placeEn} onChange={e => setPlaceEn(e.target.value)} /></div>
                    </div>

                    {/* Dates */}
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <span className="label-clean">Срок (От - До):</span>
                            <div className="flex gap-1"><input type="date" className="input-clean text-[10px]" value={startBg} onChange={e => {setStartBg(e.target.value); setStartEn(e.target.value)}} /><span>-</span><input type="date" className="input-clean text-[10px]" value={endBg} onChange={e => {setEndBg(e.target.value); setEndEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <span className="label-clean">Period:</span>
                            <div className="flex gap-1"><input type="date" className="input-clean text-[10px]" value={startEn} onChange={e => setStartEn(e.target.value)} /><span>-</span><input type="date" className="input-clean text-[10px]" value={endEn} onChange={e => setEndEn(e.target.value)} /></div>
                        </div>
                    </div>

                    {/* Accom */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Настаняване в:</span><input className="input-clean" value={accomBg} onChange={e => handleSync(e.target.value, setAccomBg, setAccomEn, accomEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Accommodation at:</span><input className="input-clean" value={accomEn} onChange={e => setAccomEn(e.target.value)} /></div>
                    </div>

                    {/* Room */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Категория / Стая:</span><input className="input-clean" value={roomBg} onChange={e => handleSync(e.target.value, setRoomBg, setRoomEn, roomEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Category / Room:</span><input className="input-clean" value={roomEn} onChange={e => setRoomEn(e.target.value)} /></div>
                    </div>

                    {/* Check In/Out */}
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <span className="label-clean">Пристигане / Заминаване:</span>
                            <div className="flex gap-1"><input type="datetime-local" className="input-clean text-[10px]" value={checkInBg} onChange={e => {setCheckInBg(e.target.value); setCheckInEn(e.target.value)}} /><span className="text-xs">/</span><input type="datetime-local" className="input-clean text-[10px]" value={checkOutBg} onChange={e => {setCheckOutBg(e.target.value); setCheckOutEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <span className="label-clean">Check-in / Check-out:</span>
                            <div className="flex gap-1"><input type="datetime-local" className="input-clean text-[10px]" value={checkInEn} onChange={e => setCheckInEn(e.target.value)} /><span className="text-xs">/</span><input type="datetime-local" className="input-clean text-[10px]" value={checkOutEn} onChange={e => setCheckOutEn(e.target.value)} /></div>
                        </div>
                    </div>

                    {/* Excursions */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Екскурзии:</span><textarea className="input-clean h-6" value={excBg} onChange={e => handleSync(e.target.value, setExcBg, setExcEn, excEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Excursions:</span><textarea className="input-clean h-6" value={excEn} onChange={e => setExcEn(e.target.value)} /></div>
                    </div>

                    {/* Other */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Други услуги:</span><textarea className="input-clean h-6" value={otherBg} onChange={e => handleSync(e.target.value, setOtherBg, setOtherEn, otherEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Other Services:</span><textarea className="input-clean h-6" value={otherEn} onChange={e => setOtherEn(e.target.value)} /></div>
                    </div>

                    {/* Notes */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Забележки:</span><textarea className="input-clean h-6" value={noteBg} onChange={e => handleSync(e.target.value, setNoteBg, setNoteEn, noteEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Notes:</span><textarea className="input-clean h-6" value={noteEn} onChange={e => setNoteEn(e.target.value)} /></div>
                    </div>

                    {/* Date Issued */}
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Дата на издаване:</span><input type="date" className="input-clean text-xs" value={dateIssuedBg} onChange={e => {setDateIssuedBg(e.target.value); setDateIssuedEn(e.target.value)}} /></div>
                        <div className="voucher-col"><span className="label-clean">Date Issued:</span><input type="date" className="input-clean text-xs" value={dateIssuedEn} onChange={e => setDateIssuedEn(e.target.value)} /></div>
                    </div>

                    {/* Pay Doc */}
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <span className="label-clean">Документ за плащане (№ / Дата):</span>
                            <div className="flex gap-1"><input className="input-clean w-20" placeholder="№" value={payDocNum} onChange={e => setPayDocNum(e.target.value)} /><input type="date" className="input-clean w-24 text-[10px]" value={payDocDate} onChange={e => setPayDocDate(e.target.value)} /></div>
                        </div>
                        <div className="voucher-col">
                            <span className="label-clean">Payment Doc (No / Date):</span>
                            <div className="flex gap-1"><input className="input-clean w-20" placeholder="No" value={payDocNum} readOnly /><input type="date" className="input-clean w-24 text-[10px]" value={payDocDate} readOnly /></div>
                        </div>
                    </div>

                </div>

                {/* SIGNATURES */}
                <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="text-center">
                        <div className="border-b border-black h-8 mb-1"></div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Подпис и печат на Изпращач<br/>Sender Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-black h-8 mb-1"></div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Подпис и печат на Приемащ<br/>Receiver Signature</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VoucherPrint;
