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

    // Helper to format date-time for local input types (used for screen display)
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

    // Helper to format date for local input types (used for screen display)
    const formatDateLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Helper for date formatting specifically for print output
    const formatDateForPrint = useCallback((dateString) => {
        if (!dateString) return '..................';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date'; // Use getTime() to check for invalid dates
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error("Error formatting date for print:", error);
            return 'Date Error';
        }
    }, []);

    // Helper for datetime formatting specifically for print output
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

    // Helper to get a value, with fallback if blank (used for print output)
    const getValue = useCallback((val, fallback = '') => (val !== null && val !== undefined && val !== '' ? val : fallback), []);


    // Effect to populate fields from reservationData when component mounts or data changes
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(reservationData.reservationNumber || '');
            setDestinationBulgarian(reservationData.hotel || ''); // Assuming hotel is the main destination
            setDestinationEnglish(reservationData.hotel || '');

            // Populate tourists
            const mappedTourists = reservationData.tourists.map(t => ({
                bgName: `${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), // Use full name
                enName: `${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), // Assuming English name is same as Bulgarian
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

            setExcursionsBg(''); // No direct mapping, leave blank for manual entry
            setExcursionsEn(''); // No direct mapping, leave blank for manual entry
            setOtherServicesBg(''); // No direct mapping, leave blank for manual entry
            setOtherServicesEn(''); // No direct mapping, leave blank for manual entry
            setNotesBg(''); // No direct mapping, leave blank for manual entry
            setNotesEn(''); // No direct mapping, leave blank for manual entry

            setDateIssuedBg(formatDateLocal(new Date().toISOString().split('T')[0])); // Current date for issuance
            setDateIssuedEn(formatDateLocal(new Date().toISOString().split('T')[0]));
            
            // Payment document details usually come from financial transactions, not directly from reservation
            setPaymentDocNumBg(''); // Blank for manual entry
            setPaymentDocDateBg(''); // Blank for manual entry
            setPaymentDocNumEn(''); // Blank for manual entry
            setPaymentDocDateEn(''); // Blank for manual entry
        }
    }, [reservationData, formatDateTimeLocal, formatDateLocal, getValue]); // Added getValue to dependencies


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
        formatDateForPrint, formatDateTimeForPrint, getValue // Add helper functions to dependency array
    ]);

    // Handle print functionality
    const handlePrintVoucher = useCallback(() => {
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

    if (!reservationData) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-100px)]">
                <div className="text-gray-600 text-lg animate-pulse">Loading voucher data...</div>
            </div>
        );
    }

    return (
        <div className="print-preview-container w-full flex flex-col justify-center items-center min-h-screen p-20">
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
                                    <input type="date" id="dateIssuedBg" class="input-field" value={dateIssuedBg} onChange={(e) => setDateIssuedBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>DATE:</span>
                                    <input type="date" id="dateIssuedEn" class="input-field" value={dateIssuedEn} onChange={(e) => setDateIssuedEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                    <div class="payment-doc-container">
                                        <input type="text" id="paymentDocNumBg" class="input-field" placeholder="Номер на документ" value={paymentDocNumBg} onChange={(e) => setPaymentDocNumBg(e.target.value)} />
                                        <input type="date" id="paymentDocDateBg" class="input-field" value={paymentDocDateBg} onChange={(e) => setPaymentDocDateBg(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                    <div class="payment-doc-container">
                                        <input type="text" id="paymentDocNumEn" class="input-field" placeholder="Document Number" value={paymentDocNumEn} onChange={(e) => setPaymentDocNumEn(e.target.value)} />
                                        <input type="date" id="paymentDocDateEn" class="input-field" placeholder="Date of Payment" value={paymentDocDateEn} onChange={(e) => setPaymentDocDateEn(e.target.value)} />
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

            {/* This section contains the ACTUAL content to be printed. It's hidden on screen by CSS. */}
            <div className="print-only">
                <div class="voucher-container">
                    {/* Logo Section */}
                    <div class="logo-section">
                        <img src={Logo} alt="Company Logo" class="h-24 object-contain rounded-lg"></img>
                    </div>

                    {/* Static Information Table */}
                    <table class="info-table">
                        <thead>
                            <tr>
                                <th colSpan="2" class="header-row">
                                    РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA
                                </th>
                            </tr>
                            <tr>
                                <th colSpan="2" class="header-row">
                                    ВАУЧЕР / VOUCHER:
                                    <span id="pdf-voucherNumber"></span>
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
                                <td colSpan="2" class="header-row">
                                    <span id="pdf-voucherTypeText"></span>
                                </td>
                            </tr>
                            {/* Combined input fields for "ЗА ПРЕДСТАВЯНЕ В" and "TO" */}
                            <tr>
                                <td>
                                    <div class="flex-container">
                                        <span>ЗА ПРЕДСТАВЯНЕ В:</span>
                                        <span id="pdf-destinationBulgarian"></span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex-container">
                                        <span>TO:</span>
                                        <span id="pdf-destinationEnglish"></span>
                                    </div>
                                </td>
                            </tr>
                            {/* Tourist Names Section */}
                            <tr>
                                <td colSpan="2" class="header-row">
                                    ИМЕ И ФАМИЛИЯ НА ТУРИСТА / NAME AND SURNAME OF TOURIST
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2">
                                    <div id="pdf-tourist-names-container" class="space-y-1">
                                        {/* Tourist names will be dynamically injected here by JS */}
                                    </div>
                                </td>
                            </tr>
                            {/* Adults and Children Fields */}
                            <tr>
                                <td>
                                    <div class="number-input-container">
                                        <span>ВЪЗРАСТНИ:</span>
                                        <span id="pdf-adultsCountBg"></span>
                                    </div>
                                </td>
                                <td>
                                    <div class="number-input-container">
                                        <span>ADULTS:</span>
                                        <span id="pdf-adultsCountEn"></span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="number-input-container">
                                        <span>ДЕЦА (РЕДОВНО ЛЕГЛО):</span>
                                        <span id="pdf-childrenRegularBedCountBg"></span>
                                    </div>
                                </td>
                            <td>
                                <div class="number-input-container">
                                    <span>CHILDREN (REGULAR BED):</span>
                                    <span id="pdf-childrenRegularBedCountEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="number-input-container">
                                    <span>ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО):</span>
                                    <span id="pdf-childrenExtraBedCountBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="number-input-container">
                                    <span>CHILDREN (EXTRA BED):</span>
                                    <span id="pdf-childrenExtraBedCountEn"></span>
                                </div>
                            </td>
                        </tr>
                        {/* Itinerary, Destination, Dates, Accommodation, Room Category */}
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>МАРШРУТ:</span>
                                    <span id="pdf-itineraryBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>ITINERARY:</span>
                                    <span id="pdf-itineraryEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>МЯСТО:</span>
                                    <span id="pdf-destinationPlaceBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>DESTINATION:</span>
                                    <span id="pdf-destinationPlaceEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>СРОК:</span>
                                    <div class="date-range-container">
                                        <span id="pdf-dateStartBg"></span>
                                        <span>-</span>
                                        <span id="pdf-dateEndBg"></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>DATES OF ITINERARY:</span>
                                    <div class="date-range-container">
                                        <span id="pdf-dateStartEn"></span>
                                        <span>-</span>
                                        <span id="pdf-dateEndEn"></span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>НАСТАНЯВАНЕ В:</span>
                                    <span id="pdf-accommodationBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>ACCOMMODATION AT:</span>
                                    <span id="pdf-accommodationEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>КАТЕГОРИЯ И БРОЙ СТАИ:</span>
                                    <span id="pdf-roomCategoryBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>CATEGORY AND NUMBER OF ROOMS:</span>
                                    <span id="pdf-roomCategoryEn"></span>
                                </div>
                            </td>
                        </tr>
                        {/* Check-in/out, Excursions, Other Services, Notes, Date, Payment Doc */}
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ДАТА И ЧАС НА ПРИСТИГАНЕ:</span>
                                    <div class="date-time-container">
                                        <span id="pdf-checkInBg"></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>CHECK IN:</span>
                                    <div class="date-time-container">
                                        <span id="pdf-checkInEn"></span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ДАТА И ЧАС НА ЗАМИНАВАНЕ:</span>
                                    <div class="date-time-container">
                                        <span id="pdf-checkOutBg"></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>CHECK OUT:</span>
                                    <div class="date-time-container">
                                        <span id="pdf-checkOutEn"></span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ЕКСКУРЗИОННА ПРОГРАМА:</span>
                                    <span id="pdf-excursionsBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>EXCURSIONS:</span>
                                    <span id="pdf-excursionsEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ДРУГИ УСЛУГИ:</span>
                                    <span id="pdf-otherServicesBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>OTHER SERVICES:</span>
                                    <span id="pdf-otherServicesEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ЗАБЕЛЕЖКИ:</span>
                                    <span id="pdf-notesBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>NOTES:</span>
                                    <span id="pdf-notesEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>ДАТА:</span>
                                    <span id="pdf-dateIssuedBg"></span>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>DATE:</span>
                                    <span id="pdf-dateIssuedEn"></span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="flex-container">
                                    <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                    <div class="payment-doc-container">
                                        <span id="pdf-paymentDocNumBg"></span>
                                        <span id="pdf-paymentDocDateBg"></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex-container">
                                    <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                    <div class="payment-doc-container">
                                        <span id="pdf-paymentDocNumEn"></span>
                                        <span id="pdf-paymentDocDateEn"></span>
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
            {/* End of print-only content wrapper */}
        </div>
        /* END OF ENTIRE COMPONENT RETURN */
    );
};

export default VoucherPrint;
