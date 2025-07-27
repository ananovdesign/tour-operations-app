import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VoucherPrint.css'; // Import the new CSS file
import Logo from './Logo.png'; // Assuming your logo is in the same directory as App.jsx

const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    const voucherRef = useRef(null); // Ref for the main voucher container
    const [voucherNumber, setVoucherNumber] = useState('');
    const [voucherType, setVoucherType] = useState('original');
    const [destinationBulgarian, setDestinationBulgarian] = useState('');
    const [destinationEnglish, setDestinationEnglish] = useState('');

    // Tourist Names (dynamic list of objects { bgName, enName })
    const [tourists, setTourists] = useState([]);

    const [adultsCountBg, setAdultsCountBg] = useState(0);
    const [adultsCountEn, setAdultsCountEn] = useState(0);
    const [childrenRegularBedCountBg, setChildrenRegularBedCountBg] = useState(0);
    const [childrenRegularBedCountEn, setChildrenRegularBedCountEn] = useState(0);
    const [childrenExtraBedCountBg, setChildrenExtraBedCountBg] = useState(0);
    const [childrenExtraBedCountEn, setChildrenExtraBedCountEn] = useState(0);

    const [itineraryBg, setItineraryBg] = useState('');
    const [itineraryEn, setItineraryEn] = useState('');
    const [destinationPlaceBg, setDestinationPlaceBg] = useState(''); // Renamed from destinationBg to avoid clash
    const [destinationPlaceEn, setDestinationPlaceEn] = useState(''); // Renamed from destinationEn to avoid clash
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

    // Helper to format date-time for local input types
    const formatDateTimeLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Ensure the date is treated as local time to avoid timezone issues with input type="datetime-local"
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }, []);

    // Helper to format date for local input types
    const formatDateLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Effect to populate fields from reservationData when component mounts or data changes
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(reservationData.reservationNumber || '');
            setDestinationBulgarian(reservationData.hotel || ''); // Assuming hotel is the main destination
            setDestinationEnglish(reservationData.hotel || '');

            // Populate tourists
            const mappedTourists = reservationData.tourists.map(t => ({
                bgName: `${t.firstName || ''} ${t.familyName || ''}`.trim(),
                enName: `${t.firstName || ''} ${t.familyName || ''}`.trim(), // Assuming English name is same as Bulgarian
            }));
            setTourists(mappedTourists);

            setAdultsCountBg(reservationData.adults || 0);
            setAdultsCountEn(reservationData.adults || 0);
            setChildrenRegularBedCountBg(reservationData.children || 0); // Assuming all children are regular bed
            setChildrenRegularBedCountEn(reservationData.children || 0);
            setChildrenExtraBedCountBg(0); // No direct mapping, default to 0
            setChildrenExtraBedCountEn(0);

            // Itinerary is usually a combination of place and hotel for reservations
            setItineraryBg(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim());
            setItineraryEn(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim());
            setDestinationPlaceBg(reservationData.place || '');
            setDestinationPlaceEn(reservationData.place || '');

            setDateStartBg(formatDateLocal(reservationData.checkIn));
            setDateEndBg(formatDateLocal(reservationData.checkOut));
            setDateStartEn(formatDateLocal(reservationData.checkIn));
            setDateEndEn(formatDateLocal(reservationData.checkOut));

            setAccommodationBg(reservationData.hotel || '');
            setAccommodationEn(reservationData.hotel || '');
            setRoomCategoryBg(reservationData.roomType || '');
            setRoomCategoryEn(reservationData.roomType || '');

            setCheckInBg(formatDateTimeLocal(reservationData.checkIn)); // You might need more specific time data for checkIn/Out
            setCheckInEn(formatDateTimeLocal(reservationData.checkIn));
            setCheckOutBg(formatDateTimeLocal(reservationData.checkOut));
            setCheckOutEn(formatDateTimeLocal(reservationData.checkOut));

            setExcursionsBg(''); // No direct mapping, leave blank
            setExcursionsEn('');
            setOtherServicesBg(''); // No direct mapping, leave blank
            setOtherServicesEn('');
            setNotesBg(''); // No direct mapping, leave blank
            setNotesEn('');

            setDateIssuedBg(formatDateLocal(new Date().toISOString().split('T')[0])); // Current date for issuance
            setDateIssuedEn(formatDateLocal(new Date().toISOString().split('T')[0]));
            
            // Payment document details usually come from financial transactions, not directly from reservation
            setPaymentDocNumBg('');
            setPaymentDocDateBg('');
            setPaymentDocNumEn('');
            setPaymentDocDateEn('');
        }
    }, [reservationData, formatDateTimeLocal, formatDateLocal]);


    // Function to handle adding a new tourist row
    const addTouristRow = useCallback(() => {
        setTourists(prevTourists => [...prevTourists, { bgName: '', enName: '' }]);
    }, []);

    // Function to handle removing a tourist row
    const removeTouristRow = useCallback((indexToRemove) => {
        setTourists(prevTourists => prevTourists.filter((_, index) => index !== indexToRemove));
    }, []);

    // Handle input changes for dynamic tourist rows
    const handleTouristChange = useCallback((index, field, value) => {
        setTourists(prevTourists => {
            const newTourists = [...prevTourists];
            newTourists[index] = { ...newTourists[index], [field]: value };
            return newTourists;
        });
    }, []);

    // Function to populate the HIDDEN print-only content based on current form values
    const populatePrintContent = useCallback(() => {
        // Helper to get a value, with fallback if blank
        const getValue = (val, fallback = '') => (val !== null && val !== undefined && val !== '' ? val : fallback);
        // Helper for date formatting
        const formatDateForPrint = (dateString) => {
            if (!dateString) return '..................';
            try {
                const date = new Date(dateString);
                if (isNaN(date)) return 'Invalid Date'; // Handle invalid date strings
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            } catch (error) {
                console.error("Error formatting date for print:", error);
                return 'Date Error';
            }
        };
        const formatDateTimeForPrint = (dateTimeLocalString) => {
            if (!dateTimeLocalString) return '..................';
            try {
                const date = new Date(dateTimeLocalString);
                if (isNaN(date)) return 'Invalid DateTime';
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
        };

        // Populate header fields
        document.getElementById('pdf-voucherNumber').textContent = getValue(voucherNumber);
        document.getElementById('pdf-destinationBulgarian').textContent = getValue(destinationBulgarian);
        document.getElementById('pdf-destinationEnglish').textContent = getValue(destinationEnglish);

        // Populate tourist names (dynamic list)
        const pdfTouristNamesContainer = document.getElementById('pdf-tourist-names-container');
        if (pdfTouristNamesContainer) {
            let touristListHtml = '';
            tourists.forEach(t => {
                touristListHtml += `<div>${getValue(t.bgName)} / ${getValue(t.enName)}</div>`;
            });
            pdfTouristNamesContainer.innerHTML = touristListHtml;
        }

        // Populate counts
        document.getElementById('pdf-adultsCountBg').textContent = getValue(adultsCountBg);
        document.getElementById('pdf-adultsCountEn').textContent = getValue(adultsCountEn);
        document.getElementById('pdf-childrenRegularBedCountBg').textContent = getValue(childrenRegularBedCountBg);
        document.getElementById('pdf-childrenRegularBedCountEn').textContent = getValue(childrenRegularBedCountEn);
        document.getElementById('pdf-childrenExtraBedCountBg').textContent = getValue(childrenExtraBedCountBg);
        document.getElementById('pdf-childrenExtraBedCountEn').textContent = getValue(childrenExtraBedCountEn);

        // Populate itinerary and destination
        document.getElementById('pdf-itineraryBg').textContent = getValue(itineraryBg);
        document.getElementById('pdf-itineraryEn').textContent = getValue(itineraryEn);
        document.getElementById('pdf-destinationPlaceBg').textContent = getValue(destinationPlaceBg);
        document.getElementById('pdf-destinationPlaceEn').textContent = getValue(destinationPlaceEn);

        // Populate dates of itinerary
        document.getElementById('pdf-dateStartBg').textContent = formatDateForPrint(dateStartBg);
        document.getElementById('pdf-dateEndBg').textContent = formatDateForPrint(dateEndBg);
        document.getElementById('pdf-dateStartEn').textContent = formatDateForPrint(dateStartEn);
        document.getElementById('pdf-dateEndEn').textContent = formatDateForPrint(dateEndEn);

        // Populate accommodation
        document.getElementById('pdf-accommodationBg').textContent = getValue(accommodationBg);
        document.getElementById('pdf-accommodationEn').textContent = getValue(accommodationEn);
        document.getElementById('pdf-roomCategoryBg').textContent = getValue(roomCategoryBg);
        document.getElementById('pdf-roomCategoryEn').textContent = getValue(roomCategoryEn);

        // Populate check-in/out
        document.getElementById('pdf-checkInBg').textContent = formatDateTimeForPrint(checkInBg);
        document.getElementById('pdf-checkInEn').textContent = formatDateTimeForPrint(checkInEn);
        document.getElementById('pdf-checkOutBg').textContent = formatDateTimeForPrint(checkOutBg);
        document.getElementById('pdf-checkOutEn').textContent = formatDateTimeForPrint(checkOutEn);

        // Populate other details
        document.getElementById('pdf-excursionsBg').textContent = getValue(excursionsBg);
        document.getElementById('pdf-excursionsEn').textContent = getValue(excursionsEn);
        document.getElementById('pdf-otherServicesBg').textContent = getValue(otherServicesBg);
        document.getElementById('pdf-otherServicesEn').textContent = getValue(otherServicesEn);
        document.getElementById('pdf-notesBg').textContent = getValue(notesBg);
        document.getElementById('pdf-notesEn').textContent = getValue(notesEn);

        // Populate issued date and payment document
        document.getElementById('pdf-dateIssuedBg').textContent = formatDateForPrint(dateIssuedBg);
        document.getElementById('pdf-dateIssuedEn').textContent = formatDateForPrint(dateIssuedEn);
        document.getElementById('pdf-paymentDocNumBg').textContent = getValue(paymentDocNumBg);
        document.getElementById('pdf-paymentDocDateBg').textContent = formatDateForPrint(paymentDocDateBg);
        document.getElementById('pdf-paymentDocNumEn').textContent = getValue(paymentDocNumEn);
        document.getElementById('pdf-paymentDocDateEn').textContent = formatDateForPrint(paymentDocDateEn);

        // Set voucher type text
        document.getElementById('pdf-voucherTypeText').textContent = voucherType === 'original' ? 'ОРИГИНАЛ / ORIGINAL' : 'КОПИЕ / COPY';

    }, [
        voucherNumber, voucherType, destinationBulgarian, destinationEnglish, tourists,
        adultsCountBg, adultsCountEn, childrenRegularBedCountBg, childrenRegularBedCountEn, childrenExtraBedCountBg, childrenExtraBedCountEn,
        itineraryBg, itineraryEn, destinationPlaceBg, destinationPlaceEn, dateStartBg, dateEndBg, dateStartEn, dateEndEn,
        accommodationBg, accommodationEn, roomCategoryBg, roomCategoryEn, checkInBg, checkInEn, checkOutBg, checkOutEn,
        excursionsBg, excursionsEn, otherServicesBg, otherServicesEn, notesBg, notesEn,
        dateIssuedBg, dateIssuedEn, paymentDocNumBg, paymentDocDateBg, paymentDocNumEn, paymentDocDateEn,
        formatDateForPrint, formatDateTimeForPrint // Add helper functions to dependency array
    ]);

    // Handle print functionality
    useEffect(() => { // Changed to useEffect for consistency with InvoicePrint
        const timer = setTimeout(() => {
            window.print();
            window.onafterprint = onPrintFinish;
        }, 500); // Small delay to ensure content is fully rendered

        return () => {
            clearTimeout(timer);
            window.onafterprint = null; // Clean up on component unmount
        };
    }, [onPrintFinish, populatePrintContent]); // Dependencies for useEffect

    if (!reservationData) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
                <div className="text-gray-600 text-lg animate-pulse">Loading voucher data...</div>
            </div>
        );
    }

    return (
        <div className="print-preview-container w-full flex flex-col justify-center items-center min-h-screen p-20">
            {/* ADD THIS WRAPPER DIV HERE */}
            <div className="print-only">
                <div className="voucher-container">
                    {/* Logo Section */}
                    <div className="logo-section">
                        <img src={Logo} alt="Company Logo" className="h-24 object-contain rounded-lg"></img>
                    </div>

                    {/* Static Information Table */}
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
                            {/* Itinerary, Destination, Dates, Accommodation, Room Category */}
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
                            {/* Check-in/out, Excursions, Other Services, Notes, Date, Payment Doc */}
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
                            {/* Signature Lines */}
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
            </div> {/* END OF THE NEW WRAPPER DIV */}

            {/* Print Button - Keep this outside the print-only div */}
            <button id="printVoucherBtn" className="print-button add-button mt-8 mb-8" onClick={handlePrintVoucher}>Print Voucher</button>
        </div>
    );
};

export default VoucherPrint;
