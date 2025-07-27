import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './VoucherPrint.css'; // Import the new CSS file
import Logo from './Logo.png'; // Assuming your logo is in the same directory as App.jsx

const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    const voucherRef = useRef(null); // Ref for the main voucher container
    
    // State variables for the form inputs
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

    // Helper for date formatting specifically for print output (Bulgarian locale style)
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
    const getValue = useCallback((val, fallback = '..................') => {
        if (val === null || val === undefined || val === '') {
            return fallback;
        }
        // Special handling for numbers that might be 0 but should print as "0" not "..."
        if (typeof val === 'number' && val === 0 && fallback === '..................') {
            return '0';
        }
        return val;
    }, []);

    // Effect to populate fields from reservationData when component mounts or data changes
    useEffect(() => {
        if (reservationData) {
            setVoucherNumber(getValue(reservationData.reservationNumber, '')); // Use empty string for voucher number fallback for better generation
            setDestinationBulgarian(getValue(reservationData.hotel, '')); // Assuming hotel is the main destination
            setDestinationEnglish(getValue(reservationData.hotel, ''));

            // Populate tourists
            const mappedTourists = (reservationData.tourists || []).map(t => ({
                bgName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Неизвестно'), 
                enName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Unknown'), 
            }));
            setTourists(mappedTourists);

            setAdultsCountBg(getValue(reservationData.adults, 0));
            setAdultsCountEn(getValue(reservationData.adults, 0));
            setChildrenRegularBedCountBg(getValue(reservationData.children, 0)); // Assuming all children are regular bed initially
            setChildrenRegularBedCountEn(getValue(reservationData.children, 0));
            setChildrenExtraBedCountBg(0); // No direct mapping, default to 0
            setChildrenExtraBedCountEn(0);

            // Itinerary is usually a combination of place and hotel for reservations
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

            // You might need more specific time data for checkIn/Out in future if needed
            setCheckInBg(formatDateTimeLocal(reservationData.checkIn)); 
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
    }, [reservationData, formatDateTimeLocal, formatDateLocal, getValue]);


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

    // Handle print functionality
    const handlePrintVoucher = useCallback(() => {
        // No direct DOM manipulation (like populatePrintContent) is needed here anymore.
        // React has already rendered the content to the DOM based on state.
        
        // A small delay can still be useful to ensure the browser has fully rendered
        // any pending visual updates or applied all CSS rules before opening the print dialog.
        const timer = setTimeout(() => {
            window.print();
        }, 100);

        // Call onPrintFinish when the print dialog is closed or print is completed/cancelled
        window.onafterprint = () => {
            onPrintFinish();
            window.onafterprint = null; // Clean up the event listener
        };

        return () => {
            clearTimeout(timer);
            window.onafterprint = null; // Clean up on component unmount
        };
    }, [onPrintFinish]);

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
                {/* Logo Section - Visible on screen (no-print is used below) */}
                <div className="logo-section no-print">
                    <img src={Logo} alt="Company Logo" className="h-24 object-contain rounded-lg"></img>
                </div>

                {/* Static Information Table (visible part) */}
                <table className="info-table no-print">
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

                {/* Print Button - Hidden in print by CSS */}
                <button id="printVoucherBtn" className="print-button add-button mt-8 mb-8 no-print" onClick={handlePrintVoucher}>Print Voucher</button>
            </div>

            {/* This section contains the ACTUAL content to be printed. It's hidden on screen by CSS. */}
            <div className="print-only">
                <div className="voucher-container print-content-styling"> {/* Use a specific class for print styling */}
                    {/* Logo Section for Print */}
                    <div className="logo-section">
                        <img src={Logo} alt="Company Logo"></img>
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
                                    ВАУЧЕР / VOUCHER: {getValue(voucherNumber, '..................')}
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
                            {/* Voucher Type (Original/Copy) for Print */}
                            <tr>
                                <td colSpan="2" className="header-row">
                                    {voucherType === 'original' ? 'ОРИГИНАЛ / ORIGINAL' : 'КОПИЕ / COPY'}
                                </td>
                            </tr>
                            {/* Destination for Print */}
                            <tr>
                                <td>
                                    <span>ЗА ПРЕДСТАВЯНЕ В:</span> {getValue(destinationBulgarian)}
                                </td>
                                <td>
                                    <span>TO:</span> {getValue(destinationEnglish)}
                                </td>
                            </tr>
                            {/* Tourist Names for Print */}
                            <tr>
                                <td colSpan="2" className="header-row">
                                    ИМЕ И ФАМИЛИЯ НА ТУРИСТА / NAME AND SURNAME OF TOURIST
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2">
                                    {tourists.map((tourist, index) => (
                                        <div key={index}>{getValue(tourist.bgName, '........................................')} / {getValue(tourist.enName, '........................................')}</div>
                                    ))}
                                    {/* Fill up to 7 lines with blank if less than 7 tourists */}
                                    {Array.from({ length: Math.max(0, 7 - tourists.length) }).map((_, i) => (
                                        <div key={`blank-tourist-${i}`}>........................................ / ........................................</div>
                                    ))}
                                </td>
                            </tr>
                            {/* Adults and Children Counts for Print */}
                            <tr>
                                <td>
                                    <span>ВЪЗРАСТНИ:</span> {getValue(adultsCountBg, '0')}
                                </td>
                                <td>
                                    <span>ADULTS:</span> {getValue(adultsCountEn, '0')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДЕЦА (РЕДОВНО ЛЕГЛО):</span> {getValue(childrenRegularBedCountBg, '0')}
                                </td>
                                <td>
                                    <span>CHILDREN (REGULAR BED):</span> {getValue(childrenRegularBedCountEn, '0')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО):</span> {getValue(childrenExtraBedCountBg, '0')}
                                </td>
                                <td>
                                    <span>CHILDREN (EXTRA BED):</span> {getValue(childrenExtraBedCountEn, '0')}
                                </td>
                            </tr>
                            {/* Itinerary, Destination, Dates, Accommodation, Room Category for Print */}
                            <tr>
                                <td>
                                    <span>МАРШРУТ:</span> {getValue(itineraryBg)}
                                </td>
                                <td>
                                    <span>ITINERARY:</span> {getValue(itineraryEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>МЯСТО:</span> {getValue(destinationPlaceBg)}
                                </td>
                                <td>
                                    <span>DESTINATION:</span> {getValue(destinationPlaceEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>СРОК:</span> {formatDateForPrint(dateStartBg)} - {formatDateForPrint(dateEndBg)}
                                </td>
                                <td>
                                    <span>DATES OF ITINERARY:</span> {formatDateForPrint(dateStartEn)} - {formatDateForPrint(dateEndEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>НАСТАНЯВАНЕ В:</span> {getValue(accommodationBg)}
                                </td>
                                <td>
                                    <span>ACCOMMODATION AT:</span> {getValue(accommodationEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>КАТЕГОРИЯ И БРОЙ СТАИ:</span> {getValue(roomCategoryBg)}
                                </td>
                                <td>
                                    <span>CATEGORY AND NUMBER OF ROOMS:</span> {getValue(roomCategoryEn)}
                                </td>
                            </tr>
                            {/* Check-in/out for Print */}
                            <tr>
                                <td>
                                    <span>ДАТА И ЧАС НА ПРИСТИГАНЕ:</span> {formatDateTimeForPrint(checkInBg)}
                                </td>
                                <td>
                                    <span>CHECK IN:</span> {formatDateTimeForPrint(checkInEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДАТА И ЧАС НА ЗАМИНАВАНЕ:</span> {formatDateTimeForPrint(checkOutBg)}
                                </td>
                                <td>
                                    <span>CHECK OUT:</span> {formatDateTimeForPrint(checkOutEn)}
                                </td>
                            </tr>
                            {/* Excursions, Other Services, Notes for Print */}
                            <tr>
                                <td>
                                    <span>ЕКСКУРЗИОННА ПРОГРАМА:</span> {getValue(excursionsBg)}
                                </td>
                                <td>
                                    <span>EXCURSIONS:</span> {getValue(excursionsEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ДРУГИ УСЛУГИ:</span> {getValue(otherServicesBg)}
                                </td>
                                <td>
                                    <span>OTHER SERVICES:</span> {getValue(otherServicesEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>ЗАБЕЛЕЖКИ:</span> {getValue(notesBg)}
                                </td>
                                <td>
                                    <span>NOTES:</span> {getValue(notesEn)}
                                </td>
                            </tr>
                            {/* Issued Date and Payment Doc for Print */}
                            <tr>
                                <td>
                                    <span>ДАТА:</span> {formatDateForPrint(dateIssuedBg)}
                                </td>
                                <td>
                                    <span>DATE:</span> {formatDateForPrint(dateIssuedEn)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                    <div>
                                        {getValue(paymentDocNumBg)} / {formatDateForPrint(paymentDocDateBg)}
                                    </div>
                                </td>
                                <td>
                                    <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                    <div>
                                        {getValue(paymentDocNumEn)} / {formatDateForPrint(paymentDocDateEn)}
                                    </div>
                                </td>
                            </tr>
                            {/* Signature Lines for Print */}
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
