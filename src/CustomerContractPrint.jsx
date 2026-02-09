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

const CustomerContractPrint = ({ reservationData, onPrintFinish }) => {
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('tab-1');
    const [tourists, setTourists] = useState([]);
    
    // Държим всички данни за договора в един state обект за по-лесно управление
    const [formData, setFormData] = useState({
        contractNumber: '',
        signingDate: '',
        
        // Main Tourist
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
        transportDesc: 'СОБСТВЕН ТРАНСПОРТ - ОСИГУРЕН ОТ ТУРИСТИТЕ',
        departureInfo: 'СОБСТВЕН ТРАНСПОРТ',
        returnInfo: 'СОБСТВЕН ТРАНСПОРТ',
        accommodationDesc: '',
        roomType: '',
        mealsDesc: '',
        otherServices: 'Водач-представител на фирмата по време на цялото пътуване;',
        specialReqs: '',

        // Financials
        totalPrice: '',
        otherPayments: '',
        childDiscount: '',
        adultDiscount: '',
        singleRoomFee: '',
        extraExcursion: '',
        insurance: 'НЕ Е ВКЛЮЧЕНА В ЦЕНАТА. ТУРИСТИТЕ СЕ ЗАДЪЛЖАВАТ ДА СКЛЮЧАТ ТАКАВА',
        finalAmount: '',
        paymentTerms: '',
        depositAmount: '',
        finalPayment: ''
    });

    // --- POPULATE DATA ---
    useEffect(() => {
        if (reservationData) {
            // 1. Calculate Duration
            let durationStr = '';
            if (reservationData.checkIn && reservationData.checkOut) {
                const start = new Date(reservationData.checkIn);
                const end = new Date(reservationData.checkOut);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                durationStr = `${diffDays + 1} дни / ${diffDays} нощувки`;
            }

            // 2. Main Tourist
            const lead = reservationData.tourists?.[0] || {};
            const mainName = `${lead.firstName || ''} ${lead.fatherName || ''} ${lead.familyName || ''}`.trim();
            const mainAddress = `${lead.address || ''}, ${lead.city || ''}, ${lead.postCode || ''}`.trim().replace(/^, , $/, '');

            // 3. Financials
            const total = reservationData.finalAmount || 0;
            const deposit = reservationData.depositAmount || 0;
            const remainder = total - deposit;
            
            // Calc final payment date (30 days before checkin)
            let finalDateStr = '..................';
            if (reservationData.checkIn) {
                const d = new Date(reservationData.checkIn);
                d.setDate(d.getDate() - 30);
                finalDateStr = formatDateBG(d);
            }

            // 4. Update State
            setFormData(prev => ({
                ...prev,
                contractNumber: reservationData.reservationNumber || '',
                signingDate: reservationData.creationDate ? formatDateForInput(reservationData.creationDate) : new Date().toISOString().split('T')[0],
                
                mainName: mainName,
                mainEGN: lead.realId || '',
                mainIdCard: '', // Blank by default
                mainAddress: mainAddress,
                mainPhone: lead.phone || '',
                mainEmail: lead.email || '',

                startDate: reservationData.checkIn ? formatDateForInput(reservationData.checkIn) : '',
                endDate: reservationData.checkOut ? formatDateForInput(reservationData.checkOut) : '',
                duration: durationStr,
                
                accommodationDesc: `${reservationData.hotel || ''}, ${reservationData.place || ''}`,
                roomType: reservationData.roomType || '',
                mealsDesc: reservationData.food || '',
                specialReqs: reservationData.specialReqs || '',

                totalPrice: total.toFixed(2),
                finalAmount: remainder.toFixed(2),
                depositAmount: deposit.toFixed(2),
                finalPayment: `${remainder.toFixed(2)} лв. до ${finalDateStr}`,
                paymentTerms: `Плащането е в брой в офис или по банка.\nIBAN BG87BPBI79301036586601\nПолучател: ДАЙНАМЕКС ТУР\nОснование: ${reservationData.reservationNumber || ''}`
            }));

            // 5. Populate Tourists List (excluding lead if needed, or keeping structure)
            const others = (reservationData.tourists || []).slice(1).map(t => ({
                name: `${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(),
                egn: t.realId || '',
                idCard: ''
            }));
            setTourists(others);
        }
    }, [reservationData]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTouristChange = (index, field, value) => {
        const newTourists = [...tourists];
        newTourists[index][field] = value;
        setTourists(newTourists);
    };

    const addTourist = () => setTourists([...tourists, { name: '', egn: '', idCard: '' }]);
    const removeTourist = (index) => setTourists(tourists.filter((_, i) => i !== index));

    // --- PRINT LOGIC (POP-UP) ---
    const handlePrint = () => {
        // Prepare Tourist Table Rows (We need 13 rows total strictly for layout)
        let touristRows = '';
        
        // 1. Add Main Tourist
        touristRows += `
            <tr>
                <td>1</td>
                <td>${formData.mainName}</td>
                <td>${formData.mainEGN}</td>
                <td>${formData.mainIdCard}</td>
            </tr>
        `;

        // 2. Add Other Tourists
        tourists.forEach((t, idx) => {
            touristRows += `
                <tr>
                    <td>${idx + 2}</td>
                    <td>${t.name}</td>
                    <td>${t.egn}</td>
                    <td>${t.idCard}</td>
                </tr>
            `;
        });

        // 3. Fill remaining rows to reach 13 (standard contract size)
        const currentCount = 1 + tourists.length;
        for (let i = currentCount; i < 13; i++) {
            touristRows += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Договор № ${formData.contractNumber}</title>
            <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Arimo', sans-serif; font-size: 11px; line-height: 1.3; color: #000; margin: 0; padding: 20px; }
                @media print {
                    @page { size: A4; margin: 10mm 15mm; }
                    body { margin: 0; }
                    .page-break { page-break-after: always; }
                    button { display: none; }
                }
                
                h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
                h2 { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
                p { margin: 5px 0; text-align: justify; }
                
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .red { color: red; }
                
                /* Tourist Table */
                table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
                th, td { border: 1px solid #000; padding: 3px 5px; }
                th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
                td { height: 18px; } /* Fixed height for consistency */
                
                /* Signatures */
                .signatures { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 10px; }
                .signatures div { width: 40%; text-align: center; }
                .sig-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px; }
                
                /* Header Info */
                .contract-parties { margin: 15px 0; border: 1px solid #ddd; padding: 10px; }
            </style>
        </head>
        <body>
            
            <h1>ДОГОВОР ЗА ТУРИСТИЧЕСКИ ПАКЕТ № <span class="red">${formData.contractNumber}</span></h1>
            <p class="text-center">съгласно разпоредбите на Закона за туризма</p>
            
            <p>Днес, <b>${formatDateBG(formData.signingDate)}</b> в гр. Ракитово, се подписа настоящия договор за пътуване между:</p>
            
            <p><b>“ДАЙНАМЕКС ТУР” ЕООД</b> с удостоверение за туроператор № РК-01-8569/15.04.2025г., с адрес на управление гр. Ракитово, ул. "Васил Куртев" №12А, тел. 0879976446, Булстат № BG208193140, представлявана и управлявана от КРАСИМИР ЕМИЛОВ АНАНОВ, наричан по долу за краткост <b>ТУРОПЕРАТОР</b> от една страна и</p>
            
            <div style="margin: 10px 0; padding: 5px; background: #f9f9f9; border: 1px solid #eee;">
                <p>ИМЕНА: <b>${formData.mainName}</b>, ЕГН: <b>${formData.mainEGN}</b>, Л.К. №: <b>${formData.mainIdCard}</b></p>
                <p>АДРЕС: <b>${formData.mainAddress}</b></p>
                <p>GSM: <b>${formData.mainPhone}</b>, EMAIL: <b>${formData.mainEmail}</b></p>
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
            <p>2. Туроператорът приема да организира туристическото пътуване на Потребителя по определен маршрут заплащане на договорената цена при условията на настоящия договор.</p>
            <p>3. Организирано туристическо пътуване е при следните условия:</p>

            <p><b>3.1. Маршрут на пътуването</b><br/>
            Начална дата: <b>${formatDateBG(formData.startDate)}</b> &nbsp;&nbsp; Крайна дата: <b>${formatDateBG(formData.endDate)}</b> &nbsp;&nbsp; Продължителност: <b>${formData.duration}</b></p>

            <p><b>3.2. Основни услуги, включени в общата цена</b><br/>
            1. Транспорт: ${formData.transportDesc}<br/>
            Час и място на тръгване: ${formData.departureInfo}<br/>
            Час и място на връщане: ${formData.returnInfo}<br/>
            2. Настаняване: ${formData.accommodationDesc}<br/>
            Брой и вид стаи: ${formData.roomType}<br/>
            3. Брой и вид на храненията: ${formData.mealsDesc}</p>

            <p><b>3.3. Други услуги:</b> ${formData.otherServices}</p>
            <p><b>3.4. Специални изисквания:</b> ${formData.specialReqs}</p>

            <p><b>3.5. Обща цена в лева:</b> <b>${formData.totalPrice} лв.</b></p>
            <p>3.5.1. Други плащания: ${formData.otherPayments}</p>
            <p>3.5.1.1. Отстъпки за деца: ${formData.childDiscount}</p>
            <p>3.5.1.2. Отстъпки 3-ти възрастен: ${formData.adultDiscount}</p>
            <p>3.5.1.3. Доплащане ед. стая: ${formData.singleRoomFee}</p>
            <p>3.5.1.4. Доп. екскурзия: ${formData.extraExcursion}</p>
            <p>3.5.1.5. Застраховка: <b>${formData.insurance}</b></p>

            <p><b>3.6. Крайна обща дължима сума:</b> <b>${formData.finalAmount} лв.</b></p>
            <p><b>3.7. Начин и срок за плащане:</b> ${formData.paymentTerms.replace(/\n/g, '<br/>')}</p>

            <div style="border: 1px solid #000; padding: 10px; margin: 10px 0;">
                <p>ПОТВЪРЖДАВАМ от свое име и от името на гореизброените туристи, че съм запознат с условията за записване и програмата на пътуването и внасям депозит от <b>${formData.depositAmount} лв.</b></p>
                <p>Потребителят се задължава да заплати остатъка от пълната сума в размер на <b>${formData.finalPayment}</b>.</p>
            </div>

            <div class="signatures">
                <div>
                    <div class="sig-line"></div>
                    <span style="font-size: 9px;">ЗА ТУРОПЕРАТОРА</span>
                </div>
                <div>
                    <div class="sig-line"></div>
                    <span style="font-size: 9px;">ЗА ПОТРЕБИТЕЛЯ</span>
                </div>
            </div>

            <div class="page-break"></div>

            <h2>ПРИЛОЖЕНИЕ № 1 - ДЕКЛАРАЦИЯ ЗА ЛИЧНИ ДАННИ</h2>
            <p>В качеството си на администратор на лични данни, „ДАЙНАМЕКС ТУР” ЕООД, ЕИК 208193140, следва да е получило и/или ще получи от Вас лични данни, които ще обработва, за да предостави услугите си...</p>
            
            <div style="margin-top: 30px;">
                <p>........................................................................</p>
                <p>ТРИ ИМЕНА И ПОДПИС</p>
                <p>ДАТА: <b>${formatDateBG(formData.signingDate)}</b></p>
            </div>

            <h2 style="margin-top: 40px;">ДЕКЛАРАЦИЯ - ПОТВЪРЖДЕНИЕ ЗА ИНФОРМИРАНОСТ</h2>
            <p>Долуподписаният <b>${formData.mainName}</b>, ЕГН: <b>${formData.mainEGN}</b>, в качеството ми на Потребител по Договор № <b>${formData.contractNumber}</b></p>
            <p>ДЕКЛАРИРАМ, ЧЕ: Преди да подпиша договора за туристически пакет, от Туроператора и/или Турагента, в това число и чрез електронния сайт на Дружеството, съм получил цялата съпътстваща информация за условията на пакета...</p>

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
            alert('Моля, разрешете изскачащите прозорци (Pop-ups), за да принтирате договора.');
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 pb-20">
            
            {/* Header */}
            <div className="w-full max-w-5xl mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Редакция на Договор</h1>
                    <p className="text-slate-500 text-sm">Прегледайте и редактирайте данните преди печат.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onPrintFinish} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-200 transition">
                        Назад
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition">
                        🖨️ Принтирай Договор
                    </button>
                </div>
            </div>

            {/* MAIN EDIT CARD */}
            <div className="bg-white w-full max-w-5xl shadow-xl rounded-lg overflow-hidden border border-slate-200">
                
                {/* TABS HEADER */}
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
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Номер на договор</label>
                                <input name="contractNumber" value={formData.contractNumber} onChange={handleChange} className="w-full p-2 border rounded bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дата на подписване</label>
                                <input type="date" name="signingDate" value={formData.signingDate} onChange={handleChange} className="w-full p-2 border rounded bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">Данни на Титуляра</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500">Имена</label>
                                    <input name="mainName" value={formData.mainName} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">ЕГН</label>
                                    <input name="mainEGN" value={formData.mainEGN} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">ЛК № (Оставете празно, ако няма)</label>
                                    <input name="mainIdCard" value={formData.mainIdCard} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Лична карта" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500">Адрес</label>
                                    <input name="mainAddress" value={formData.mainAddress} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Телефон</label>
                                    <input name="mainPhone" value={formData.mainPhone} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Email</label>
                                    <input name="mainEmail" value={formData.mainEmail} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB 2: TOURISTS */}
                    <div className={activeTab === 'tab-2' ? 'block' : 'hidden'}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Списък с придружаващи туристи</h3>
                            <button onClick={addTourist} className="px-3 py-1 bg-green-500 text-white rounded text-sm font-bold hover:bg-green-600">+ Добави</button>
                        </div>
                        <div className="space-y-2">
                            {tourists.map((t, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border">
                                    <span className="text-slate-400 font-bold w-6">{idx + 1}.</span>
                                    <input 
                                        className="flex-1 p-1 border rounded text-sm" 
                                        placeholder="Имена" 
                                        value={t.name} 
                                        onChange={(e) => handleTouristChange(idx, 'name', e.target.value)} 
                                    />
                                    <input 
                                        className="w-32 p-1 border rounded text-sm" 
                                        placeholder="ЕГН" 
                                        value={t.egn} 
                                        onChange={(e) => handleTouristChange(idx, 'egn', e.target.value)} 
                                    />
                                    <input 
                                        className="w-32 p-1 border rounded text-sm" 
                                        placeholder="ЛК №" 
                                        value={t.idCard} 
                                        onChange={(e) => handleTouristChange(idx, 'idCard', e.target.value)} 
                                    />
                                    <button onClick={() => removeTourist(idx)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
                                </div>
                            ))}
                            {tourists.length === 0 && <p className="text-slate-400 text-center italic py-4">Няма добавени допълнителни туристи.</p>}
                        </div>
                    </div>

                    {/* TAB 3: TRIP DETAILS */}
                    <div className={activeTab === 'tab-3' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><label className="label-clean">Start</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">End</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">Duration</label><input name="duration" value={formData.duration} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="label-clean">Транспорт</label><textarea name="transportDesc" value={formData.transportDesc} onChange={handleChange} className="w-full border p-2 rounded h-16" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-clean">Тръгване</label><input name="departureInfo" value={formData.departureInfo} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                                <div><label className="label-clean">Връщане</label><input name="returnInfo" value={formData.returnInfo} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            </div>
                            <div><label className="label-clean">Настаняване</label><textarea name="accommodationDesc" value={formData.accommodationDesc} onChange={handleChange} className="w-full border p-2 rounded h-16" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-clean">Стаи</label><input name="roomType" value={formData.roomType} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                                <div><label className="label-clean">Храна</label><input name="mealsDesc" value={formData.mealsDesc} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            </div>
                            <div><label className="label-clean">Други услуги</label><textarea name="otherServices" value={formData.otherServices} onChange={handleChange} className="w-full border p-2 rounded h-16" /></div>
                            <div><label className="label-clean">Специални изисквания</label><textarea name="specialReqs" value={formData.specialReqs} onChange={handleChange} className="w-full border p-2 rounded h-16" /></div>
                        </div>
                    </div>

                    {/* TAB 4: FINANCIALS */}
                    <div className={activeTab === 'tab-4' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="label-clean text-blue-600">ОБЩА ЦЕНА</label><input type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} className="w-full border-2 border-blue-100 p-2 rounded font-bold" /></div>
                            <div><label className="label-clean text-green-600">КРАЙНА ДЪЛЖИМА СУМА</label><input name="finalAmount" value={formData.finalAmount} onChange={handleChange} className="w-full border-2 border-green-100 p-2 rounded font-bold" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div><label className="label-clean">Депозит</label><input name="depositAmount" value={formData.depositAmount} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                            <div><label className="label-clean">Финално плащане (Текст)</label><input name="finalPayment" value={formData.finalPayment} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><label className="label-clean">Отстъпка дете</label><input name="childDiscount" value={formData.childDiscount} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                            <div><label className="label-clean">Отстъпка възрастен</label><input name="adultDiscount" value={formData.adultDiscount} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                            <div><label className="label-clean">Доплащане единична</label><input name="singleRoomFee" value={formData.singleRoomFee} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                            <div><label className="label-clean">Доп. екскурзия</label><input name="extraExcursion" value={formData.extraExcursion} onChange={handleChange} className="w-full border p-1 rounded" /></div>
                        </div>
                        <div className="mt-4">
                            <label className="label-clean">Начин на плащане (Банкова сметка)</label>
                            <textarea name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full border p-2 rounded h-24 font-mono text-xs" />
                        </div>
                    </div>

                </div>
                
                {/* FOOTER */}
                <div className="bg-slate-50 p-4 border-t text-center text-slate-500 text-xs">
                    Попълнете внимателно данните. При натискане на "Принтирай", ще се отвори нов прозорец с готовия за печат договор.
                </div>
            </div>

            <style>{`
                .label-clean { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem; }
            `}</style>
        </div>
    );
};

export default CustomerContractPrint;
