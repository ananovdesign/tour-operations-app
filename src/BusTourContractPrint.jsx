import React, { useEffect, useState } from 'react';
import Logo from './Logo.png'; 

// --- Helper Functions ---
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const formatDateBG = (dateString) => {
    if (!dateString) return '..................';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}г.`;
};

const BusTourContractPrint = ({ tourData, allReservations, onPrintFinish }) => {
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('tab-1');
    const [allTourists, setAllTourists] = useState([]); // Списък с всички туристи от всички резервации

    // Единен обект за данните на договора
    const [formData, setFormData] = useState({
        contractNumber: '',
        signingDate: '',
        
        // Main Tourist (Lead Guest from 1st reservation)
        mainName: '',
        mainEGN: '',
        mainIdCard: '',
        mainAddress: '',
        mainPhone: '',
        mainEmail: '',

        // Trip Details
        startDate: '',
        endDate: '',
        duration: '',
        transportDesc: '',
        departureInfo: '',
        returnInfo: '',
        accommodationDesc: '',
        roomType: '',
        mealsDesc: '',
        otherServices: 'Водач-представител на фирмата по време на цялото пътуване;',
        specialReqs: '',

        // Financials
        totalPrice: 0,
        otherPayments: '',
        childDiscount: '',
        adultDiscount: '',
        singleRoomFee: '',
        extraExcursion: '',
        insurance: 'НЕ Е ВКЛЮЧЕНА В ЦЕНАТА. ТУРИСТИТЕ СЕ ЗАДЪЛЖАВАТ ДА СКЛЮЧАТ ТАКАВА',
        finalAmount: 0,
        paymentTerms: 'Плащането е по договаряне. За повече информация, моля свържете се с Туроператора.',
        depositAmount: 0,
        finalPayment: ''
    });

    // --- POPULATE DATA (Logic to aggregate reservations) ---
    useEffect(() => {
        if (tourData && allReservations) {
            // 1. Намираме всички резервации за този тур
            const linkedReservations = allReservations.filter(res => res.linkedTourId === tourData.tourId);
            
            // Сортираме ги по дата на създаване (най-ранната е водеща)
            linkedReservations.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));

            // 2. Определяме Титуляра (Първият човек от първата резервация)
            let leadGuest = null;
            if (linkedReservations.length > 0 && linkedReservations[0].tourists.length > 0) {
                leadGuest = linkedReservations[0].tourists[0];
            }

            // 3. Събираме ВСИЧКИ туристи в един списък (за таблицата)
            const collectedTourists = [];
            const uniqueKeys = new Set();

            linkedReservations.forEach(res => {
                if(res.tourists){
                    res.tourists.forEach(t => {
                        // Уникален ключ, за да избегнем дублиране ако има бъг в базата
                        const key = `${t.firstName}-${t.familyName}-${t.realId}`;
                        if(!uniqueKeys.has(key)){
                            uniqueKeys.add(key);
                            collectedTourists.push({
                                name: `${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(),
                                egn: t.realId || '',
                                idCard: t.idCard || '' // Ако имаме данни за ЛК, ги взимаме
                            });
                        }
                    });
                }
            });
            setAllTourists(collectedTourists);

            // 4. Изчисляване на продължителност
            let durationStr = '';
            if (tourData.departureDate && tourData.arrivalDate) {
                const start = new Date(tourData.departureDate);
                const end = new Date(tourData.arrivalDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                durationStr = `${diffDays + 1} дни / ${diffDays} нощувки`;
            }

            // 5. Попълване на формата
            setFormData(prev => ({
                ...prev,
                contractNumber: tourData.tourId || '',
                signingDate: new Date().toISOString().split('T')[0],
                
                mainName: leadGuest ? `${leadGuest.firstName || ''} ${leadGuest.fatherName || ''} ${leadGuest.familyName || ''}`.trim() : '',
                mainEGN: leadGuest ? (leadGuest.realId || '') : '',
                mainIdCard: '', // Обикновено празно за договора
                mainAddress: leadGuest ? `${leadGuest.address || ''}, ${leadGuest.city || ''}`.trim() : '',
                mainPhone: leadGuest ? (leadGuest.phone || '') : '',
                mainEmail: leadGuest ? (leadGuest.email || '') : '',

                startDate: tourData.departureDate || '',
                endDate: tourData.arrivalDate || '',
                duration: durationStr,
                transportDesc: tourData.transportDescription || '',
                departureInfo: tourData.departureDateTimePlace || '',
                returnInfo: `Около ${tourData.arrivalDate || '...'} на ${tourData.departureDateTimePlace || '...' }`,
                accommodationDesc: tourData.tourHotels || '',
                roomType: tourData.tourRoomSummary || '',
                mealsDesc: tourData.mealsIncluded || '',
                
                // Финансовите полета за групов договор често са общи или 0,
                // тъй като всеки плаща отделно, но тук ги оставяме редактируеми
                totalPrice: 0, 
                finalAmount: 0,
                depositAmount: 0,
                finalPayment: ''
            }));
        }
    }, [tourData, allReservations]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- PRINT LOGIC (POP-UP WINDOW) ---
    const handlePrint = () => {
        // Generate Tourist Table Rows (Max 13 empty slots usually, or dynamic)
        let touristRows = '';
        allTourists.forEach((t, idx) => {
            touristRows += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${t.name}</td>
                    <td>${t.egn}</td>
                    <td>${t.idCard}</td>
                </tr>
            `;
        });

        // Fill remaining rows to look like a standard document (up to 13)
        const currentCount = allTourists.length;
        const rowsNeeded = Math.max(0, 13 - currentCount);
        for (let i = 0; i < rowsNeeded; i++) {
            touristRows += `<tr><td>${currentCount + i + 1}</td><td></td><td></td><td></td></tr>`;
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Договор Тур № ${formData.contractNumber}</title>
            <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Arimo', sans-serif; font-size: 11px; line-height: 1.3; color: #000; margin: 0; padding: 20px; }
                @media print {
                    @page { size: A4; margin: 10mm 15mm; }
                    body { margin: 0; }
                    .page-break { page-break-after: always; }
                }
                
                h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
                h2 { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
                p { margin: 5px 0; text-align: justify; }
                
                table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
                th, td { border: 1px solid #000; padding: 3px 5px; }
                th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
                td { height: 18px; }
                
                .signatures { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 10px; }
                .signatures div { width: 40%; text-align: center; }
                .sig-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            
            <h1>ДОГОВОР ЗА ТУРИСТИЧЕСКИ ПАКЕТ № <span style="color:red">${formData.contractNumber}</span></h1>
            <p style="text-align:center">съгласно разпоредбите на Закона за туризма</p>
            
            <p>Днес, <b>${formatDateBG(formData.signingDate)}</b> в гр. Ракитово, се подписа настоящия договор за пътуване между:</p>
            
            <p><b>“ДАЙНАМЕКС ТУР” ЕООД</b> с удостоверение за туроператор № РК-01-8569/15.04.2025г., с адрес на управление гр. Ракитово, ул. "Васил Куртев" №12А, тел. 0879976446, Булстат № BG208193140, представлявана и управлявана от КРАСИМИР ЕМИЛОВ АНАНОВ, наричан по долу за краткост <b>ТУРОПЕРАТОР</b> от една страна и</p>
            
            <div style="margin: 10px 0; padding: 5px; background: #f9f9f9; border: 1px solid #eee;">
                <p>ИМЕНА: <b>${formData.mainName}</b>, ЕГН: <b>${formData.mainEGN}</b>, Л.К. №: <b>${formData.mainIdCard}</b></p>
                <p>АДРЕС: <b>${formData.mainAddress}</b>, GSM: <b>${formData.mainPhone}</b>, EMAIL: <b>${formData.mainEmail}</b></p>
            </div>
            
            <p>от друга страна, наричан за краткост <b>ПОТРЕБИТЕЛ</b> се сключи настоящият договор за следното:</p>

            <p style="margin-top: 10px; font-weight: bold; text-align: center;">Данни на всички туристи в пакетното пътуване:</p>
            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">№</th>
                        <th>Трите имена по док. за самоличност</th>
                        <th>ЕГН/ЛНЧ</th>
                        <th>№ паспорт/л.к.</th>
                    </tr>
                </thead>
                <tbody>
                    ${touristRows}
                </tbody>
            </table>

            <div class="page-break"></div>

            <h2>І. ПРЕДМЕТ НА ДОГОВОРА</h2>
            <p>1. Потребителят възлага и заплаща на Туроператора да му предостави туристическо пътуване при определен маршрут и платена от него цена при условията на настоящия договор.</p>
            <p>3. Организирано туристическо пътуване е при следните условия:</p>

            <p><b>3.1. Маршрут на пътуването</b><br/>
            Начална дата: <b>${formatDateBG(formData.startDate)}</b> &nbsp;&nbsp; Крайна дата: <b>${formatDateBG(formData.endDate)}</b> &nbsp;&nbsp; Продължителност: <b>${formData.duration}</b></p>

            <p><b>3.2. Основни услуги</b><br/>
            Транспорт: ${formData.transportDesc}<br/>
            Тръгване: ${formData.departureInfo} &nbsp;&nbsp; Връщане: ${formData.returnInfo}<br/>
            Настаняване: ${formData.accommodationDesc}<br/>
            Брой/вид стаи: ${formData.roomType}<br/>
            Хранения: ${formData.mealsDesc}</p>

            <p><b>3.3. Други услуги:</b> ${formData.otherServices}</p>
            <p><b>3.4. Специални изисквания:</b> ${formData.specialReqs}</p>

            <p><b>3.5. Обща цена в лева:</b> <b>${formData.totalPrice} лв.</b></p>
            <p>Други плащания: ${formData.otherPayments}</p>
            <p>Отстъпки (дете/възрастен): ${formData.childDiscount} / ${formData.adultDiscount}</p>
            <p>Доплащане ед. стая: ${formData.singleRoomFee}</p>
            <p>Застраховка: <b>${formData.insurance}</b></p>

            <p><b>3.6. Крайна обща дължима сума:</b> <b>${formData.finalAmount} лв.</b></p>
            <p><b>3.7. Начин на плащане:</b> ${formData.paymentTerms}</p>

            <div style="border: 1px solid #000; padding: 10px; margin: 10px 0;">
                <p>Внасям депозит от <b>${formData.depositAmount} лв.</b></p>
                <p>Остатък за плащане: <b>${formData.finalPayment}</b>.</p>
            </div>

            <div class="signatures">
                <div><div class="sig-line"></div><span style="font-size: 9px;">ЗА ТУРОПЕРАТОРА</span></div>
                <div><div class="sig-line"></div><span style="font-size: 9px;">ЗА ПОТРЕБИТЕЛЯ</span></div>
            </div>

            <div class="page-break"></div>

            <h2>ПРИЛОЖЕНИЕ № 1 - ДЕКЛАРАЦИЯ ЗА ЛИЧНИ ДАННИ</h2>
            <p>В качеството си на администратор на лични данни, „ДАЙНАМЕКС ТУР” ЕООД, ЕИК 208193140, следва да е получило и/или ще получи от Вас лични данни...</p>
            
            <div style="margin-top: 30px;">
                <p>........................................................................</p>
                <p>ТРИ ИМЕНА И ПОДПИС</p>
                <p>ДАТА: <b>${formatDateBG(formData.signingDate)}</b></p>
            </div>

            <h2 style="margin-top: 40px;">ДЕКЛАРАЦИЯ - ИНФОРМИРАНОСТ</h2>
            <p>Долуподписаният <b>${formData.mainName}</b>, ЕГН: <b>${formData.mainEGN}</b>, Потребител по Договор № <b>${formData.contractNumber}</b></p>
            <p>ДЕКЛАРИРАМ, ЧЕ: Преди да подпиша договора за туристически пакет, съм получил цялата съпътстваща информация...</p>

            <div style="margin-top: 30px; text-align: right;">
                <p>ДАТА: <b>${formatDateBG(formData.signingDate)}</b></p>
                <p>(подпис) ................................</p>
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

    if (!tourData) {
        return <div className="text-center p-10">Зареждане на данни за тура...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            
            {/* Header */}
            <div className="w-full max-w-5xl mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Групов Договор (Тур)</h1>
                    <p className="text-slate-500 text-sm">Генериране на договор за всички туристи в тура.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onPrintFinish} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-200 transition">
                        Назад
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition">
                        🖨️ Принтирай
                    </button>
                </div>
            </div>

            {/* MAIN EDIT CARD */}
            <div className="bg-white w-full max-w-5xl shadow-xl rounded-lg overflow-hidden border border-slate-200">
                
                {/* TABS */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    {['1. Основни', '2. Туристи', '3. Пътуване', '4. Финанси'].map((label, idx) => {
                        const id = `tab-${idx + 1}`;
                        return (
                            <button 
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === id ? 'bg-white text-blue-600 border-t-4 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* FORM CONTENT */}
                <div className="p-8">
                    
                    {/* TAB 1: BASIC INFO */}
                    <div className={activeTab === 'tab-1' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="label-clean">Договор №</label><input name="contractNumber" value={formData.contractNumber} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            <div><label className="label-clean">Дата на подписване</label><input type="date" name="signingDate" value={formData.signingDate} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">Данни на Титуляра (Водещ на групата)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="label-clean">Имена</label><input name="mainName" value={formData.mainName} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div><label className="label-clean">ЕГН</label><input name="mainEGN" value={formData.mainEGN} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div><label className="label-clean">ЛК №</label><input name="mainIdCard" value={formData.mainIdCard} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div className="col-span-2"><label className="label-clean">Адрес</label><input name="mainAddress" value={formData.mainAddress} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div><label className="label-clean">Телефон</label><input name="mainPhone" value={formData.mainPhone} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div><label className="label-clean">Email</label><input name="mainEmail" value={formData.mainEmail} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 2: TOURISTS */}
                    <div className={activeTab === 'tab-2' ? 'block' : 'hidden'}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Списък на всички туристи в тура ({allTourists.length})</h3>
                        </div>
                        <div className="overflow-y-auto max-h-[400px] border rounded">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 border">№</th>
                                        <th className="px-4 py-2 border">Имена</th>
                                        <th className="px-4 py-2 border">ЕГН</th>
                                        <th className="px-4 py-2 border">ЛК</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTourists.map((t, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2">{idx + 1}</td>
                                            <td className="px-4 py-2">{t.name}</td>
                                            <td className="px-4 py-2">{t.egn}</td>
                                            <td className="px-4 py-2">{t.idCard}</td>
                                        </tr>
                                    ))}
                                    {allTourists.length === 0 && <tr><td colSpan="4" className="text-center py-4">Няма намерени туристи.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* TAB 3: TRIP DETAILS */}
                    <div className={activeTab === 'tab-3' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><label className="label-clean">Начало</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">Край</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">Продължителност</label><input name="duration" value={formData.duration} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="label-clean">Транспорт</label><textarea name="transportDesc" value={formData.transportDesc} onChange={handleChange} className="w-full border p-2 rounded h-12" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-clean">Тръгване</label><input name="departureInfo" value={formData.departureInfo} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                                <div><label className="label-clean">Връщане</label><input name="returnInfo" value={formData.returnInfo} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            </div>
                            <div><label className="label-clean">Настаняване</label><textarea name="accommodationDesc" value={formData.accommodationDesc} onChange={handleChange} className="w-full border p-2 rounded h-12" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-clean">Стаи</label><input name="roomType" value={formData.roomType} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                                <div><label className="label-clean">Храна</label><input name="mealsDesc" value={formData.mealsDesc} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            </div>
                            <div><label className="label-clean">Други услуги</label><textarea name="otherServices" value={formData.otherServices} onChange={handleChange} className="w-full border p-2 rounded h-12" /></div>
                            <div><label className="label-clean">Специални изисквания</label><textarea name="specialReqs" value={formData.specialReqs} onChange={handleChange} className="w-full border p-2 rounded h-12" /></div>
                        </div>
                    </div>

                    {/* TAB 4: FINANCIALS */}
                    <div className={activeTab === 'tab-4' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="label-clean text-blue-600">ОБЩА ЦЕНА</label><input type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} className="w-full border-2 border-blue-100 p-2 rounded font-bold" /></div>
                            <div><label className="label-clean text-green-600">КРАЙНА СУМА</label><input name="finalAmount" value={formData.finalAmount} onChange={handleChange} className="w-full border-2 border-green-100 p-2 rounded font-bold" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div><label className="label-clean">Депозит</label><input name="depositAmount" value={formData.depositAmount} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">Финално плащане (Текст)</label><input name="finalPayment" value={formData.finalPayment} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><label className="label-clean">Отстъпка дете</label><input name="childDiscount" value={formData.childDiscount} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                            <div><label className="label-clean">Отстъпка възрастен</label><input name="adultDiscount" value={formData.adultDiscount} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                            <div><label className="label-clean">Доп. екскурзия</label><input name="extraExcursion" value={formData.extraExcursion} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                        </div>
                        <div className="mt-4">
                            <label className="label-clean">Условия за плащане</label>
                            <textarea name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full border p-2 rounded h-24 font-mono text-xs" />
                        </div>
                    </div>

                </div>
                
                <div className="bg-slate-50 p-4 border-t text-center text-slate-500 text-xs">
                    Натиснете "Принтирай", за да генерирате официалния договор в нов прозорец.
                </div>
            </div>

            <style>{`
                .label-clean { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem; }
            `}</style>
        </div>
    );
};

export default BusTourContractPrint;
