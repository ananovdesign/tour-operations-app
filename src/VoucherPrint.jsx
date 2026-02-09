import React, { useEffect, useState } from 'react';
import Logo from './Logo.png'; // Увери се, че пътят е верен

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

// Функция за форматиране на дата за принтиране (DD.MM.YYYY)
const formatDatePrint = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('bg-BG');
}

// Функция за форматиране на дата и час за принтиране
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

    // --- EFFECT: POPULATE DATA ---
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

    // --- THE MAGIC PRINT FUNCTION ---
    const handlePrint = () => {
        // 1. Създаваме HTML съдържанието като стринг (Това е 1:1 с HTML файла, който работеше)
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Voucher</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body { background: white; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 20px; }
                .voucher-grid { border: 1px solid #000; font-size: 11px; }
                .voucher-row { display: flex; border-bottom: 1px solid #000; }
                .voucher-row:last-child { border-bottom: none; }
                .voucher-col { flex: 1; padding: 4px 8px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: center; }
                .voucher-col:last-child { border-right: none; }
                .header-bg { background-color: #e2e8f0; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 10px; color: #000; padding: 4px; border-bottom: 1px solid #000; }
                .label-text { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                .val-text { font-weight: 600; font-size: 11px; color: #000; min-height: 14px; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { margin: 0; padding: 0; }
                    .main-container { transform: scale(0.95); transform-origin: top center; margin: 10mm auto; width: 100%; max-width: 210mm; }
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                    <img src="${Logo}" style="height: 80px; object-fit: contain;" />
                </div>

                <div class="voucher-grid">
                    <div class="header-bg">РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA</div>
                    
                    <div class="voucher-row" style="background-color: #f8fafc;">
                        <div style="width: 100%; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 900; font-size: 18px; text-transform: uppercase;">Ваучер / Voucher:</span>
                            <span style="font-weight: 900; font-size: 20px; color: #dc2626;">${voucherNumber}</span>
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
                        <div class="voucher-col">
                            <div class="label-text">За представяне в:</div>
                            <div class="val-text">${destBg}</div>
                        </div>
                        <div class="voucher-col">
                            <div class="label-text">To:</div>
                            <div class="val-text">${destEn}</div>
                        </div>
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
                        <div class="voucher-col"><div class="label-text">Екскурзии:</div><div class="val-text" style="min-height: 20px;">${excBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Excursions:</div><div class="val-text" style="min-height: 20px;">${excEn}</div></div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Други услуги:</div><div class="val-text" style="min-height: 20px;">${otherBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Other Services:</div><div class="val-text" style="min-height: 20px;">${otherEn}</div></div>
                    </div>

                    <div class="voucher-row">
                        <div class="voucher-col"><div class="label-text">Забележки:</div><div class="val-text" style="min-height: 20px;">${noteBg}</div></div>
                        <div class="voucher-col"><div class="label-text">Notes:</div><div class="val-text" style="min-height: 20px;">${noteEn}</div></div>
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
                window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } }
            </script>
        </body>
        </html>
        `;

        // 2. Отваряме нов прозорец
        const printWindow = window.open('', '_blank', 'width=900,height=900');
        
        // 3. Записваме съдържанието
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close(); // Важно за завършване на зареждането
        } else {
            alert('Моля, разрешете изскачащите прозорци (Pop-ups) за този сайт, за да принтирате.');
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            {/* БУТОНИ */}
            <div className="fixed bottom-6 right-6 flex gap-4 z-50">
                <button onClick={addTourist} className="bg-white text-blue-600 border border-blue-200 px-4 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition">
                    + Турист
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    🖨️ Принтирай
                </button>
            </div>

            {/* ИНТЕРАКТИВНА ФОРМА ЗА ЕКРАНА (Това не се принтира, само се вижда) */}
            <div className="bg-white w-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden p-8 text-slate-900 border border-slate-200 mx-auto">
                <div className="flex justify-center mb-2">
                    <img src={Logo} alt="Logo" className="h-16 object-contain" />
                </div>

                <div className="border border-slate-300 text-sm">
                    <div className="bg-slate-200 text-center font-black text-[10px] p-1 border-b border-slate-300 uppercase">
                        Република България (Preview Mode - Редакция)
                    </div>

                    {/* РЕДАКЦИЯ НА ДАННИ */}
                    <div className="p-4 grid gap-4">
                        <div className="flex gap-2 items-center">
                            <span className="font-bold">Ваучер №:</span>
                            <input className="border-b border-blue-500 bg-blue-50 px-2" value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} />
                        </div>
                        
                        <div className="flex gap-2 items-center">
                            <span className="font-bold">Тип:</span>
                            <select className="border border-slate-300 rounded" value={voucherType} onChange={e => setVoucherType(e.target.value)}>
                                <option value="original">ОРИГИНАЛ</option>
                                <option value="copy">КОПИЕ</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs text-slate-500">Destination (BG):</span><input className="w-full border-b border-slate-300" value={destBg} onChange={e => handleSync(e.target.value, setDestBg, setDestEn, destEn)} /></div>
                            <div><span className="text-xs text-slate-500">Destination (EN):</span><input className="w-full border-b border-slate-300" value={destEn} onChange={e => setDestEn(e.target.value)} /></div>
                        </div>

                        <div className="border p-2 rounded bg-slate-50">
                            <div className="text-xs font-bold mb-2">ТУРИСТИ:</div>
                            {tourists.map((t, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input className="flex-1 border border-slate-300 p-1 text-xs" value={t.bg} onChange={e => updateTourist(idx, 'bg', e.target.value)} placeholder="Име BG" />
                                    <input className="flex-1 border border-slate-300 p-1 text-xs" value={t.en} onChange={e => updateTourist(idx, 'en', e.target.value)} placeholder="Name EN" />
                                    <button onClick={() => removeTourist(idx)} className="text-red-500 font-bold px-2">X</button>
                                </div>
                            ))}
                        </div>

                        {/* Останалите полета за бърза редакция (само основните визуализирам за компактност, но state-а е пълен) */}
                        <div className="grid grid-cols-4 gap-2">
                            <div><span className="text-[10px]">Възрастни</span><input type="number" className="w-full border" value={adultsBg} onChange={e => {setAdultsBg(e.target.value); setAdultsEn(e.target.value)}} /></div>
                            <div><span className="text-[10px]">Деца (Ред)</span><input type="number" className="w-full border" value={chdRegBg} onChange={e => {setChdRegBg(e.target.value); setChdRegEn(e.target.value)}} /></div>
                            <div><span className="text-[10px]">Деца (Доп)</span><input type="number" className="w-full border" value={chdExtBg} onChange={e => {setChdExtBg(e.target.value); setChdExtEn(e.target.value)}} /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs">Хотел/Accom:</span><input className="w-full border-b" value={accomBg} onChange={e => handleSync(e.target.value, setAccomBg, setAccomEn, accomEn)} /></div>
                            <div><span className="text-xs">Стая/Room:</span><input className="w-full border-b" value={roomBg} onChange={e => handleSync(e.target.value, setRoomBg, setRoomEn, roomEn)} /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs">Check In:</span><input type="datetime-local" className="w-full" value={checkInBg} onChange={e => {setCheckInBg(e.target.value); setCheckInEn(e.target.value)}} /></div>
                            <div><span className="text-xs">Check Out:</span><input type="datetime-local" className="w-full" value={checkOutBg} onChange={e => {setCheckOutBg(e.target.value); setCheckOutEn(e.target.value)}} /></div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 text-xs text-yellow-800 text-center">
                        ℹ️ Това е изглед за редакция. Натиснете бутона "Принтирай", за да видите официалния ваучер.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherPrint;
