import React, { useEffect, useRef, useState, useCallback } from 'react';
import './CustomerContractPrint.css'; // Import the new CSS file

const CustomerContractPrint = ({ reservationData, onPrintFinish }) => {
    const formRef = useRef(null); // Ref for the form to interact with its inputs
    const [tourists, setTourists] = useState([]); // State for additional tourists in the form
    const [activeTab, setActiveTab] = useState('tab-1'); // State for active tab in the form

    // Function to format dates for Bulgarian locale
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '..................';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}.${month}.${year}г.`;
    }, []);

    // Function to populate the HIDDEN print-only content
    const populatePrintContent = useCallback(() => {
        if (!formRef.current) return;
        const form = formRef.current;

        // Helper to get value from form elements and provide fallback or suffix
        const getValue = (name, fallback = '..................', suffix = '') => {
            const element = form.elements[name];
            return (element && element.value !== '' ? element.value : fallback) + suffix;
        };
        const getOptionalValue = (name, fallback = 'Няма.') => form.elements[name].value || fallback;

        // Populate contract data in the print-only div
        document.getElementById('pdf-contractNumber').textContent = getValue('contractNumber', '').replace('..................', '');
        document.getElementById('pdf-signingDate').textContent = formatDate(form.elements.signingDate.value);
        document.getElementById('pdf-mainTouristName').textContent = getValue('mainTouristName');
        document.getElementById('pdf-mainTouristEGN').textContent = getValue('mainTouristEGN');
        document.getElementById('pdf-mainTouristIdCard').textContent = ''; // BLANK as requested
        document.getElementById('pdf-mainTouristAddress').textContent = getValue('mainTouristAddress');
        document.getElementById('pdf-mainTouristPhone').textContent = getValue('mainTouristPhone');
        document.getElementById('pdf-mainTouristEmail').textContent = getValue('mainTouristEmail');
        
        // Populate trip details in the print-only div
        document.getElementById('pdf-startDate').textContent = formatDate(form.elements.startDate.value);
        document.getElementById('pdf-endDate').textContent = formatDate(form.elements.endDate.value);
        document.getElementById('pdf-tripDuration').textContent = getValue('tripDuration');
        document.getElementById('pdf-transportDesc').textContent = getValue('transportDesc');
        document.getElementById('pdf-departureInfo').textContent = getValue('departureInfo');
        document.getElementById('pdf-returnInfo').textContent = getValue('returnInfo');
        document.getElementById('pdf-accommodationDesc').textContent = getValue('accommodationDesc');
        document.getElementById('pdf-roomType').textContent = getValue('roomType');
        document.getElementById('pdf-mealsDesc').textContent = getValue('mealsDesc');
        document.getElementById('pdf-otherServices').textContent = getOptionalValue('otherServices');
        document.getElementById('pdf-specialReqs').textContent = getOptionalValue('specialReqs');

        // Populate financials in the print-only div
        document.getElementById('pdf-totalPrice').innerHTML = getValue('totalPrice', '0.00', ' лв.');
        document.getElementById('pdf-otherPayments').innerHTML = getOptionalValue('otherPayments');
        document.getElementById('pdf-childDiscount').innerHTML = getOptionalValue('childDiscount', 'Не е приложимо.');
        document.getElementById('pdf-adultDiscount').innerHTML = getOptionalValue('adultDiscount', 'Не е приложимо.');
        document.getElementById('pdf-singleRoomFee').innerHTML = getOptionalValue('singleRoomFee', 'Не е приложимо.');
        document.getElementById('pdf-extraExcursion').innerHTML = getOptionalValue('extraExcursion');
        document.getElementById('pdf-insurance').innerHTML = 'НЕ Е ВКЛЮЧЕНА В ЦЕНАТА. ТУРИСТИТЕ СЕ ЗАДЪЛЖАВАТ ДА СКЛЮЧАТ ТАКАВА'; // Updated text
        document.getElementById('pdf-finalAmount').innerHTML = getValue('finalAmount', '0.00', ' лв.');
        document.getElementById('pdf-paymentTerms').innerHTML = getValue('paymentTerms');
        document.getElementById('pdf-depositAmount').textContent = getValue('depositAmount');
        document.getElementById('pdf-finalPayment').innerHTML = getValue('finalPayment');

        // Populate declarations in the print-only div
        document.getElementById('pdf-declarationDate1').textContent = formatDate(form.elements.signingDate.value);
        document.getElementById('pdf-declarationDate2').textContent = formatDate(form.elements.signingDate.value);
        document.getElementById('pdf-declarationName').textContent = getValue('mainTouristName');
        document.getElementById('pdf-declarationEGN').textContent = getValue('mainTouristEGN');
        document.getElementById('pdf-declarationPhone').textContent = getValue('mainTouristPhone');
        document.getElementById('pdf-declarationContractNumber').textContent = getValue('contractNumber', '').replace('..................', '');

        // Build and insert the tourist table for the PDF (print-only div)
        const pdfTableContainer = document.getElementById('pdf-tourists-table-container');
        let tableHTML = '<h3 style="margin-top: 1em; font-weight: bold; text-align: center;">Данни на всички туристи в пакетното пътуване:</h3><table class="tourist-table-pdf"><thead><tr><th>№</th><th>Трите имена по док. за самоличност</th><th>ЕГН/ЛНЧ</th><th>№ паспорт/л.к.</th></tr></thead><tbody>';
        
        let allTouristsData = [];
        // Add main tourist (from form input)
        const mainTouristName = form.elements.mainTouristName.value || '';
        const mainTouristEGN = form.elements.mainTouristEGN.value || '';
        const mainTouristIdCard = form.elements.mainTouristIdCard.value || ''; // This will be blank based on form population
        if (mainTouristName || mainTouristEGN || mainTouristIdCard) {
            allTouristsData.push({name: mainTouristName, egn: mainTouristEGN, id: mainTouristIdCard});
        }

        // Add accompanying tourists from component state
        tourists.forEach((t) => {
            allTouristsData.push({name: t.fullName, egn: t.realId, id: ''}); // BLANK as requested for accompanying tourists' ID
        });
        
        // Generate 13 rows for the PDF table, filling with data or leaving blank
        for (let i = 0; i < 13; i++) {
            const data = allTouristsData[i];
            tableHTML += `<tr>
                <td>${i + 1}</td>
                <td>${data ? data.name : ''}</td>
                <td>${data ? data.egn : ''}</td>
                <td>${data ? data.id : ''}</td>
            </tr>`;
        }

        tableHTML += '</tbody></table>';
        pdfTableContainer.innerHTML = tableHTML;
    }, [formatDate, tourists]);

    // Effect to populate the VISIBLE form fields when reservationData changes
    useEffect(() => {
        if (reservationData && formRef.current) {
            const form = formRef.current;

            // Populate main tourist/lead guest details
            const leadTourist = reservationData.tourists?.[0];
            if (leadTourist) {
                form.elements.mainTouristName.value = `${leadTourist.firstName || ''} ${leadTourist.fatherName || ''} ${leadTourist.familyName || ''}`.trim();
                form.elements.mainTouristEGN.value = leadTourist.realId || '';
                form.elements.mainTouristIdCard.value = ''; // Set to BLANK as requested
                form.elements.mainTouristAddress.value = `${leadTourist.address || ''}, ${leadTourist.city || ''}, ${leadTourist.postCode || ''}`.trim();
                form.elements.mainTouristPhone.value = leadTourist.phone || '';
                form.elements.mainTouristEmail.value = leadTourist.email || '';
            }

            // Populate accompanying tourists for the visible form and component state
            const accompanyingTourists = reservationData.tourists ? reservationData.tourists.slice(1) : [];
            setTourists(accompanyingTourists.map(t => ({
                fullName: `${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(),
                realId: t.realId || '',
                id: '' // Set to BLANK as requested
            })));

            // Populate reservation details
            form.elements.contractNumber.value = reservationData.reservationNumber || '';
            form.elements.signingDate.value = reservationData.creationDate || new Date().toISOString().split('T')[0];
            form.elements.startDate.value = reservationData.checkIn || '';
            form.elements.endDate.value = reservationData.checkOut || '';
            
            // Calculate and set duration
            const checkInDate = reservationData.checkIn ? new Date(reservationData.checkIn) : null;
            const checkOutDate = reservationData.checkOut ? new Date(reservationData.checkOut) : null;
            if (checkInDate && checkOutDate && checkOutDate >= checkInDate) {
                const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                form.elements.tripDuration.value = `${diffDays + 1} дни / ${diffDays} нощувки`;
            } else {
                form.elements.tripDuration.value = '';
            }

            // Static or derived values based on your data connections
            form.elements.transportDesc.value = 'СОБСТВЕН ТРАНСПОРТ - ОСИГУРЕН ОТ ТУРИСТИТЕ';
            form.elements.departureInfo.value = 'СОБСТВЕН ТРАНСПОРТ';
            form.elements.returnInfo.value = 'СОБСТВЕН ТРАНСПОРТ';
            
            form.elements.accommodationDesc.value = `${reservationData.hotel || ''}, ${reservationData.place || ''}, ${reservationData.totalNights || 0} нощувки`;
            form.elements.roomType.value = reservationData.roomType || '';
            form.elements.mealsDesc.value = reservationData.food || '';
            form.elements.otherServices.value = 'Водач-представител на фирмата по време на цялото пътуване;';
            form.elements.specialReqs.value = reservationData.specialReqs || '';
            
            form.elements.totalPrice.value = (reservationData.finalAmount || 0).toFixed(2);
            form.elements.insurance.value = 'НЕ Е ВКЛЮЧЕНА В ЦЕНАТА. ТУРИСТИТЕ СЕ ЗАДЪЛЖАВАТ ДА СКЛЮЧАТ ТАКАВА'; // Updated text
            form.elements.depositAmount.value = (reservationData.depositAmount || 0).toFixed(2);

            const remainingAmount = (reservationData.finalAmount || 0) - (reservationData.depositAmount || 0);
            form.elements.finalAmount.value = remainingAmount.toFixed(2);

            const finalPaymentDateObj = new Date(reservationData.checkIn);
            finalPaymentDateObj.setDate(finalPaymentDateObj.getDate() - 30); // 30 days before check-in
            const formattedFinalPaymentDate = formatDate(finalPaymentDateObj.toISOString().split('T')[0]);

            form.elements.finalPayment.value = `${remainingAmount.toFixed(2)} лв. до ${formattedFinalPaymentDate}`;
            form.elements.paymentTerms.value = `Плащането е в брой в нашия офис в Ракитово, ул. Христо Ботев 4 или по банков път със следните данни:\nIBAN BG87BPBI79301036586601\nПолучател: ДАЙНАМЕКС ТУР\nОснование: ${reservationData.reservationNumber || ''}`;

            // Set all form fields to read-only and add grey background
            Object.keys(form.elements).forEach(key => {
                const element = form.elements[key];
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.readOnly = true;
                    element.classList.add('bg-gray-100', 'cursor-not-allowed');
                }
            });
            const addTouristBtn = form.querySelector('#add-tourist-btn');
            if (addTouristBtn) {
                addTouristBtn.style.display = 'none';
            }
        }
    }, [reservationData, formatDate]);


    // Handle native print
    const handlePrintContract = useCallback(() => {
        // IMPORTANT: Populate the hidden print-only content just before printing
        populatePrintContent();

        // Use a timeout to ensure React has finished rendering updates before printing
        const timer = setTimeout(() => {
            window.print();
        }, 100); // Small delay to ensure content is fully rendered

        // Call onPrintFinish when the print dialog is closed or print is completed/cancelled
        window.onafterprint = () => {
            onPrintFinish();
            window.onafterprint = null; // Clean up the event listener
        };

        return () => {
            clearTimeout(timer);
            window.onafterprint = null; // Clean up on component unmount
        };
    }, [onPrintFinish, populatePrintContent]);

    const handleTabClick = useCallback((tabId) => {
        setActiveTab(tabId);
        const tabContents = formRef.current.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });
        const tabButtons = formRef.current.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
    }, []);

    return (
        <div className="print-preview-container">
            <div className="invoice-output"> {/* Reusing invoice-output class for main container styling */}
                
                {/* Header - Hidden in print */}
                <div className="p-8 text-center no-print">
                    <h1 className="text-3xl font-bold text-gray-800">Генератор на договори</h1>
                    <p className="mt-2 text-gray-600">Прегледайте и принтирайте договора за туристически пакет.</p>
                </div>

                {/* Tab Navigation - Hidden in print */}
                <div className="px-8 border-b border-gray-200 no-print">
                    <nav className="flex flex-wrap -mb-px" id="tab-nav">
                        <button type="button" data-tab="tab-1" className={`tab-btn py-4 px-4 text-sm font-medium ${activeTab === 'tab-1' ? 'active' : ''}`} onClick={() => handleTabClick('tab-1')}>1. Основна информация</button>
                        <button type="button" data-tab="tab-2" className={`tab-btn py-4 px-4 text-sm font-medium ${activeTab === 'tab-2' ? 'active' : ''}`} onClick={() => handleTabClick('tab-2')}>2. Данни за туристите</button>
                        <button type="button" data-tab="tab-3" className={`tab-btn py-4 px-4 text-sm font-medium ${activeTab === 'tab-3' ? 'active' : ''}`} onClick={() => handleTabClick('tab-3')}>3. Детайли за пътуването</button>
                        <button type="button" data-tab="tab-4" className={`tab-btn py-4 px-4 text-sm font-medium ${activeTab === 'tab-4' ? 'active' : ''}`} onClick={() => handleTabClick('tab-4')}>4. Финансови условия</button>
                    </nav>
                </div>

                {/* Contract Form - Visible on screen, data populated by useEffect */}
                <div className="p-8">
                    <form ref={formRef} id="contract-form" onSubmit={(e) => e.preventDefault()}>

                        {/* Tab 1: General Info */}
                        <div id="tab-1" className={`tab-content ${activeTab === 'tab-1' ? '' : 'hidden'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-1">Номер на договор</label>
                                    <input type="text" id="contractNumber" name="contractNumber" className="form-input w-full rounded-md border-gray-300" placeholder="2025/01" />
                                </div>
                                <div>
                                    <label htmlFor="signingDate" className="block text-sm font-medium text-gray-700 mb-1">Дата на подписване</label>
                                    <input type="date" id="signingDate" name="signingDate" className="form-input w-full rounded-md border-gray-300" />
                                </div>
                            </div>
                        </div>

                        {/* Tab 2: Tourist Info */}
                        <div id="tab-2" className={`tab-content ${activeTab === 'tab-2' ? '' : 'hidden'}`}>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Данни на основен потребител</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label htmlFor="mainTouristName" className="block text-sm font-medium text-gray-700 mb-1">Трите имена на турист</label>
                                    <input type="text" id="mainTouristName" name="mainTouristName" className="form-input w-full rounded-md border-gray-300" placeholder="Иван Иванов Иванов" />
                                </div>
                                <div>
                                    <label htmlFor="mainTouristEGN" className="block text-sm font-medium text-gray-700 mb-1">ЕГН</label>
                                    <input type="text" id="mainTouristEGN" name="mainTouristEGN" className="form-input w-full rounded-md border-gray-300" placeholder="0000000000" />
                                </div>
                                <div>
                                    <label htmlFor="mainTouristIdCard" className="block text-sm font-medium text-gray-700 mb-1">Л.К. №</label>
                                    <input type="text" id="mainTouristIdCard" name="mainTouristIdCard" className="form-input w-full rounded-md border-gray-300" placeholder="600000000" />
                                </div>
                                <div>
                                    <label htmlFor="mainTouristAddress" className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                                    <input type="text" id="mainTouristAddress" name="mainTouristAddress" className="form-input w-full rounded-md border-gray-300" placeholder="гр. София, ул. Примерна №1" />
                                </div>
                                <div>
                                    <label htmlFor="mainTouristPhone" className="block text-sm font-medium text-gray-700 mb-1">GSM</label>
                                    <input type="text" id="mainTouristPhone" name="mainTouristPhone" className="form-input w-full rounded-md border-gray-300" placeholder="0888123456" />
                                </div>
                                <div>
                                    <label htmlFor="mainTouristEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="mainTouristEmail" name="mainTouristEmail" className="form-input w-full rounded-md border-gray-300" placeholder="ivan.ivanov@email.com" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-semibold text-gray-800">Придружаващи туристи</h3>
                                <button type="button" id="add-tourist-btn" className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    Добави
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm text-left text-gray-600">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 w-12 text-center">№</th>
                                            <th scope="col" className="px-6 py-3">Трите имена</th>
                                            <th scope="col" className="px-6 py-3">ЕГН/ЛНЧ</th>
                                            <th scope="col" className="px-6 py-3">№ паспорт/л.к.</th>
                                            <th scope="col" className="px-4 py-3 text-center">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tourists-table-body">
                                        {tourists.map((t, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{index + 1}</td>
                                                <td className="px-6 py-2"><input type="text" className="form-input w-full rounded-md border-gray-300 text-sm bg-gray-100 cursor-not-allowed" value={t.fullName} readOnly /></td>
                                                <td className="px-6 py-2"><input type="text" className="form-input w-full rounded-md border-gray-300 text-sm bg-gray-100 cursor-not-allowed" value={t.realId} readOnly /></td>
                                                <td className="px-6 py-2"><input type="text" className="form-input w-full rounded-md border-gray-300 text-sm bg-gray-100 cursor-not-allowed" value={t.id} readOnly /></td>
                                                <td className="px-4 py-2 text-center">
                                                    {/* No remove button for pre-filled tourists */}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tab 3: Trip Details */}
                        <div id="tab-3" className={`tab-content ${activeTab === 'tab-3' ? '' : 'hidden'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Начална дата</label>
                                    <input type="date" id="startDate" name="startDate" className="form-input w-full rounded-md border-gray-300" />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Крайна дата</label>
                                    <input type="date" id="endDate" name="endDate" className="form-input w-full rounded-md border-gray-300" />
                                </div>
                                <div>
                                    <label htmlFor="tripDuration" className="block text-sm font-medium text-gray-700 mb-1">Продължителност</label>
                                    <input type="text" id="tripDuration" name="tripDuration" className="form-input w-full rounded-md border-gray-300 bg-gray-100" readOnly placeholder="Автоматично" />
                                </div>
                                <div className="lg:col-span-3">
                                    <label htmlFor="transportDesc" className="block text-sm font-medium text-gray-700 mb-1">1. Транспорт</label>
                                    <textarea id="transportDesc" name="transportDesc" rows="2" className="form-textarea w-full rounded-md border-gray-300" placeholder="Напр. Комфортен туристически автобус"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="departureInfo" className="block text-sm font-medium text-gray-700 mb-1">Час и място на тръгване</label>
                                    <input type="text" id="departureInfo" name="departureInfo" className="form-input w-full rounded-md border-gray-300" placeholder="06:00, гр. София, пл. Ал. Невски" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="returnInfo" className="block text-sm font-medium text-gray-700 mb-1">Час и място на връщане</label>
                                    <input type="text" id="returnInfo" name="returnInfo" className="form-input w-full rounded-md border-gray-300" placeholder="Около 22:00, гр. София, пл. Ал. Невски" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="accommodationDesc" className="block text-sm font-medium text-gray-700 mb-1">2. Настаняване</label>
                                    <textarea id="accommodationDesc" name="accommodationDesc" rows="3" className="form-textarea w-full rounded-md border-gray-300" placeholder="Напр. Хотел 'Планина' 3*, гр. Банско, 2 нощувки"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">Брой и вид стаи</label>
                                    <input type="text" id="roomType" name="roomType" className="form-input w-full rounded-md border-gray-300" placeholder="1 двойна стая" />
                                </div>
                                <div className="lg:col-span-3">
                                    <label htmlFor="mealsDesc" className="block text-sm font-medium text-gray-700 mb-1">3. Брой и вид на храненията, включени в пакетната цена</label>
                                    <input type="text" id="mealsDesc" name="mealsDesc" className="form-input w-full rounded-md border-gray-300" placeholder="2 закуски и 2 вечери" />
                                </div>
                                <div className="lg:col-span-3">
                                    <label htmlFor="otherServices" className="block text-sm font-medium text-gray-700 mb-1">3.3. Други услуги, включени в общата цена</label>
                                    <textarea id="otherServices" name="otherServices" rows="3" className="form-textarea w-full rounded-md border-gray-300" placeholder="Водач-представител на фирмата по време на цялото пътуване;"></textarea>
                                </div>
                                <div className="lg:col-span-3">
                                    <label htmlFor="specialReqs" className="block text-sm font-medium text-gray-700 mb-1">3.4. Специални изисквания на потребителя</label>
                                    <textarea id="specialReqs" name="specialReqs" rows="2" className="form-textarea w-full rounded-md border-gray-300" placeholder="Вегетарианско меню, настаняване на висок етаж..."></textarea>
                                </div>
                            </div>
                        </div>
                        
                        {/* Tab 4: Financials */}
                        <div id="tab-4" className={`tab-content ${activeTab === 'tab-4' ? '' : 'hidden'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700 mb-1">3.5 Обща цена в лева на пътуването</label>
                                    <input type="number" id="totalPrice" name="totalPrice" className="form-input w-full rounded-md border-gray-300" placeholder="0.00" step="0.01" />
                                </div>
                                <div>
                                    <label htmlFor="otherPayments" className="block text-sm font-medium text-gray-700 mb-1">3.5.1 Други плащания, включени в цената</label>
                                    <input type="text" id="otherPayments" name="otherPayments" className="form-input w-full rounded-md border-gray-300" placeholder="Пътни и гранични такси" />
                                </div>
                                <div>
                                    <label htmlFor="childDiscount" className="block text-sm font-medium text-gray-700 mb-1">3.5.1.1 Отстъпки за деца до 10/12 г.</label>
                                    <input type="text" id="childDiscount" name="childDiscount" className="form-input w-full rounded-md border-gray-300" placeholder="50 лв." />
                                </div>
                                <div>
                                    <label htmlFor="adultDiscount" className="block text-sm font-medium text-gray-700 mb-1">3.5.1.2 Отстъпки за трети възрастен</label>
                                    <input type="text" id="adultDiscount" name="adultDiscount" className="form-input w-full rounded-md border-gray-300" placeholder="20 лв." />
                                </div>
                                <div>
                                    <label htmlFor="singleRoomFee" className="block text-sm font-medium text-gray-700 mb-1">3.5.1.3 Доплащане за единична стая</label>
                                    <input type="text" id="singleRoomFee" name="singleRoomFee" className="form-input w-full rounded-md border-gray-300" placeholder="60 лв." />
                                </div>
                                <div>
                                    <label htmlFor="extraExcursion" className="block text-sm font-medium text-gray-700 mb-1">3.5.1.4 Други - допълнителна екскурзия</label>
                                    <input type="text" id="extraExcursion" name="extraExcursion" className="form-input w-full rounded-md border-gray-300" placeholder="Екскурзия до ... - 30 лв." />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-1">3.5.1.5 Застраховка</label>
                                    <input type="text" id="insurance" name="insurance" className="form-input w-full rounded-md border-gray-300" placeholder="Медицинска застраховка 'Помощ при пътуване' с лимит 5000 евро" />
                                </div>
                                <div>
                                    <label htmlFor="finalAmount" className="block text-sm font-medium text-gray-700 mb-1">3.6 Крайна обща дължима сума</label>
                                    <input type="number" id="finalAmount" name="finalAmount" className="form-input w-full rounded-md border-gray-300" placeholder="0.00" step="0.01" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">3.7 Начин и срок за плащане</label>
                                    <textarea id="paymentTerms" name="paymentTerms" rows="3" className="form-textarea w-full rounded-md border-gray-300" placeholder="По банков път до ДД.ММ.ГГГГ"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">Депозит (лв.)</label>
                                    <input type="number" id="depositAmount" name="depositAmount" className="form-input w-full rounded-md border-gray-300" placeholder="0.00" step="0.01" />
                                </div>
                                <div>
                                    <label htmlFor="finalPayment" className="block text-sm font-medium text-gray-700 mb-1">Остатък от пълната сума в размер на</label>
                                    <input type="text" id="finalPayment" name="finalPayment" className="form-input w-full rounded-md border-gray-300" placeholder="... лв. до ДД.ММ.ГГГГ" />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
                
                {/* Action Buttons - Hidden in print */}
                <div className="px-8 pb-8 flex justify-between items-center no-print">
                    <button type="button" onClick={onPrintFinish} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Назад
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintContract}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                        Принтирай Договор
                    </button>
                </div>
            </div>

            {/* This section contains the ACTUAL content to be printed. It's hidden on screen by CSS. */}
            <div className="print-only">
                {/* Section 1: Main Contract Header */}
                <div className="pdf-logical-page">
                    <h1>ДОГОВОР ЗА ТУРИСТИЧЕСКИ ПАКЕТ № <span id="pdf-contractNumber"></span></h1>
                    <p style={{textAlign: 'center'}}>съгласно разпоредбите на Закона за туризма</p>
                    <p>Днес, <span id="pdf-signingDate"></span> в гр. Ракитово, се подписа настоящия договор за пътуване между:</p>
                    <p>
                        <b>“ДАЙНАМЕКС ТУР” ЕООД</b> с удостоверение за туроператор № РК-01-8569/15.04.2025г., с адрес на управление гр. Ракитово, ул. "Васил Куртев" №12А, тел. 0879976446, Булстат № BG208193140 , представлявана и управлявана от КРАСИМИР ЕМИЛОВ АНАНОВ, наричан по долу за краткост <b>ТУРОПЕРАТОР</b> от една страна и
                    </p>
                    <p>
                        ИМЕНА: <b id="pdf-mainTouristName"></b>, ЕГН: <b id="pdf-mainTouristEGN"></b>, Л.К. №: <b id="pdf-mainTouristIdCard"></b>,
                        АДРЕС: <b id="pdf-mainTouristAddress"></b>, GSM: <b id="pdf-mainTouristPhone"></b>, EMAIL: <b id="pdf-mainTouristEmail"></b>
                    </p>
                    <p>от друга страна, наричан за краткост <b>ПОТРЕБИТЕЛ</b> се сключи настоящият договор за следното:</p>
                    <div id="pdf-tourists-table-container"></div>
                </div>

                {/* Section 2: Subject of the Contract & Financials */}
                <div className="pdf-logical-page">
                    <h2>І. ПРЕДМЕТ НА ДОГОВОРА</h2>
                    <p>1. Потребителят възлага и заплаща на Туроператора да му предостави туристическо пътуване при определен маршрут и платена от него цена при условията на настоящия договор.</p>
                    <p>2. Туроператорът приема да организира туристическото пътуване на Потребителя по определен маршрут заплащане на договорената цена при условията на настоящия договор.</p>
                    <p>3. Организирано туристическо пътуване е при следните условия:</p>
                    <p><b>3.1. Маршрут на пътуването</b><br/>
                        Начална дата на пътуването: <span id="pdf-startDate"></span> &nbsp;&nbsp;Крайна дата на пътуването: <span id="pdf-endDate"></span><br/>
                        Продължителност на пътуването: <span id="pdf-tripDuration"></span>
                    </p>
                    <p><b>3.2. Основни услуги, включени в общата цена</b><br/>
                        1. Транспорт: <span id="pdf-transportDesc"></span><br/>
                        Час и място на тръгване: <span id="pdf-departureInfo"></span><br/>
                        Час и място на връщане: <span id="pdf-returnInfo"></span><br/>
                        2. Настаняване: <span id="pdf-accommodationDesc"></span><br/>
                        Брой и вид стаи: <span id="pdf-roomType"></span><br/>
                        3. Брой и вид на храненията, включени в пакетната цена: <span id="pdf-mealsDesc"></span>
                    </p>
                    <p><b>3.3. Други услуги, включени в общата цена:</b> <span id="pdf-otherServices"></span></p>
                    <p><b>3.4. Специални изисквания на потребителя, за които е постигнато съгласие между двете страни по този договор:</b> <span id="pdf-specialReqs"></span></p>
                    <p><b>3.5. Обща цена в лева на пътуването:</b> <span id="pdf-totalPrice"></span></p>
                    <p><b>3.5.1. Други плащания, включени в цената:</b> <span id="pdf-otherPayments"></span></p>
                    <p><b>3.5.1.1. Отстъпки за деца до 10/12 г., настанени с двама възрастни в двойна стая:</b> <span id="pdf-childDiscount"></span></p>
                    <p><b>3.5.1.2. Отстъпки за трети възрастен в тройна стая, общо:</b> <span id="pdf-adultDiscount"></span></p>
                    <p><b>3.5.1.3. Доплащане за единична стая:</b> <span id="pdf-singleRoomFee"></span></p>
                    <p><b>3.5.1.4. Други - допълнителна екскурзия:</b> <span id="pdf-extraExcursion"></span></p>
                    <p><b>3.5.1.5. Застраховка:</b> <span id="pdf-insurance"></span></p>
                    <p><b>3.6 Крайна обща дължима сума:</b> <span id="pdf-finalAmount"></span></p>
                    <p><b>3.7 Начин и срок за плащане на пълната сума по пътуването:</b> <span id="pdf-paymentTerms"></span></p>
                    <p>ПОТВЪРЖДАВАМ от свое име и от името на гореизброените туристи, че съм запознат с условията за записване и програмата на пътуването и внасям депозит от <span id="pdf-depositAmount"></span> лв.</p>
                    <p>Потребителят се задължава да заплати остатъка от пълната сума в размер на <span id="pdf-finalPayment"></span>.</p>
                    <div className="signatures">
                        <span>ЗА ТУРОПЕРАТОРА</span>
                        <span>ЗА ПОТРЕБИТЕЛЯ</span>
                    </div>
                    <div className="signatures" style={{marginTop: '80px'}}>
                        <span>.........................</span>
                        <span>.........................</span>
                    </div>
                </div>

                {/* Section 3: General Conditions Part 1 */}
                <div className="pdf-logical-page">
                    <p><b>Туристическа програма</b> - означава разглеждане на посещаваното селище пеша и/или с градски транспорт, като обектите се разглеждат отвън, освен ако в програмата не с упоменато изрично „посещение" на туристическия обект или друго. Екскурзоводът от фирмата няма право да води групата в музеи , където това право имат само местни оторизирани екскурзоводи, които при желание от страна на групата могат да бъдат наети срещу допълнително заплащане. В някои от посещаваните градове се налага ползването на обществен транспорт, който Потребителят плаща за своя сметка.</p>
                    <p><b>8.2. Панорамна обиколка</b> -означава разглеждане на посещаваното селище с автобуса, като в някои случаи може да се спре и за пешеходно разглеждане по преценка на водача/екскурзовода.</p>
                    <p><b>8.3. Свободно време</b> -означава време, косто се дава от водача/екскурзовода на групата обикновено след предварително запознаване със съответното селище и което потребителят сам преценява как да оползотвори. През това време водачът/екскурзоводът на групата и автобусът не са на разположение на туристите.</p>
                    <p><b>8.4. Екскурзия по желание</b> -означава допълнителна факултативна екскурзия, алтернативна на свободното време, цената на която не е включена в общата цена, освен ако в програмата не е упоменато друго. Цената на екскурзията по желание се вписва в графа „цената не включва" в съответната програма.</p>
                    <p><b>8.5. Екскурзия без нощен преход</b> - означава организирано туристическо пътуване с обща цена по време на което няма предвидени нощувки в използваното превозно средство.</p>
                    <p><b>8.6. Екскурзия с нощен преход</b> - означава организирано туристическо пътуване с обща цена по време на което има предвидена поне една нощувка в използваното превозно средство.</p>
                    <p><b>8.7. Закуска / вечеря / друг вид хранене на блок маса (шведска маса, открит бюфет)</b> -означава хранене при което храната е поставена на общ плот или маса от която потребителят може да избере и консумира различни храни и питиета по своя преценка. Блок масата обикновено включва: колбас, кашкавал, масло, конфитюр, чай, кафе и др. Разнообразието и богатството на храните и напитките зависи от съответното заведение за хранене и развлечение.</p>
                    <p><b>8.8. Посещение на туристически обект</b> означава разглеждане отвътре на посочения обект, като в програмата изрично е посочено понятието „ПОСЕЩЕНИЕ". В повечето случаи посещенията на туристически обекти изискват заплащане на входна такса (закупуване на билет), освен ако в програмата не е упоменато друго.Препоръчваме: потребителят да осигури още в България сумите, които предвижда да похарчи в съответните валути за посещаваните държави. Музейните такси се плащат само в местна валута</p>
                </div>

                {/* Section 4: General Conditions Part 2 */}
                <div className="pdf-logical-page">
                    <p><b>8.9. Нощувка в</b> - означава, че нощувката е в рамките на обявеното селище.</p>
                    <p><b>8.10.Нощувка в района на</b> - означава, че нощувката е в друго селище в близост до обявеното селище.</p>
                    <p><b>9. Спорове и рекламации:</b></p>
                    <p>9.1. Всички рекламации, свързани с качеството на платените услуги, в т.ч. конкретните условия в хотелите и хотелските вериги, трябва да бъдат предявени от потребителя на място пред доставчика на услугите и представител/екскурзовод на туроператора или пред обслужващата фирма туроператор за отстраняване на слабостите. В случай, че заинтересованите страни не са удовлетворени, предявяването на рекламацията става в писмена или друга подходяща форма, позволяваща то да бъде възпроизведено в срок до 14 календарни дни след крайната дата на организираното пътуване.</p>
                    <p>9.2. Туроператорът се задължава в срок от 10 дни след получаване на рекламацията да даде своето писмено становище по нея.</p>
                    <p>Забележка: Потребителят не трябва да забравя, че категорията на хотелите и автобусите се определя от оторизираните власти на съответната страна, а не от туроператора.</p>
                    <p><b>10. Ред за изменение и прекратяване на договора:</b></p>
                    <p>10.1. Настоящият договор може да бъде отменян, изменян и допълван с двустранни писмени анекси и при спазване разпоредбите на 3Т.</p>
                    <p>10.2.Всяка от страните има право да поиска изменение или да прекрати Договора във връзка със съществени изменения на обстоятелствата,</p>
                    <p>10.3.Споразумение за изменение или уведомление за прекратяване на Договора се извършва в писмена форма.</p>
                    <p>10.4. При изменение на Договора задълженията на страните се запазват в изменен вид. При прекратяване на Договора задълженията на страните се прекратяват след уреждане на финансовите взаимоотношения</p>
                    <p>10.5. За неуредени в договора выпроси се прилагат разпоредбите на 3Т, 33П, Търговския закон, Закона за задълженията и договорите и останалото действащо законодателство на Р...България.</p>
                    <p>10.6. Анекс към Договора за организирано пътуване е подробно описание на туристическата програма.</p>
                    <p>10.7. Потребителят декларира с подписа си, че той и записаните от него туристи са запознати с програмата на екскурзията и общите условия на организираното пътуване, описани в настоящия договор и ги приемат.</p>
                    <p>10.8. Този договор се изготви в два екземпляра, по един за всяка от страните и се подписа на всяка страница, както следва:</p>
                    <div className="signatures">
                        <span>ЗА ТУРОПЕРАТОРА</span>
                        <span>ЗА ПОТРЕБИТЕЛЯ</span>
                    </div>
                    <div className="signatures" style={{marginTop: '80px'}}>
                        <span>.........................</span>
                        <span>.........................</span>
                    </div>
                </div>
                
                {/* Section 5: GDPR Declaration */}
                <div className="pdf-logical-page">
                    <h2>ПРИЛОЖЕНИЕ Nº 1 КЪМ ДОГОВОР ЗА ТУРИСТИЧЕСКИ ПАКЕТ</h2>
                    <h2 style={{marginTop:0}}>ДЕКЛАРАЦИЯ - СЪГЛАСИЕ ЗА ОБРАБОТКА НА ЛИЧНИ ДАННИ</h2>
                    <p>В качеството си на администратор на лични данни, „ДАЙНАМЕКС ТУР" ЕООД, ЕИК 208193140, следва да е получило и/или ще получи от Вас лични данни, които ще обработва, за да предостави услугите си. В случай, че не предоставите личните си данни, „ДАЙНАМЕКС ТУР" няма да може да предостави услугите си, включително да направи резервация от Ваше име за желания период и място.</p>
                    <p>С подписа си по-долу Вие потвърждавате, че:</p>
                    <p>- Сте получили на хартиен носител Политиката ни за поверителност с подробна информация за това какви Ваши лични данни събиране и обработваме, за каква цел, за какъв срок и на какво основание ги обработваме, на кого ги представяме и какви са Вашите права във връзка с тази обработка;</p>
                    <p>- Сме Ви информирали, че посочената Политика за поверителност е налична и онлайн на интернет адрес http://dynamextour.com;</p>
                    <p>- Ако за целите на предоставянето на услугата, която се закупили, сте ни предоставили или ще ни предоставите лични данни на трети лица (например приятели, познати или членове на семейството, които ще пътуват с Вас), Вие декларирате, че ще информирате тези трети лица за това, че сте ни предоставили техните лични данни, както и да им предоставите екземпляр от Политиката за поверителност или да ги насочите към посочения по-горе адрес, на който то е достъпно чрез уеб-страницата;</p>
                    <p>- Декларирате истинността на предоставената ни информация, включително актуалността и верността на личните данни.</p>
                    <br/><br/>
                    <p>........................................................................</p>
                    <p>ТРИ ИМЕНА И ПОДПИС</p>
                    <p>ДАТА: <span id="pdf-declarationDate1"></span></p>
                </div>

                {/* Section 6: Information Confirmation Declaration */}
                <div className="pdf-logical-page">
                    <h2 style={{marginTop: 0}}>ДЕКЛАРАЦИЯ - ПОТВЪРЖДЕНИЕ ЗА ИНФОРМИРАНОСТ ОТНОСНО УСЛОВИЯТА И ОСНОВНИТЕ ХАРАКТЕРИСТИКИ НА ПАКЕТА</h2>
                    <p>Долуподписаният <b id="pdf-declarationName"></b>, ЕГН: <b id="pdf-declarationEGN"></b>, телефон за връзка, <b id="pdf-declarationPhone"></b> в качеството ми на Потребител по Договор Nº <b id="pdf-declarationContractNumber"></b></p>
                    <p>ДЕКЛАРИРАМ, ЧЕ:</p>
                    <p>Преди да подпиша договора за туристически пакет, от Туроператора и/ или Турагента, в това число и чрез електронния сайт на Дружеството, съм получил цялата съпътстваща информация за условията на пакета, който желая да закупя, съответно и всички данни за моето пътуване и почивка, получил съм подробна и пълна информация на всички поставени от мен вьпроси, предлаганият туристически пакет съм избрал доброволно и съм съгласен изцяло с неговите условия и характеристики, в това число, но не само и с условията за плащане, минималния брой участници, за които ще се осъществи програмата, получил съм информация и за възможността си да сключа договор за доброволна застраховка за покриване на разходи в случай, че прекратя туристическия пакет, като цялата получена от мен преддоговорната информация ме удовлетворява напълно и в знак на съгласие от мое име и от името на записаните от мен лица, полагам подписа си под настоящата Декларация и подписвам Договора за туристически пакет, заедно с всички негови приложения.</p>
                    <br/><br/>
                    <p>ДАТА: <span id="pdf-declarationDate2"></span></p>
                    <p style={{textAlign: 'right', marginTop: '20px'}}>(подпис) ................................</p>
                </div>
            </div>
        </div>
    );
};

export default CustomerContractPrint;
