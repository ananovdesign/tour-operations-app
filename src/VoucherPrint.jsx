// src/VoucherPrint.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './VoucherPrint.css';
import Logo from './Logo.png'; 

const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    // State variables for the form inputs (kept to manage data)
    const [voucherNumber, setVoucherNumber] = useState('');
    const [voucherType, setVoucherType] = useState('original');
    const [destinationBulgarian, setDestinationBulgarian] = useState('');
    const [destinationEnglish, setDestinationEnglish] = useState('');
    const [tourists, setTourists] = useState([]);
    const [adultsCountBg, setAdultsCountBg] = useState(0);
    const [adultsCountEn, setAdultsCountEn] = useState(0);
    const [childrenRegularBedCountBg, setChildrenRegularBedCountBg] = useState(0);
    const [childrenRegularBedCountEn, setChildrenRegularBedCountEn] = useState(0);
    const [childrenExtraBedCountBg, setChildrenExtraBedCountBg] = useState(0);
    const [childrenExtraBedCountEn, setChildrenExtraBedCountEn] = useState(0);
    const [itineraryBg, setItineraryBg] = useState('');
    const [itineraryEn, setItineraryEn] = useState('');
    const [destinationPlaceBg, setDestinationPlaceBg] = useState('');
    const [destinationPlaceEn, setDestinationPlaceEn] = useState('');
    const [dateStartBg, setDateStartBg] = useState('');
    const [dateEndBg, setDateEndBg] = useState('');
    const [dateStartEn, setDateStartEn] = useState('');
    const [dateEndEn, setDateEndEn] = useState('');
    const [accommodationBg, setAccommodationBg] = useState('');
    const [accommodationEn, setAccommodationEn] = useState('');
    const [roomCategoryBg, setRoomCategoryBg] = useState('');
    const [roomCategoryEn, setRoomCategoryEn] = useState('');
    const [checkInBg, setCheckInBg] = useState('');
    const [checkInEn, setCheckInEn] = useState('');
    const [checkOutBg, setCheckOutBg] = useState('');
    const [checkOutEn, setCheckOutEn] = useState('');
    const [excursionsBg, setExcursionsBg] = useState('');
    const [excursionsEn, setExcursionsEn] = useState('');
    const [otherServicesBg, setOtherServicesBg] = useState('');
    const [otherServicesEn, setOtherServicesEn] = useState('');
    const [notesBg, setNotesBg] = useState('');
    const [notesEn, setNotesEn] = useState('');
    const [dateIssuedBg, setDateIssuedBg] = useState('');
    const [dateIssuedEn, setDateIssuedEn] = useState('');
    const [paymentDocNumBg, setPaymentDocNumBg] = useState('');
    const [paymentDocDateBg, setPaymentDocDateBg] = useState('');
    const [paymentDocNumEn, setPaymentDocNumEn] = useState('');
    const [paymentDocDateEn, setPaymentDocDateEn] = useState('');

    // Helper functions for formatting (re-used from your original code)
    const formatDateLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const formatDateTimeLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }, []);

    const formatDateForPrint = useCallback((dateString) => {
        if (!dateString) return '..................';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error("Error formatting date for print:", error);
            return 'Date Error';
        }
    }, []);

    const formatDateTimeForPrint = useCallback((dateTimeLocalString) => {
        if (!dateTimeLocalString) return '..................';
        try {
            const date = new Date(dateTimeLocalString);
            if (isNaN(date.getTime())) return 'Invalid DateTime';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        } catch (error) {
            console.error("Error formatting datetime for print:", error);
            return 'DateTime Error';
        }
    }, []);

    const getValue = useCallback((val, fallback = '..................') => {
        if (val === null || val === undefined || val === '') {
            return fallback;
        }
        if (typeof val === 'number' && val === 0 && fallback === '..................') {
            return '0';
        }
        return val;
    }, []);

    // Effect to populate fields from reservationData when component mounts or data changes
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(getValue(reservationData.reservationNumber, '')); 
            setDestinationBulgarian(getValue(reservationData.hotel, '')); 
            setDestinationEnglish(getValue(reservationData.hotel, ''));

            const mappedTourists = (reservationData.tourists || []).map(t => ({
                bgName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Неизвестен'), 
                enName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Unknown'), 
            }));
            setTourists(mappedTourists);

            setAdultsCountBg(getValue(reservationData.adults, 0));
            setAdultsCountEn(getValue(reservationData.adults, 0));
            setChildrenRegularBedCountBg(getValue(reservationData.children, 0)); 
            setChildrenRegularBedCountEn(getValue(reservationData.children, 0));
            setChildrenExtraBedCountBg(0); 
            setChildrenExtraBedCountEn(0);

            setItineraryBg(getValue(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim()));
            setItineraryEn(getValue(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim()));
            setDestinationPlaceBg(getValue(reservationData.place, ''));
            setDestinationPlaceEn(getValue(reservationData.place, ''));

            setDateStartBg(formatDateLocal(reservationData.checkIn));
            setDateEndBg(formatDateLocal(reservationData.checkOut));
            setDateStartEn(formatDateLocal(reservationData.checkIn));
            setDateEndEn(formatDateLocal(reservationData.checkOut));

            setAccommodationBg(getValue(reservationData.hotel, ''));
            setAccommodationEn(getValue(reservationData.hotel, ''));
            setRoomCategoryBg(getValue(reservationData.roomType, ''));
            setRoomCategoryEn(getValue(reservationData.roomType, ''));

            setCheckInBg(formatDateTimeLocal(reservationData.checkIn)); 
            setCheckInEn(formatDateTimeLocal(reservationData.checkIn));
            setCheckOutBg(formatDateTimeLocal(reservationData.checkOut));
            setCheckOutEn(formatDateTimeLocal(reservationData.checkOut));

            setExcursionsBg(''); 
            setExcursionsEn(''); 
            setOtherServicesBg('');
            setOtherServicesEn(''); 
            setNotesBg(''); 
            setNotesEn(''); 

            setDateIssuedBg(formatDateLocal(new Date().toISOString().split('T')[0])); 
            setDateIssuedEn(formatDateLocal(new Date().toISOString().split('T')[0]));
            
            setPaymentDocNumBg(''); 
            setPaymentDocDateBg(''); 
            setPaymentDocNumEn(''); 
            setPaymentDocDateEn(''); 
        }
    }, [reservationData, formatDateTimeLocal, formatDateLocal, getValue]);


    const addTouristRow = useCallback(() => {
        setTourists(prevTourists => [...prevTourists, { bgName: '', enName: '' }]);
    }, []);

    const removeTouristRow = useCallback((indexToRemove) => {
        setTourists(prevTourists => prevTourists.filter((_, index) => index !== indexToRemove));
    }, []);

    const handleTouristChange = useCallback((index, field, value) => {
        setTourists(prevTourists => {
            const newTourists = [...prevTourists];
            newTourists[index] = { ...newTourists[index], [field]: value };
            return newTourists;
        });
    }, []);

    // Handle print functionality for this component
    const handlePrintVoucher = useCallback(() => {
        // This small delay gives the browser a moment to ensure all DOM updates
        // from React are flushed before the print dialog is opened.
        setTimeout(() => {
            window.print();
        }, 100);

        // This callback notifies the parent component (App.jsx) that printing is done.
        // It's crucial for App.jsx to then decide what to render next (e.g., go back to reservations list).
        window.onafterprint = () => {
            onPrintFinish(); // This will trigger the reset of selectedReservation in App.jsx
            window.onafterprint = null; // Clean up the event listener
        };

        // Cleanup in case the component unmounts before onafterprint fires
        return () => {
            window.onafterprint = null;
        };
    }, [onPrintFinish]);

    // Data prepared for the PRINT version (uses getValue, formatDateForPrint etc.)
    const voucherPrintData = useMemo(() => {
        const leadTourist = reservationData.tourists?.[0] || {};
        const accompanyingTourists = reservationData.tourists ? reservationData.tourists.slice(1) : [];

        return {
            voucherNumber: getValue(voucherNumber, 'ВАУЧЕР НОМЕР'),
            voucherType: voucherType === 'original' ? 'ОРИГИНАЛ / ORIGINAL' : 'КОПИЕ / COPY',
            destinationBulgarian: getValue(destinationBulgarian, 'ДЕСТИНАЦИЯ'),
            destinationEnglish: getValue(destinationEnglish, 'DESTINATION'),
            
            tourists: [
                { bgName: getValue(`${leadTourist.firstName || ''} ${leadTourist.fatherName || ''} ${leadTourist.familyName || ''}`.trim(), 'Неизвестен'), enName: getValue(`${leadTourist.firstName || ''} ${leadTourist.fatherName || ''} ${leadTourist.familyName || ''}`.trim(), 'Unknown') },
                ...accompanyingTourists.map(t => ({ 
                    bgName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Неизвестен'), 
                    enName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Unknown') 
                }))
            ],
            adultsCountBg: getValue(adultsCountBg, '0'),
            adultsCountEn: getValue(adultsCountEn, '0'),
            childrenRegularBedCountBg: getValue(childrenRegularBedCountBg, '0'),
            childrenRegularBedCountEn: getValue(childrenRegularBedCountEn, '0'),
            childrenExtraBedCountBg: getValue(childrenExtraBedCountBg, '0'),
            childrenExtraBedCountEn: getValue(childrenExtraBedCountEn, '0'),

            itineraryBg: getValue(itineraryBg),
            itineraryEn: getValue(itineraryEn),
            destinationPlaceBg: getValue(destinationPlaceBg),
            destinationPlaceEn: getValue(destinationPlaceEn),

            dateStartBg: formatDateForPrint(dateStartBg),
            dateEndBg: formatDateForPrint(dateEndBg),
            dateStartEn: formatDateForPrint(dateStartEn),
            dateEndEn: formatDateForPrint(dateEndEn),

            accommodationBg: getValue(accommodationBg),
            accommodationEn: getValue(accommodationEn),
            roomCategoryBg: getValue(roomCategoryBg),
            roomCategoryEn: getValue(roomCategoryEn),

            checkInBg: formatDateTimeForPrint(checkInBg),
            checkInEn: formatDateTimeForPrint(checkInEn),
            checkOutBg: formatDateTimeForPrint(checkOutBg),
            checkOutEn: formatDateTimeForPrint(checkOutEn),

            excursionsBg: getValue(excursionsBg, 'НЯМА ВКЛЮЧЕНИ ЕКСКУРЗИИ'), 
            excursionsEn: getValue(excursionsEn, 'NO INCLUDED EXCURSIONS'), 
            otherServicesBg: getValue(otherServicesBg, 'Водач-представител на фирмата по време на цялото пътуване;'), 
            otherServicesEn: getValue(otherServicesEn, 'Company representative/guide throughout the trip;'), 
            notesBg: getValue(notesBg, 'Без забележки'), 
            notesEn: getValue(notesEn, 'No notes'), 

            dateIssuedBg: formatDateForPrint(dateIssuedBg),
            dateIssuedEn: formatDateForPrint(dateIssuedEn),
            paymentDocNumBg: getValue(paymentDocNumBg), 
            paymentDocDateBg: formatDateForPrint(paymentDocDateBg), 
            paymentDocNumEn: getValue(paymentDocNumEn), 
            paymentDocDateEn: formatDateForPrint(paymentDocDateEn), 
        };
    }, [
        voucherNumber, voucherType, destinationBulgarian, destinationEnglish, tourists,
        adultsCountBg, adultsCountEn, childrenRegularBedCountBg, childrenRegularBedCountEn, childrenExtraBedCountBg, childrenExtraBedCountEn,
        itineraryBg, itineraryEn, destinationPlaceBg, destinationPlaceEn, dateStartBg, dateEndBg, dateStartEn, dateEndEn,
        accommodationBg, accommodationEn, roomCategoryBg, roomCategoryEn, checkInBg, checkInEn, checkOutBg, checkOutEn,
        excursionsBg, excursionsEn, otherServicesBg, otherServicesEn, notesBg, notesEn,
        dateIssuedBg, dateIssuedEn, paymentDocNumBg, paymentDocDateBg, paymentDocNumEn, paymentDocDateEn,
        formatDateForPrint, formatDateTimeForPrint, getValue, reservationData
    ]);


    if (!reservationData) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
                <div className="text-gray-600 text-lg animate-pulse">Loading voucher data...</div>
            </div>
        );
    }

    return (
        <div className="print-preview-container w-full flex flex-col justify-center items-center min-h-screen p-20">
            {/* THIS IS THE INTERACTIVE FORM FOR EDITING (VISIBLE ON SCREEN) */}
            <div className="voucher-form-container"> {/* New class for the form part */}
                <div className="logo-section">
                    <img src={Logo} alt="Company Logo" className="h-24 object-contain rounded-lg"></img>
                </div>

                <table className="info-table">
                    <thead>
                        <tr>
                            <th colSpan="2" className="header-row">
                                РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA
                            </th>
                        </tr>
                        <tr>
                            <th colSpan="2" className="header-row">
                                ВАУЧЕР / VOUCHER:
                                <input type="text" id="voucherNumber" className="input-field mt-2" placeholder="Enter Voucher Number" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>ДАЙНАМЕКС ТУР ЕООД</td>
                            <td>DYNAMEX TOUR LTD</td>
                        </tr>
                        <tr>
                            <td>ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</td>
                            <td>TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</td>
                        </tr>
                        <tr>
                            <td>ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</td>
                            <td>ID: 208193140, ADRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</td>
                        </tr>
                        {/* Dropdown for ORIGINAL / COPY */}
                        <tr>
                            <td colSpan="2" className="header-row">
                                <select id="voucherType" className="select-field" value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
                                    <option value="original">ОРИГИНАЛ / ORIGINAL</option>
                                    <option value="copy">КОПИЕ / COPY</option>
                                </select>
                            </td>
                        </tr>
                        {/* Combined input fields for "ЗА ПРЕДСТАВЯНЕ В" and "TO" */}
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ЗА ПРЕДСТАВЯНЕ В:</span>
                                    <input type="text" id="destinationBulgarian" className="input-field" placeholder="Въведете дестинация" value={destinationBulgarian} onChange={(e) => setDestinationBulgarian(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>TO:</span>
                                    <input type="text" id="destinationEnglish" className="input-field" placeholder="Enter Destination" value={destinationEnglish} onChange={(e) => setDestinationEnglish(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        {/* Tourist Names Section */}
                        <tr>
                            <td colSpan="2" className="header-row">
                                ИМЕ И ФАМИЛИЯ НА ТУРИСТА / NAME AND SURNAME OF TOURIST
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <div id="touristInputsContainer" className="space-y-3">
                                    {tourists.map((tourist, index) => (
                                        <div key={index} className="flex-container tourist-row">
                                            <input type="text" className="input-field tourist-name-bg" placeholder="Име и фамилия (Български)" value={tourist.bgName} onChange={(e) => handleTouristChange(index, 'bgName', e.target.value)} />
                                            <input type="text" className="input-field tourist-name-en" placeholder="Name and Surname (English)" value={tourist.enName} onChange={(e) => handleTouristChange(index, 'enName', e.target.value)} />
                                            <button type="button" className="remove-button" onClick={() => removeTouristRow(index)}>Remove</button>
                                        </div>
                                    ))}
                                </div>
                                <button id="addTouristBtn" className="add-button" type="button" onClick={addTouristRow}>Add Another Tourist</button>
                            </td>
                        </tr>
                        {/* Adults and Children Fields */}
                        <tr>
                            <td>
                                <div className="number-input-container">
                                    <span>ВЪЗРАСТНИ:</span>
                                    <input type="number" id="adultsCountBg" className="input-field" value={adultsCountBg} onChange={(e) => { setAdultsCountBg(parseInt(e.target.value) || 0); setAdultsCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>ADULTS:</span>
                                    <input type="number" id="adultsCountEn" className="input-field" value={adultsCountEn} onChange={(e) => { setAdultsCountEn(parseInt(e.target.value) || 0); setAdultsCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="number-input-container">
                                    <span>ДЕЦА (РЕДОВНО ЛЕГЛО):</span>
                                    <input type="number" id="childrenRegularBedCountBg" className="input-field" value={childrenRegularBedCountBg} onChange={(e) => { setChildrenRegularBedCountBg(parseInt(e.target.value) || 0); setChildrenRegularBedCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>CHILDREN (REGULAR BED):</span>
                                    <input type="number" id="childrenRegularBedCountEn" className="input-field" value={childrenRegularBedCountEn} onChange={(e) => { setChildrenRegularBedCountEn(parseInt(e.target.value) || 0); setChildrenRegularBedCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="number-input-container">
                                    <span>ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО):</span>
                                    <input type="number" id="childrenExtraBedCountBg" className="input-field" value={childrenExtraBedCountBg} onChange={(e) => { setChildrenExtraBedCountBg(parseInt(e.target.value) || 0); setChildrenExtraBedCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>CHILDREN (EXTRA BED):</span>
                                    <input type="number" id="childrenExtraBedCountEn" className="input-field" value={childrenExtraBedCountEn} onChange={(e) => { setChildrenExtraBedCountEn(parseInt(e.target.value) || 0); setChildrenExtraBedCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>МАРШРУТ:</span>
                                    <input type="text" id="itineraryBg" className="input-field" placeholder="Въведете маршрут" value={itineraryBg} onChange={(e) => setItineraryBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>ITINERARY:</span>
                                    <input type="text" id="itineraryEn" className="input-field" placeholder="Enter Itinerary" value={itineraryEn} onChange={(e) => setItineraryEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>МЯСТО:</span>
                                    <input type="text" id="destinationBg" className="input-field" placeholder="Въведете място" value={destinationPlaceBg} onChange={(e) => setDestinationPlaceBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>DESTINATION:</span>
                                    <input type="text" id="destinationEn" className="input-field" placeholder="Enter Destination" value={destinationPlaceEn} onChange={(e) => setDestinationPlaceEn(e.target.value)} />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>СРОК:</span>
                                        <div className="date-range-container">
                                            <input type="date" id="dateStartBg" className="input-field" value={dateStartBg} onChange={(e) => setDateStartBg(e.target.value)} />
                                            <span>-</span>
                                            <input type="date" id="dateEndBg" className="input-field" value={dateEndBg} onChange={(e) => setDateEndBg(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>DATES OF ITINERARY:</span>
                                        <div className="date-range-container">
                                            <input type="date" id="dateStartEn" className="input-field" value={dateStartEn} onChange={(e) => setDateStartEn(e.target.value)} />
                                            <span>-</span>
                                            <input type="date" id="dateEndEn" className="input-field" value={dateEndEn} onChange={(e) => setDateEndEn(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>НАСТАНЯВАНЕ В:</span>
                                        <input type="text" id="accommodationBg" className="input-field" placeholder="Въведете място на настаняване" value={accommodationBg} onChange={(e) => setAccommodationBg(e.target.value)} />
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>ACCOMMODATION AT:</span>
                                        <input type="text" id="accommodationEn" className="input-field" placeholder="Enter Accommodation" value={accommodationEn} onChange={(e) => setAccommodationEn(e.target.value)} />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>КАТЕГОРИЯ И БРОЙ СТАИ:</span>
                                        <input type="text" id="roomCategoryBg" className="input-field" placeholder="Въведете категория и брой стаи" value={roomCategoryBg} onChange={(e) => setRoomCategoryBg(e.target.value)} />
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>CATEGORY AND NUMBER OF ROOMS:</span>
                                        <input type="text" id="roomCategoryEn" className="input-field" placeholder="Enter Category and Number of Rooms" value={roomCategoryEn} onChange={(e) => setRoomCategoryEn(e.target.value)} />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ДАТА И ЧАС НА ПРИСТИГАНЕ:</span>
                                        <div className="date-time-container">
                                            <input type="datetime-local" id="checkInBg" className="input-field" value={checkInBg} onChange={(e) => setCheckInBg(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>CHECK IN:</span>
                                        <div className="date-time-container">
                                            <input type="datetime-local" id="checkInEn" className="input-field" value={checkInEn} onChange={(e) => setCheckInEn(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ДАТА И ЧАС НА ЗАМИНАВАНЕ:</span>
                                        <div className="date-time-container">
                                            <input type="datetime-local" id="checkOutBg" className="input-field" value={checkOutBg} onChange={(e) => setCheckOutBg(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>CHECK OUT:</span>
                                        <div className="date-time-container">
                                            <input type="datetime-local" id="checkOutEn" className="input-field" value={checkOutEn} onChange={(e) => setCheckOutEn(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ЕКСКУРЗИОННА ПРОГРАМА:</span>
                                        <textarea id="excursionsBg" className="textarea-field" rows="3" placeholder="Въведете екскурзионна програма" value={excursionsBg} onChange={(e) => setExcursionsBg(e.target.value)}></textarea>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>EXCURSIONS:</span>
                                        <textarea id="excursionsEn" className="textarea-field" rows="3" placeholder="Enter excursions" value={excursionsEn} onChange={(e) => setExcursionsEn(e.target.value)}></textarea>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ДРУГИ УСЛУГИ:</span>
                                        <textarea id="otherServicesBg" className="textarea-field" rows="3" placeholder="Въведете други услуги" value={otherServicesBg} onChange={(e) => setOtherServicesBg(e.target.value)}></textarea>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>OTHER SERVICES:</span>
                                        <textarea id="otherServicesEn" className="textarea-field" rows="3" placeholder="Enter other services" value={otherServicesEn} onChange={(e) => setOtherServicesEn(e.target.value)}></textarea>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ЗАБЕЛЕЖКИ:</span>
                                        <textarea id="notesBg" className="textarea-field" rows="3" placeholder="Въведете забележки" value={notesBg} onChange={(e) => setNotesBg(e.target.value)}></textarea>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>NOTES:</span>
                                        <textarea id="notesEn" className="textarea-field" rows="3" placeholder="Enter notes" value={notesEn} onChange={(e) => setNotesEn(e.target.value)}></textarea>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>ДАТА:</span>
                                        <input type="date" id="dateIssuedBg" className="input-field" value={dateIssuedBg} onChange={(e) => setDateIssuedBg(e.target.value)} />
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>DATE:</span>
                                        <input type="date" id="dateIssuedEn" className="input-field" value={dateIssuedEn} onChange={(e) => setDateIssuedEn(e.target.value)} />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="flex-container">
                                        <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                        <div className="payment-doc-container">
                                            <input type="text" id="paymentDocNumBg" className="input-field" placeholder="Номер на документ" value={paymentDocNumBg} onChange={(e) => setPaymentDocNumBg(e.target.value)} />
                                            <input type="date" id="paymentDocDateBg" className="input-field" value={paymentDocDateBg} onChange={(e) => setPaymentDocDateBg(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-container">
                                        <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                        <div className="payment-doc-container">
                                            <input type="text" id="paymentDocNumEn" className="input-field" placeholder="Document Number" value={paymentDocNumEn} onChange={(e) => setPaymentDocNumEn(e.target.value)} />
                                            <input type="date" id="paymentDocDateEn" className="input-field" placeholder="Date of Payment" value={paymentDocDateEn} onChange={(e) => setPaymentDocDateEn(e.target.value)} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="text-center">
                                    <div className="signature-line"></div>
                                    <div className="signature-text">ПОДПИС И ПЕЧАТ НА ФИРМА ИЗПРАЩАЧ / SENDER COMPANY SIGNATURE AND STAMP</div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="text-center">
                                    <div className="signature-line"></div>
                                    <div className="signature-text">ПОДПИС И ПЕЧАТ НА ПРИЕМАЩА ФИРМА / RECEIVING COMPANY SIGNATURE AND STAMP</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button id="printVoucherBtn" className="print-button add-button mt-8 mb-8" onClick={handlePrintVoucher}>Print Voucher</button>
                </div>

                {/* THIS IS THE PRINT-ONLY CONTENT (HIDDEN ON SCREEN) */}
                <div className="voucher-print-content"> {/* Changed class from .print-only */}
                    <div className="logo-section">
                        <img src={Logo} alt="Company Logo" style={{height: '60px', width: 'auto'}}></img>
                    </div>

                    <table className="info-table">
                        <thead>
                            <tr>
                                <th colSpan="2" className="header-row">
                                    РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA
                                </th>
                            </tr>
                            <tr>
                                <th colSpan="2" className="header-row">
                                    ВАУЧЕР / VOUCHER: {voucherPrintData.voucherNumber}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ДАЙНАМЕКС ТУР ЕООД</td>
                                <td>DYNAMEX TOUR LTD</td>
                            </tr>
                            <tr>
                                <td>ЛИЦЕНЗ ЗА ТУРОПЕРАТОР: РК-01-8569/15.04.2025г.</td>
                                <td>TUROPERATOR LICENSE: PK-01-8569/15.04.2025.</td>
                            </tr>
                            <tr>
                                <td>ЕИК: 208193140, АДРЕС: БЪЛГАРИЯ, РАКИТОВО, ВАСИЛ КУРТЕВ 12А</td>
                                <td>ID: 208193140, ADRESS: BULGARIA, RAKITOVO, VASIL KURTEV 12A</td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="header-row">
                                    {voucherPrintData.voucherType}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ЗА ПРЕДСТАВЯНЕ В:</span> {voucherPrintData.destinationBulgarian}
                                </td>
                                <td>
                                    <span>TO:</span> {voucherPrintData.destinationEnglish}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="header-row">
                                    ИМЕ И ФАМИЛИЯ НА ТУРИСТА / NAME AND SURNAME OF TOURIST
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2">
                                    {voucherPrintData.tourists.map((tourist, index) => (
                                        <div key={index}>{tourist.bgName} / {tourist.enName}</div>
                                    ))}
                                    {Array.from({ length: Math.max(0, 7 - voucherPrintData.tourists.length) }).map((_, i) => (
                                        <div key={`blank-tourist-${i}`}>........................................ / ........................................</div>
                                    ))}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ВЪЗРАСТНИ:</span> {voucherPrintData.adultsCountBg}
                                </td>
                                <td>
                                    <span>ADULTS:</span> {voucherPrintData.adultsCountEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДЕЦА (РЕДОВНО ЛЕГЛО):</span> {voucherPrintData.childrenRegularBedCountBg}
                                </td>
                                <td>
                                    <span>CHILDREN (REGULAR BED):</span> {voucherPrintData.childrenRegularBedCountEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО):</span> {voucherPrintData.childrenExtraBedCountBg}
                                </td>
                                <td>
                                    <span>CHILDREN (EXTRA BED):</span> {voucherPrintData.childrenExtraBedCountEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>МАРШРУТ:</span> {voucherPrintData.itineraryBg}
                                </td>
                                <td>
                                    <span>ITINERARY:</span> {voucherPrintData.itineraryEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>МЯСТО:</span> {voucherPrintData.destinationPlaceBg}
                                </td>
                                <td>
                                    <span>DESTINATION:</span> {voucherPrintData.destinationPlaceEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>СРОК:</span> {voucherPrintData.dateStartBg} - {voucherPrintData.dateEndBg}
                                </td>
                                <td>
                                    <span>DATES OF ITINERARY:</span> {voucherPrintData.dateStartEn} - {voucherPrintData.dateEndEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>НАСТАНЯВАНЕ В:</span> {voucherPrintData.accommodationBg}
                                </td>
                                <td>
                                    <span>ACCOMMODATION AT:</span> {voucherPrintData.accommodationEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>КАТЕГОРИЯ И БРОЙ СТАИ:</span> {voucherPrintData.roomCategoryBg}
                                </td>
                                <td>
                                    <span>CATEGORY AND NUMBER OF ROOMS:</span> {voucherPrintData.roomCategoryEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДАТА И ЧАС НА ПРИСТИГАНЕ:</span> {voucherPrintData.checkInBg}
                                </td>
                                <td>
                                    <span>CHECK IN:</span> {voucherPrintData.checkInEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДАТА И ЧАС НА ЗАМИНАВАНЕ:</span> {voucherPrintData.checkOutBg}
                                </td>
                                <td>
                                    <span>CHECK OUT:</span> {voucherPrintData.checkOutEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ЕКСКУРЗИОННА ПРОГРАМА:</span> {voucherPrintData.excursionsBg}
                                </td>
                                <td>
                                    <span>EXCURSIONS:</span> {voucherPrintData.excursionsEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДРУГИ УСЛУГИ:</span> {voucherPrintData.otherServicesBg}
                                </td>
                                <td>
                                    <span>OTHER SERVICES:</span> {voucherPrintData.otherServicesEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ЗАБЕЛЕЖКИ:</span> {voucherPrintData.notesBg}
                                </td>
                                <td>
                                    <span>NOTES:</span> {voucherPrintData.notesEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДАТА:</span> {voucherPrintData.dateIssuedBg}
                                </td>
                                <td>
                                    <span>DATE:</span> {voucherPrintData.dateIssuedEn}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                    <div>
                                        {voucherPrintData.paymentDocNumBg} / {voucherPrintData.paymentDocDateBg}
                                    </div>
                                </td>
                                <td>
                                    <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                    <div>
                                        {voucherPrintData.paymentDocNumEn} / {voucherPrintData.paymentDocDateEn}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="text-center">
                                    <div className="signature-line"></div>
                                    <div className="signature-text">ПОДПИС И ПЕЧАТ НА ФИРМА ИЗПРАЩАЧ / SENDER COMPANY SIGNATURE AND STAMP</div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="text-center">
                                    <div className="signature-line"></div>
                                    <div className="signature-text">ПОДПИС И ПЕЧАТ НА ПРИЕМАЩА ФИРМА / RECEIVING COMPANY SIGNATURE AND STAMP</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VoucherPrint;
