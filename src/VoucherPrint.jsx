import React, { useEffect, useState } from 'react';
import Logo from './Logo.png'; 

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
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Функция за форматиране при печат
const formatDatePrint = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('bg-BG');
}

const formatDateTimePrint = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.replace('T', ' ');
    return d.toLocaleString('bg-BG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
}

const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    
    // --- STATE ---
    const [voucherNumber, setVoucherNumber] = useState('');
    const [voucherType, setVoucherType] = useState('original');
    
    const [destBg, setDestBg] = useState('');
    const [destEn, setDestEn] = useState('');
    const [adultsBg, setAdultsBg] = useState(0);
    const [adultsEn, setAdultsEn] = useState(0);
    const [chdRegBg, setChdRegBg] = useState(0);
    const [chdRegEn, setChdRegEn] = useState(0);
    const [chdExtBg, setChdExtBg] = useState(0);
    const [chdExtEn, setChdExtEn] = useState(0);
    const [itinBg, setItinBg] = useState('');
    const [itinEn, setItinEn] = useState('');
    const [placeBg, setPlaceBg] = useState('');
    const [placeEn, setPlaceEn] = useState('');
    const [startBg, setStartBg] = useState('');
    const [endBg, setEndBg] = useState('');
    const [startEn, setStartEn] = useState('');
    const [endEn, setEndEn] = useState('');
    const [accomBg, setAccomBg] = useState('');
    const [accomEn, setAccomEn] = useState('');
    const [roomBg, setRoomBg] = useState('');
    const [roomEn, setRoomEn] = useState('');
    const [checkInBg, setCheckInBg] = useState('');
    const [checkInEn, setCheckInEn] = useState('');
    const [checkOutBg, setCheckOutBg] = useState('');
    const [checkOutEn, setCheckOutEn] = useState('');
    const [excBg, setExcBg] = useState('');
    const [excEn, setExcEn] = useState('');
    const [otherBg, setOtherBg] = useState('');
    const [otherEn, setOtherEn] = useState('');
    const [noteBg, setNoteBg] = useState('');
    const [noteEn, setNoteEn] = useState('');
    const [dateIssuedBg, setDateIssuedBg] = useState('');
    const [dateIssuedEn, setDateIssuedEn] = useState('');
    const [payDocNum, setPayDocNum] = useState(''); 
    const [payDocDate, setPayDocDate] = useState('');
    const [tourists, setTourists] = useState([]);

    // --- POPULATE DATA ---
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(reservationData.reservationNumber || '');
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

    const addTourist = () => setTourists([...tourists, { bg: '', en: '' }]);
    const removeTourist = (idx) => setTourists(tourists.filter((_, i) => i !== idx));
    const updateTourist = (idx, field, val) => {
        const newArr = [...tourists];
        newArr[idx][field] = val;
        if (field === 'bg' && !newArr[idx].en) newArr[idx].en = val;
        setTourists(newArr);
    };
    const handleSync = (val, setterBg, setterEn, currentEn) => {
        setterBg(val);
        if (!currentEn) setterEn(val);
    };

    // --- PRINT LOGIC (POP-UP WINDOW) ---
    const handlePrint = () => {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Voucher Print</title>
            <style>
                body { background: white; font-family: sans-serif; margin: 0; padding: 0; }
                @media print { 
                    @page { size: A4 portrait; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; }
                    .main-container { transform: scale(0.95); transform-origin: top center; margin: 10mm auto; width: 100%; max-width: 210mm; }
                }
                .voucher-grid { border: 1px solid #000; font-size: 11px; width: 100%; border-collapse: collapse; }
                .voucher-row { display: flex; border-bottom: 1px solid #000; }
                .voucher-row:last-child { border-bottom: none; }
                .voucher-col { flex: 1; padding: 4px 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; }
                .voucher-col:last-child { border-right: none; }
                .header-bg { background-color: #e2e8f0; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 10px; padding: 4px; border-bottom: 1px solid #000; }
                .label-text { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                .val-text { font-weight: 600; font-size: 11px; color: #000; min-height: 14px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <div class="main-container" style="padding: 20px;">
                <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                    <img src="${Logo}" style="height: 70px; object-fit: contain;" />
                </div>

                <div class="voucher-grid">
                    <div class="header-bg">РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA</div>
                    
                    <div class="voucher-row" style="background-color: #f8fafc;">
                        <div style="width: 100%; padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 900; font-size: 16px; text-transform: uppercase;">Ваучер / Voucher:</span>
                            <span style="font-weight: 900; font-size: 18px; color: #dc2626;">${voucherNumber}</span>
                        </div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col"><span class="val-text">ДАЙНАМЕКС ТУР ЕООД</span></div>
                        <div class="voucher-col"><span class="val-text">DYNAMEX TOUR LTD</span></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><span style="font-size: 9px;">ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</span></div>
                        <div class="voucher-col"><span style="font-size: 9px;">TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</span></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><span style="font-size: 9px;">ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</span></div>
                        <div class="voucher-col"><span style="font-size: 9px;">ID: 208193140, ADDRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</span></div>
                    </div>

                    <div class="voucher-row" style="background-color: #eff6ff;">
                        <div style="width: 100%; text-align: center; padding: 4px; font-weight: 800; font-size: 11px;">
                            ${voucherType === 'original' ? 'ОРИГИНАЛ / ORIGINAL' : 'КОПИЕ / COPY'}
                        </div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">За представяне в:</div><div class="val-text">${destBg}</div></div>
                        <div class="voucher-col"><div class="label-text">To:</div><div class="val-text">${destEn}</div></div>
                    </div>

                    <div class="header-bg" style="border-top: 1px solid #000;">ИМЕ И ФАМИЛИЯ НА ТУРИСТА / NAME AND SURNAME OF TOURIST</div>

                    <div class="voucher-row">
                        <div style="width: 100%; padding: 8px;">
                            ${tourists.map(t => `<div style="font-weight: 600; margin-bottom: 2px;">${t.bg || ''} <span style="color:#94a3b8">/</span> ${t.en || ''}</div>`).join('')}
                        </div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col">
                            <div style="display: flex; justify-content: space-between;"><span class="label-text">Възрастни:</span><span class="val-text">${adultsBg}</span></div>
                        </div>
                        <div class="voucher-col">
                            <div style="display: flex; justify-content: space-between;"><span class="label-text">Adults:</span><span class="val-text">${adultsEn}</span></div>
                        </div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col">
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; margin-bottom: 2px;"><span class="label-text">Деца (Редовно):</span><span class="val-text">${chdRegBg}</span></div>
                            <div style="display: flex; justify-content: space-between;"><span class="label-text">Деца (Доп.):</span><span class="val-text">${chdExtBg}</span></div>
                        </div>
                        <div class="voucher-col">
                            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; margin-bottom: 2px;"><span class="label-text">Children (Reg):</span><span class="val-text">${chdRegEn}</span></div>
                            <div style="display: flex; justify-content: space-between;"><span class="label-text">Children (Ext):</span><span class="val-text">${chdExtEn}</span></div>
                        </div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Маршрут:</div><div class="val-text">${itinBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Itinerary:</div><div class="val-text">${itinEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Място:</div><div class="val-text">${placeBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Destination:</div><div class="val-text">${placeEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Срок:</div><div class="val-text">${formatDatePrint(startBg)} - ${formatDatePrint(endBg)}</div></div>
                        <div class="voucher-col"><div class="label-text">Period:</div><div class="val-text">${formatDatePrint(startEn)} - ${formatDatePrint(endEn)}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Настаняване в:</div><div class="val-text">${accomBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Accommodation at:</div><div class="val-text">${accomEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Категория / Стая:</div><div class="val-text">${roomBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Category / Room:</div><div class="val-text">${roomEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Пристигане / Заминаване:</div><div class="val-text">${formatDateTimePrint(checkInBg)} / ${formatDateTimePrint(checkOutBg)}</div></div>
                        <div class="voucher-col"><div class="label-text">Check-in / Check-out:</div><div class="val-text">${formatDateTimePrint(checkInEn)} / ${formatDateTimePrint(checkOutEn)}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Екскурзии:</div><div class="val-text">${excBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Excursions:</div><div class="val-text">${excEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Други услуги:</div><div class="val-text">${otherBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Other Services:</div><div class="val-text">${otherEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Забележки:</div><div class="val-text">${noteBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Notes:</div><div class="val-text">${noteEn}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Дата на издаване:</div><div class="val-text">${formatDatePrint(dateIssuedBg)}</div></div>
                        <div class="voucher-col"><div class="label-text">Date Issued:</div><div class="val-text">${formatDatePrint(dateIssuedEn)}</div></div>
                    </div>
                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Документ за плащане (№ / Дата):</div><div class="val-text">${payDocNum} / ${formatDatePrint(payDocDate)}</div></div>
                        <div class="voucher-col"><div class="label-text">Payment Doc (No / Date):</div><div class="val-text">${payDocNum} / ${formatDatePrint(payDocDate)}</div></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <div style="border-bottom: 1px solid black; height: 30px; margin-bottom: 5px;"></div>
                        <p style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Подпис и печат на Изпращач<br/>Sender Signature</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-bottom: 1px solid black; height: 30px; margin-bottom: 5px;"></div>
                        <p style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Подпис и печат на Приемащ<br/>Receiver Signature</p>
                    </div>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=900');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        } else {
            alert('Моля, разрешете Pop-ups за този сайт.');
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            
            {/* CSS за ЕКРАННАТА версия (за да изглежда красиво докато редактираш) */}
            <style>{`
                .voucher-grid { border: 1px solid #64748b; }
                .voucher-row { display: flex; border-bottom: 1px solid #64748b; }
                .voucher-row:last-child { border-bottom: none; }
                .voucher-col { flex: 1; padding: 2px 6px; border-right: 1px solid #64748b; display: flex; flex-direction: column; justify-content: center; }
                .voucher-col:last-child { border-right: none; }
                .input-clean { width: 100%; background: transparent; font-weight: 600; font-size: 0.8rem; outline: none; border-bottom: 1px dashed #cbd5e1; }
                .input-clean:focus { border-bottom: 1px solid #3b82f6; background-color: #f8fafc; }
                .label-clean { font-size: 0.55rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
            `}</style>

            {/* БУТОНИ */}
            <div className="fixed bottom-6 right-6 flex gap-4 z-50">
                <button onClick={addTourist} className="bg-white text-blue-600 border border-blue-200 px-4 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition">
                    + Турист
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    🖨️ Принтирай
                </button>
            </div>

            {/* ИНТЕРАКТИВЕН РЕДАКТОР НА ЕКРАНА */}
            <div className="bg-white w-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden p-8 text-slate-900 mx-auto">
                <div className="flex justify-center mb-2">
                    <img src={Logo} alt="Logo" className="h-16 object-contain" onError={(e) => e.target.style.display='none'} />
                </div>

                <div className="voucher-grid text-sm">
                    <div className="bg-slate-200 text-center font-black text-[10px] p-1 border-b border-slate-500 uppercase">
                        Република България / Republic of Bulgaria
                    </div>

                    <div className="voucher-row bg-slate-50">
                        <div className="w-full p-2 flex justify-between items-center">
                            <span className="font-black text-lg uppercase">Ваучер / Voucher:</span>
                            <input className="text-right text-xl font-black text-red-600 bg-transparent outline-none w-1/2 border-b border-dashed border-red-200" value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} placeholder="№" />
                        </div>
                    </div>

                    <div className="voucher-row"><div className="voucher-col font-bold text-[10px]">ДАЙНАМЕКС ТУР ЕООД</div><div className="voucher-col font-bold text-[10px]">DYNAMEX TOUR LTD</div></div>
                    <div className="voucher-row"><div className="voucher-col text-[9px]">ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</div><div className="voucher-col text-[9px]">TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</div></div>
                    <div className="voucher-row"><div className="voucher-col text-[9px]">ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</div><div className="voucher-col text-[9px]">ID: 208193140, ADDRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</div></div>

                    <div className="voucher-row bg-blue-50/50">
                        <div className="w-full text-center p-1">
                            <select className="bg-transparent font-bold uppercase text-center w-full text-[10px] outline-none appearance-none cursor-pointer" value={voucherType} onChange={e => setVoucherType(e.target.value)}>
                                <option value="original">ОРИГИНАЛ / ORIGINAL</option>
                                <option value="copy">КОПИЕ / COPY</option>
                            </select>
                        </div>
                    </div>

                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">За представяне в:</span><input className="input-clean" value={destBg} onChange={e => handleSync(e.target.value, setDestBg, setDestEn, destEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">To:</span><input className="input-clean" value={destEn} onChange={e => setDestEn(e.target.value)} /></div>
                    </div>

                    <div className="bg-slate-200 text-center font-black text-[10px] p-1 border-y border-slate-500 uppercase">
                        Име и Фамилия на Туриста / Name and Surname of Tourist
                    </div>

                    <div className="voucher-row">
                        <div className="w-full p-1 space-y-1">
                            {tourists.map((t, idx) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <input className="input-clean" value={t.bg} onChange={e => updateTourist(idx, 'bg', e.target.value)} placeholder="Име (BG)" />
                                    <span className="text-slate-300">/</span>
                                    <input className="input-clean" value={t.en} onChange={e => updateTourist(idx, 'en', e.target.value)} placeholder="Name (EN)" />
                                    <button onClick={() => removeTourist(idx)} className="text-red-400 hover:text-red-600 text-xs px-1 opacity-0 group-hover:opacity-100 transition">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="voucher-row">
                        <div className="voucher-col"><div className="flex justify-between"><span className="label-clean">Възрастни:</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={adultsBg} onChange={e => {setAdultsBg(e.target.value); setAdultsEn(e.target.value)}} /></div></div>
                        <div className="voucher-col"><div className="flex justify-between"><span className="label-clean">Adults:</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={adultsEn} onChange={e => setAdultsEn(e.target.value)} /></div></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <div className="flex justify-between mb-1"><span className="label-clean">Деца (Ред):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={chdRegBg} onChange={e => {setChdRegBg(e.target.value); setChdRegEn(e.target.value)}} /></div>
                            <div className="flex justify-between"><span className="label-clean">Деца (Доп):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={chdExtBg} onChange={e => {setChdExtBg(e.target.value); setChdExtEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <div className="flex justify-between mb-1"><span className="label-clean">Chd (Reg):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={chdRegEn} onChange={e => setChdRegEn(e.target.value)} /></div>
                            <div className="flex justify-between"><span className="label-clean">Chd (Ext):</span><input type="number" className="w-8 text-center font-bold text-xs bg-transparent border-b border-dashed" value={chdExtEn} onChange={e => setChdExtEn(e.target.value)} /></div>
                        </div>
                    </div>

                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Маршрут:</span><input className="input-clean" value={itinBg} onChange={e => handleSync(e.target.value, setItinBg, setItinEn, itinEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Itinerary:</span><input className="input-clean" value={itinEn} onChange={e => setItinEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Място:</span><input className="input-clean" value={placeBg} onChange={e => handleSync(e.target.value, setPlaceBg, setPlaceEn, placeEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Destination:</span><input className="input-clean" value={placeEn} onChange={e => setPlaceEn(e.target.value)} /></div>
                    </div>
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
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Настаняване в:</span><input className="input-clean" value={accomBg} onChange={e => handleSync(e.target.value, setAccomBg, setAccomEn, accomEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Accommodation at:</span><input className="input-clean" value={accomEn} onChange={e => setAccomEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Категория / Стая:</span><input className="input-clean" value={roomBg} onChange={e => handleSync(e.target.value, setRoomBg, setRoomEn, roomEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Category / Room:</span><input className="input-clean" value={roomEn} onChange={e => setRoomEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col">
                            <span className="label-clean">Пристигане / Заминаване:</span>
                            <div className="flex gap-1"><input type="datetime-local" className="input-clean text-[10px]" value={checkInBg} onChange={e => {setCheckInBg(e.target.value); setCheckInEn(e.target.value)}} /><span>/</span><input type="datetime-local" className="input-clean text-[10px]" value={checkOutBg} onChange={e => {setCheckOutBg(e.target.value); setCheckOutEn(e.target.value)}} /></div>
                        </div>
                        <div className="voucher-col">
                            <span className="label-clean">Check-in / Check-out:</span>
                            <div className="flex gap-1"><input type="datetime-local" className="input-clean text-[10px]" value={checkInEn} onChange={e => setCheckInEn(e.target.value)} /><span>/</span><input type="datetime-local" className="input-clean text-[10px]" value={checkOutEn} onChange={e => setCheckOutEn(e.target.value)} /></div>
                        </div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Екскурзии:</span><textarea className="input-clean h-6 resize-none" value={excBg} onChange={e => handleSync(e.target.value, setExcBg, setExcEn, excEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Excursions:</span><textarea className="input-clean h-6 resize-none" value={excEn} onChange={e => setExcEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Други услуги:</span><textarea className="input-clean h-6 resize-none" value={otherBg} onChange={e => handleSync(e.target.value, setOtherBg, setOtherEn, otherEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Other Services:</span><textarea className="input-clean h-6 resize-none" value={otherEn} onChange={e => setOtherEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Забележки:</span><textarea className="input-clean h-6 resize-none" value={noteBg} onChange={e => handleSync(e.target.value, setNoteBg, setNoteEn, noteEn)} /></div>
                        <div className="voucher-col"><span className="label-clean">Notes:</span><textarea className="input-clean h-6 resize-none" value={noteEn} onChange={e => setNoteEn(e.target.value)} /></div>
                    </div>
                    <div className="voucher-row">
                        <div className="voucher-col"><span className="label-clean">Дата на издаване:</span><input type="date" className="input-clean text-xs" value={dateIssuedBg} onChange={e => {setDateIssuedBg(e.target.value); setDateIssuedEn(e.target.value)}} /></div>
                        <div className="voucher-col"><span className="label-clean">Date Issued:</span><input type="date" className="input-clean text-xs" value={dateIssuedEn} onChange={e => setDateIssuedEn(e.target.value)} /></div>
                    </div>
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
