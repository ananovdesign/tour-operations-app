import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // ВАЖНО: Ползваме Portal
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

    // --- HANDLERS ---
    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

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

    // --- PRINT CONTENT COMPONENT (За да не дублираме код) ---
    const VoucherContent = ({ isPrintMode }) => (
        <div className={`bg-white w-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden p-8 text-slate-900 mx-auto ${isPrintMode ? 'border-none shadow-none' : 'border border-slate-200'}`}>
            
            <div className="flex justify-center mb-2">
                <img src={Logo} alt="Logo" className="h-16 object-contain" onError={(e) => e.target.style.display='none'} />
            </div>

            <div className="voucher-grid text-sm border border-slate-600">
                <div className="header-bg bg-slate-200 text-center font-black text-[10px] p-1 border-b border-slate-600 uppercase text-black">
                    Република България / Republic of Bulgaria
                </div>

                <div className="voucher-row bg-slate-50 flex border-b border-slate-600">
                    <div className="w-full p-2 flex justify-between items-center">
                        <span className="font-black text-lg uppercase text-black">Ваучер / Voucher:</span>
                        <input type="text" className="text-right text-xl font-black text-red-600 bg-transparent outline-none w-1/2" value={voucherNumber} onChange={e => setVoucherNumber(e.target.value)} placeholder="№" />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600 font-bold text-[10px] text-black">ДАЙНАМЕКС ТУР ЕООД</div>
                    <div className="voucher-col flex-1 p-1 font-bold text-[10px] text-black">DYNAMEX TOUR LTD</div>
                </div>
                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600 text-[9px] text-black">ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</div>
                    <div className="voucher-col flex-1 p-1 text-[9px] text-black">TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</div>
                </div>
                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600 text-[9px] text-black">ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</div>
                    <div className="voucher-col flex-1 p-1 text-[9px] text-black">ID: 208193140, ADDRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</div>
                </div>

                <div className="voucher-row bg-blue-50 flex border-b border-slate-600">
                    <div className="w-full text-center p-1">
                        <select className="bg-transparent font-bold uppercase text-center w-full text-[10px] outline-none appearance-none text-black" value={voucherType} onChange={e => setVoucherType(e.target.value)}>
                            <option value="original">ОРИГИНАЛ / ORIGINAL</option>
                            <option value="copy">КОПИЕ / COPY</option>
                        </select>
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">За представяне в:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={destBg} onChange={e => handleSync(e.target.value, setDestBg, setDestEn, destEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">To:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={destEn} onChange={e => setDestEn(e.target.value)} />
                    </div>
                </div>

                <div className="header-bg bg-slate-200 text-center font-black text-[10px] p-1 border-y border-slate-600 uppercase text-black">
                    Име и Фамилия на Туриста / Name and Surname of Tourist
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="w-full p-2 space-y-1">
                        {tourists.map((t, idx) => (
                            <div key={idx} className="flex gap-2 items-center group">
                                <input className="flex-1 bg-transparent border-b border-dashed border-slate-300 text-xs font-bold text-black outline-none" value={t.bg} onChange={e => updateTourist(idx, 'bg', e.target.value)} placeholder="Име (BG)" />
                                <span className="text-slate-400">/</span>
                                <input className="flex-1 bg-transparent border-b border-dashed border-slate-300 text-xs font-bold text-black outline-none" value={t.en} onChange={e => updateTourist(idx, 'en', e.target.value)} placeholder="Name (EN)" />
                                {!isPrintMode && <button onClick={() => removeTourist(idx)} className="text-red-400 hover:text-red-600 text-xs px-1 opacity-0 group-hover:opacity-100 transition">✕</button>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Възрастни:</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={adultsBg} onChange={e => {setAdultsBg(e.target.value); setAdultsEn(e.target.value)}} /></div>
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Adults:</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={adultsEn} onChange={e => setAdultsEn(e.target.value)} /></div>
                    </div>
                </div>
                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <div className="flex justify-between items-center mb-1"><span className="text-[9px] font-bold text-slate-500 uppercase">Деца (Редовно):</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={chdRegBg} onChange={e => {setChdRegBg(e.target.value); setChdRegEn(e.target.value)}} /></div>
                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Деца (Доп.):</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={chdExtBg} onChange={e => {setChdExtBg(e.target.value); setChdExtEn(e.target.value)}} /></div>
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <div className="flex justify-between items-center mb-1"><span className="text-[9px] font-bold text-slate-500 uppercase">Chd (Regular):</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={chdRegEn} onChange={e => setChdRegEn(e.target.value)} /></div>
                        <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Chd (Extra):</span><input type="number" className="w-10 text-center font-bold text-black bg-transparent" value={chdExtEn} onChange={e => setChdExtEn(e.target.value)} /></div>
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Маршрут:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={itinBg} onChange={e => handleSync(e.target.value, setItinBg, setItinEn, itinEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Itinerary:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={itinEn} onChange={e => setItinEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Място:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={placeBg} onChange={e => handleSync(e.target.value, setPlaceBg, setPlaceEn, placeEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Destination:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={placeEn} onChange={e => setPlaceEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Срок (От - До):</span>
                        <div className="flex gap-1">
                            <input type="date" className="bg-transparent text-[10px] font-bold text-black outline-none" value={startBg} onChange={e => {setStartBg(e.target.value); setStartEn(e.target.value)}} />
                            <span>-</span>
                            <input type="date" className="bg-transparent text-[10px] font-bold text-black outline-none" value={endBg} onChange={e => {setEndBg(e.target.value); setEndEn(e.target.value)}} />
                        </div>
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Period:</span>
                        <div className="flex gap-1">
                            <input type="date" className="bg-transparent text-[10px] font-bold text-black outline-none" value={startEn} onChange={e => setStartEn(e.target.value)} />
                            <span>-</span>
                            <input type="date" className="bg-transparent text-[10px] font-bold text-black outline-none" value={endEn} onChange={e => setEndEn(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Настаняване в:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={accomBg} onChange={e => handleSync(e.target.value, setAccomBg, setAccomEn, accomEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Accommodation at:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={accomEn} onChange={e => setAccomEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Категория / Стая:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={roomBg} onChange={e => handleSync(e.target.value, setRoomBg, setRoomEn, roomEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Category / Room:</span>
                        <input className="w-full bg-transparent font-bold text-xs outline-none text-black" value={roomEn} onChange={e => setRoomEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Пристигане / Заминаване:</span>
                        <div className="flex gap-1 items-center">
                            <input type="datetime-local" className="bg-transparent text-[10px] font-bold text-black outline-none" value={checkInBg} onChange={e => {setCheckInBg(e.target.value); setCheckInEn(e.target.value)}} />
                            <span>/</span>
                            <input type="datetime-local" className="bg-transparent text-[10px] font-bold text-black outline-none" value={checkOutBg} onChange={e => {setCheckOutBg(e.target.value); setCheckOutEn(e.target.value)}} />
                        </div>
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Check-in / Check-out:</span>
                        <div className="flex gap-1 items-center">
                            <input type="datetime-local" className="bg-transparent text-[10px] font-bold text-black outline-none" value={checkInEn} onChange={e => setCheckInEn(e.target.value)} />
                            <span>/</span>
                            <input type="datetime-local" className="bg-transparent text-[10px] font-bold text-black outline-none" value={checkOutEn} onChange={e => setCheckOutEn(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Екскурзии:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={excBg} onChange={e => handleSync(e.target.value, setExcBg, setExcEn, excEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Excursions:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={excEn} onChange={e => setExcEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Други услуги:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={otherBg} onChange={e => handleSync(e.target.value, setOtherBg, setOtherEn, otherEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Other Services:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={otherEn} onChange={e => setOtherEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Забележки:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={noteBg} onChange={e => handleSync(e.target.value, setNoteBg, setNoteEn, noteEn)} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Notes:</span>
                        <textarea className="w-full bg-transparent font-bold text-xs outline-none h-6 resize-none text-black" value={noteEn} onChange={e => setNoteEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex border-b border-slate-600">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Дата на издаване:</span>
                        <input type="date" className="bg-transparent font-bold text-xs outline-none text-black" value={dateIssuedBg} onChange={e => {setDateIssuedBg(e.target.value); setDateIssuedEn(e.target.value)}} />
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Date Issued:</span>
                        <input type="date" className="bg-transparent font-bold text-xs outline-none text-black" value={dateIssuedEn} onChange={e => setDateIssuedEn(e.target.value)} />
                    </div>
                </div>

                <div className="voucher-row flex">
                    <div className="voucher-col flex-1 p-1 border-r border-slate-600">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Документ за плащане (№ / Дата):</span>
                        <div className="flex gap-2">
                            <input className="w-20 bg-transparent font-bold text-xs outline-none text-black" placeholder="№" value={payDocNum} onChange={e => setPayDocNum(e.target.value)} />
                            <input type="date" className="bg-transparent font-bold text-xs outline-none text-black" value={payDocDate} onChange={e => setPayDocDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="voucher-col flex-1 p-1">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Payment Doc (No / Date):</span>
                        <div className="flex gap-2">
                            <input className="w-20 bg-transparent font-bold text-xs outline-none text-black" placeholder="No" value={payDocNum} readOnly />
                            <input type="date" className="bg-transparent font-bold text-xs outline-none text-black" value={payDocDate} readOnly />
                        </div>
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
    );

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            
            {/* CSS FIX ЗА БЯЛ ЕКРАН */}
            <style>{`
                @media print {
                    /* Скриваме основното съдържание на React приложението (#root) */
                    #root {
                        display: none !important;
                    }

                    /* Нулираме body */
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                    }

                    /* Показваме само портала за принтиране */
                    #print-portal-root {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        z-index: 99999;
                    }

                    /* Скриваме бутоните */
                    .no-print { display: none !important; }

                    /* Задължително черни бордове и текст */
                    .voucher-grid, .voucher-row, .voucher-col { border-color: #000 !important; }
                    input, textarea, select { color: #000 !important; }
                }
                
                /* Grid Helpers */
                .voucher-grid { border: 1px solid #64748b; }
            `}</style>

            {/* БУТОНИ ЗА УПРАВЛЕНИЕ */}
            <div className="no-print fixed bottom-6 right-6 flex gap-4 z-50">
                <button onClick={addTourist} className="bg-white text-blue-600 border border-blue-200 px-4 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition">
                    + Турист
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    🖨️ Принтирай
                </button>
            </div>

            {/* ВИЗУАЛИЗАЦИЯ НА ЕКРАНА (Интерактивна) */}
            <VoucherContent isPrintMode={false} />

            {/* СКРИТА ВИЗУАЛИЗАЦИЯ ЗА ПРИНТ (С ПОРТАЛ) */}
            {createPortal(
                <div id="print-portal-root" style={{ display: 'none' }}>
                    <VoucherContent isPrintMode={true} />
                </div>,
                document.body
            )}
        </div>
    );
};

export default VoucherPrint;
