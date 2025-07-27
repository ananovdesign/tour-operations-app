import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VoucherPrint.css'; // Import the new CSS file
import Logo from './Logo.png'; // Assuming your logo is in the same directory as App.jsx

// --- Helper functions for date/time formatting (MOVED TO TOP-LEVEL SCOPE) ---
// These functions are placed here so they are always defined and accessible
// before the main component uses them.
const formatDateForPrint = (dateString) => {
    if (!dateString) return '..................';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Use .getTime() for robust NaN check
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
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
        if (isNaN(date.getTime())) return 'Invalid DateTime'; // Use .getTime() for robust NaN check
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
// --- END of Helper functions ---


const VoucherPrint = ({ reservationData, onPrintFinish }) => {
    // Ref for the actual content that gets sent to print
    const printContentRef = useRef(null);

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

    // Helper to format date-time for local input types (used for populating form input fields)
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

    // Helper to format date for local input types (used for populating form input fields)
    const formatDateLocal = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Effect to populate form fields from reservationData when component mounts or data changes
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


    // Function to handle adding a new tourist row for the form inputs
    const addTouristRow = useCallback(() => {
        setTourists(prevTourists => [...prevTourists, { bgName: '', enName: '' }]);
    }, []);

    // Function to handle removing a tourist row for the form inputs
    const removeTouristRow = useCallback((indexToRemove) => {
        setTourists(prevTourists => prevTourists.filter((_, index) => index !== indexToRemove));
    }, []);

    // Handle input changes for dynamic tourist rows in the form
    const handleTouristChange = useCallback((index, field, value) => {
        setTourists(prevTourists => {
            const newTourists = [...prevTourists];
            newTourists[index] = { ...newTourists[index], [field]: value };
            return newTourists;
        });
    }, []);


    // This function is explicitly called by the "Print Voucher" button.
    const handlePrintButtonClick = useCallback(() => {
        if (printContentRef.current) {
            const timer = setTimeout(() => {
                window.print();
                // Call onPrintFinish when the print dialog is closed or print is completed/cancelled
                window.onafterprint = () => {
                    onPrintFinish();
                    window.onafterprint = null; // Clean up the event listener
                };
            }, 500); // Small delay to ensure content is fully rendered. Adjust if issues persist.

            // Optional: Cleanup if the component unmounts before timeout/print
            return () => {
                clearTimeout(timer);
                window.onafterprint = null;
            };
        }
    }, [onPrintFinish]);


    // Helper for input values, to prevent "uncontrolled component" warnings for null/undefined
    const getValueForInput = (val) => (val !== null && val !== undefined ? val : '');

    // Main component render function
    return (
        <div className="print-preview-container w-full flex flex-col justify-center items-center min-h-screen p-20">
            {/* The primary, visible form that users interact with */}
            <div className="voucher-container">
                {/* Logo Section */}
                <div className="logo-section">
                    <img src={Logo} alt="Company Logo" className="h-24 object-contain rounded-lg"></img>
                </div>

                {/* Static Information Table (Interactive Form Fields) */}
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
                                <input type="text" id="voucherNumberInput" className="input-field mt-2" placeholder="Enter Voucher Number" value={getValueForInput(voucherNumber)} onChange={(e) => setVoucherNumber(e.target.value)} />
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
                                <select id="voucherTypeSelect" className="select-field" value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
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
                                    <input type="text" id="destinationBulgarianInput" className="input-field" placeholder="Въведете дестинация" value={getValueForInput(destinationBulgarian)} onChange={(e) => setDestinationBulgarian(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>TO:</span>
                                    <input type="text" id="destinationEnglishInput" className="input-field" placeholder="Enter Destination" value={getValueForInput(destinationEnglish)} onChange={(e) => setDestinationEnglish(e.target.value)} />
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
                                            <input type="text" className="input-field tourist-name-bg" placeholder="Име и фамилия (Български)" value={getValueForInput(tourist.bgName)} onChange={(e) => handleTouristChange(index, 'bgName', e.target.value)} />
                                            <input type="text" className="input-field tourist-name-en" placeholder="Name and Surname (English)" value={getValueForInput(tourist.enName)} onChange={(e) => handleTouristChange(index, 'enName', e.target.value)} />
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
                                    <input type="number" id="adultsCountBgInput" className="input-field" value={getValueForInput(adultsCountBg)} onChange={(e) => { setAdultsCountBg(parseInt(e.target.value) || 0); setAdultsCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>ADULTS:</span>
                                    <input type="number" id="adultsCountEnInput" className="input-field" value={getValueForInput(adultsCountEn)} onChange={(e) => { setAdultsCountEn(parseInt(e.target.value) || 0); setAdultsCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="number-input-container">
                                    <span>ДЕЦА (РЕДОВНО ЛЕГЛО):</span>
                                    <input type="number" id="childrenRegularBedCountBgInput" className="input-field" value={getValueForInput(childrenRegularBedCountBg)} onChange={(e) => { setChildrenRegularBedCountBg(parseInt(e.target.value) || 0); setChildrenRegularBedCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>CHILDREN (REGULAR BED):</span>
                                    <input type="number" id="childrenRegularBedCountEnInput" className="input-field" value={getValueForInput(childrenRegularBedCountEn)} onChange={(e) => { setChildrenRegularBedCountEn(parseInt(e.target.value) || 0); setChildrenRegularBedCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="number-input-container">
                                    <span>ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО):</span>
                                    <input type="number" id="childrenExtraBedCountBgInput" className="input-field" value={getValueForInput(childrenExtraBedCountBg)} onChange={(e) => { setChildrenExtraBedCountBg(parseInt(e.target.value) || 0); setChildrenExtraBedCountEn(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                            <td>
                                <div className="number-input-container">
                                    <span>CHILDREN (EXTRA BED):</span>
                                    <input type="number" id="childrenExtraBedCountEnInput" className="input-field" value={getValueForInput(childrenExtraBedCountEn)} onChange={(e) => { setChildrenExtraBedCountEn(parseInt(e.target.value) || 0); setChildrenExtraBedCountBg(parseInt(e.target.value) || 0); }} min="0" />
                                </div>
                            </td>
                        </tr>
                        {/* Itinerary, Destination, Dates, Accommodation, Room Category */}
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>МАРШРУТ:</span>
                                    <input type="text" id="itineraryBgInput" className="input-field" placeholder="Въведете маршрут" value={getValueForInput(itineraryBg)} onChange={(e) => setItineraryBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>ITINERARY:</span>
                                    <input type="text" id="itineraryEnInput" className="input-field" placeholder="Enter Itinerary" value={getValueForInput(itineraryEn)} onChange={(e) => setItineraryEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>МЯСТО:</span>
                                    <input type="text" id="destinationBgInput" className="input-field" placeholder="Въведете място" value={getValueForInput(destinationPlaceBg)} onChange={(e) => setDestinationPlaceBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>DESTINATION:</span>
                                    <input type="text" id="destinationEnInput" className="input-field" placeholder="Enter Destination" value={getValueForInput(destinationPlaceEn)} onChange={(e) => setDestinationPlaceEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>СРОК:</span>
                                    <div className="date-range-container">
                                        <input type="date" id="dateStartBgInput" className="input-field" value={getValueForInput(dateStartBg)} onChange={(e) => setDateStartBg(e.target.value)} />
                                        <span>-</span>
                                        <input type="date" id="dateEndBgInput" className="input-field" value={getValueForInput(dateEndBg)} onChange={(e) => setDateEndBg(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>DATES OF ITINERARY:</span>
                                    <div className="date-range-container">
                                        <input type="date" id="dateStartEnInput" className="input-field" value={getValueForInput(dateStartEn)} onChange={(e) => setDateStartEn(e.target.value)} />
                                        <span>-</span>
                                        <input type="date" id="dateEndEnInput" className="input-field" value={getValueForInput(dateEndEn)} onChange={(e) => setDateEndEn(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>НАСТАНЯВАНЕ В:</span>
                                    <input type="text" id="accommodationBgInput" className="input-field" placeholder="Въведете място на настаняване" value={getValueForInput(accommodationBg)} onChange={(e) => setAccommodationBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>ACCOMMODATION AT:</span>
                                    <input type="text" id="accommodationEnInput" className="input-field" placeholder="Enter Accommodation" value={getValueForInput(accommodationEn)} onChange={(e) => setAccommodationEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>КАТЕГОРИЯ И БРОЙ СТАИ:</span>
                                    <input type="text" id="roomCategoryBgInput" className="input-field" placeholder="Въведете категория и брой стаи" value={getValueForInput(roomCategoryBg)} onChange={(e) => setRoomCategoryBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>CATEGORY AND NUMBER OF ROOMS:</span>
                                    <input type="text" id="roomCategoryEnInput" className="input-field" placeholder="Enter Category and Number of Rooms" value={getValueForInput(roomCategoryEn)} onChange={(e) => setRoomCategoryEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        {/* Check-in/out, Excursions, Other Services, Notes, Date, Payment Doc */}
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ДАТА И ЧАС НА ПРИСТИГАНЕ:</span>
                                    <div className="date-time-container">
                                        <input type="datetime-local" id="checkInBgInput" className="input-field" value={getValueForInput(checkInBg)} onChange={(e) => setCheckInBg(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>CHECK IN:</span>
                                    <div className="date-time-container">
                                        <input type="datetime-local" id="checkInEnInput" className="input-field" value={getValueForInput(checkInEn)} onChange={(e) => setCheckInEn(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ДАТА И ЧАС НА ЗАМИНАВАНЕ:</span>
                                    <div className="date-time-container">
                                        <input type="datetime-local" id="checkOutBgInput" className="input-field" value={getValueForInput(checkOutBg)} onChange={(e) => setCheckOutBg(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>CHECK OUT:</span>
                                    <div className="date-time-container">
                                        <input type="datetime-local" id="checkOutEnInput" className="input-field" value={getValueForInput(checkOutEn)} onChange={(e) => setCheckOutEn(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ЕКСКУРЗИОННА ПРОГРАМА:</span>
                                    <textarea id="excursionsBgInput" className="textarea-field" rows="3" placeholder="Въведете екскурзионна програма" value={getValueForInput(excursionsBg)} onChange={(e) => setExcursionsBg(e.target.value)}></textarea>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>EXCURSIONS:</span>
                                    <textarea id="excursionsEnInput" className="textarea-field" rows="3" placeholder="Enter excursions" value={getValueForInput(excursionsEn)} onChange={(e) => setExcursionsEn(e.target.value)}></textarea>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ДРУГИ УСЛУГИ:</span>
                                    <textarea id="otherServicesBgInput" className="textarea-field" rows="3" placeholder="Въведете други услуги" value={getValueForInput(otherServicesBg)} onChange={(e) => setOtherServicesBg(e.target.value)}></textarea>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>OTHER SERVICES:</span>
                                    <textarea id="otherServicesEnInput" className="textarea-field" rows="3" placeholder="Enter other services" value={getValueForInput(otherServicesEn)} onChange={(e) => setOtherServicesEn(e.target.value)}></textarea>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ЗАБЕЛЕЖКИ:</span>
                                    <textarea id="notesBgInput" className="textarea-field" rows="3" placeholder="Въведете забележки" value={getValueForInput(notesBg)} onChange={(e) => setNotesBg(e.target.value)}></textarea>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>NOTES:</span>
                                    <textarea id="notesEnInput" className="textarea-field" rows="3" placeholder="Enter notes" value={getValueForInput(notesEn)} onChange={(e) => setNotesEn(e.target.value)}></textarea>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>ДАТА:</span>
                                    <input type="date" id="dateIssuedBgInput" className="input-field" value={getValueForInput(dateIssuedBg)} onChange={(e) => setDateIssuedBg(e.target.value)} />
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>DATE:</span>
                                    <input type="date" id="dateIssuedEnInput" className="input-field" value={getValueForInput(dateIssuedEn)} onChange={(e) => setDateIssuedEn(e.target.value)} />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="flex-container">
                                    <span>НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ:</span>
                                    <div className="payment-doc-container">
                                        <input type="text" id="paymentDocNumBgInput" className="input-field" placeholder="Номер на документ" value={getValueForInput(paymentDocNumBg)} onChange={(e) => setPaymentDocNumBg(e.target.value)} />
                                        <input type="date" id="paymentDocDateBgInput" className="input-field" value={getValueForInput(paymentDocDateBg)} onChange={(e) => setPaymentDocDateBg(e.target.value)} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex-container">
                                    <span>PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT:</span>
                                    <div className="payment-doc-container">
                                        <input type="text" id="paymentDocNumEnInput" className="input-field" placeholder="Document Number" value={getValueForInput(paymentDocNumEn)} onChange={(e) => setPaymentDocNumEn(e.target.value)} />
                                        <input type="date" id="paymentDocDateEnInput" className="input-field" value={getValueForInput(paymentDocDateEn)} onChange={(e) => setPaymentDocDateEn(e.target.value)} />
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

            {/* The hidden print-only content, which mirrors the form fields for printing */}
            {/* THIS IS THE SECTION THAT GETS POPULATED AND PRINTED */}
            <div className="print-only" ref={printContentRef}>
                <div className="voucher-container">
                    {/* Logo Section (for print) */}
                    <div className="logo-section">
                        <img src={Logo} alt="Company Logo" className="h-24 object-contain rounded-lg"></img>
                    </div>

                    {/* Static Information Table (Print Content) */}
                    <table className="info-table">
                        <thead>
                            <tr>
                                <th colSpan="2" className="header-row">
                                    РЕПУБЛИКА БЪЛГАРИЯ / REPUBLIC OF BULGARIA
                                </th>
                            </tr>
                            <tr>
                                <th colSpan="2" className="header-row">
                                    ВАУЧЕР / VOUCHER: <span id="pdf-voucherNumber">{getValueForInput(voucherNumber)}</span>
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
                            {/* Original / Copy Text */}
                            <tr>
                                <td colSpan="2" className="header-row">
                                    <span id="pdf-voucherTypeText">{voucherType === 'original' ? 'ОРИГИНАЛ / ORIGINAL' : 'КОПИЕ / COPY'}</span>
                                </td>
                            </tr>
                            {/* Destination */}
                            <tr>
                                <td>
                                    ЗА ПРЕДСТАВЯНЕ В: <span id="pdf-destinationBulgarian">{getValueForInput(destinationBulgarian)}</span>
                                </td>
                                <td>
                                    TO: <span id="pdf-destinationEnglish">{getValueForInput(destinationEnglish)}</span>
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
                                    <div id="pdf-tourist-names-container" className="space-y-1">
                                        {tourists.map((tourist, index) => (
                                            <div key={index}>
                                                {getValueForInput(tourist.bgName)} / {getValueForInput(tourist.enName)}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                            {/* Adults and Children Counts */}
                            <tr>
                                <td>
                                    ВЪЗРАСТНИ: <span id="pdf-adultsCountBg">{getValueForInput(adultsCountBg)}</span>
                                </td>
                                <td>
                                    ADULTS: <span id="pdf-adultsCountEn">{getValueForInput(adultsCountEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ДЕЦА (РЕДОВНО ЛЕГЛО): <span id="pdf-childrenRegularBedCountBg">{getValueForInput(childrenRegularBedCountBg)}</span>
                                </td>
                                <td>
                                    CHILDREN (REGULAR BED): <span id="pdf-childrenRegularBedCountEn">{getValueForInput(childrenRegularBedCountEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ДЕЦА (ДОПЪЛНИТЕЛНО ЛЕГЛО): <span id="pdf-childrenExtraBedCountBg">{getValueForInput(childrenExtraBedCountBg)}</span>
                                </td>
                                <td>
                                    CHILDREN (EXTRA BED): <span id="pdf-childrenExtraBedCountEn">{getValueForInput(childrenExtraBedCountEn)}</span>
                                </td>
                            </tr>
                            {/* Itinerary, Destination, Dates, Accommodation, Room Category */}
                            <tr>
                                <td>
                                    МАРШРУТ: <span id="pdf-itineraryBg">{getValueForInput(itineraryBg)}</span>
                                </td>
                                <td>
                                    ITINERARY: <span id="pdf-itineraryEn">{getValueForInput(itineraryEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    МЯСТО: <span id="pdf-destinationPlaceBg">{getValueForInput(destinationPlaceBg)}</span>
                                </td>
                                <td>
                                    DESTINATION: <span id="pdf-destinationPlaceEn">{getValueForInput(destinationPlaceEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    СРОК: <span id="pdf-dateStartBg">{formatDateForPrint(dateStartBg)}</span> - <span id="pdf-dateEndBg">{formatDateForPrint(dateEndBg)}</span>
                                </td>
                                <td>
                                    DATES OF ITINERARY: <span id="pdf-dateStartEn">{formatDateForPrint(dateStartEn)}</span> - <span id="pdf-dateEndEn">{formatDateForPrint(dateEndEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    НАСТАНЯВАНЕ В: <span id="pdf-accommodationBg">{getValueForInput(accommodationBg)}</span>
                                </td>
                                <td>
                                    ACCOMMODATION AT: <span id="pdf-accommodationEn">{getValueForInput(accommodationEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    КАТЕГОРИЯ И БРОЙ СТАИ: <span id="pdf-roomCategoryBg">{getValueForInput(roomCategoryBg)}</span>
                                </td>
                                <td>
                                    CATEGORY AND NUMBER OF ROOMS: <span id="pdf-roomCategoryEn">{getValueForInput(roomCategoryEn)}</span>
                                </td>
                            </tr>
                            {/* Check-in/out, Excursions, Other Services, Notes, Date, Payment Doc */}
                            <tr>
                                <td>
                                    ДАТА И ЧАС НА ПРИСТИГАНЕ: <span id="pdf-checkInBg">{formatDateTimeForPrint(checkInBg)}</span>
                                </td>
                                <td>
                                    CHECK IN: <span id="pdf-checkInEn">{formatDateTimeForPrint(checkInEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ДАТА И ЧАС НА ЗАМИНАВАНЕ: <span id="pdf-checkOutBg">{formatDateTimeForPrint(checkOutBg)}</span>
                                </td>
                                <td>
                                    CHECK OUT: <span id="pdf-checkOutEn">{formatDateTimeForPrint(checkOutEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ЕКСКУРЗИОННА ПРОГРАМА: <span id="pdf-excursionsBg">{getValueForInput(excursionsBg)}</span>
                                </td>
                                <td>
                                    EXCURSIONS: <span id="pdf-excursionsEn">{getValueForInput(excursionsEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ДРУГИ УСЛУГИ: <span id="pdf-otherServicesBg">{getValueForInput(otherServicesBg)}</span>
                                </td>
                                <td>
                                    OTHER SERVICES: <span id="pdf-otherServicesEn">{getValueForInput(otherServicesEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ЗАБЕЛЕЖКИ: <span id="pdf-notesBg">{getValueForInput(notesBg)}</span>
                                </td>
                                <td>
                                    NOTES: <span id="pdf-notesEn">{getValueForInput(notesEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    ДАТА: <span id="pdf-dateIssuedBg">{formatDateForPrint(dateIssuedBg)}</span>
                                </td>
                                <td>
                                    DATE: <span id="pdf-dateIssuedEn">{formatDateForPrint(dateIssuedEn)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    НОМЕР И ДАТА НА ДОКУМЕНТА ЗА ПЛАЩАНЕ: <span id="pdf-paymentDocNumBg">{getValueForInput(paymentDocNumBg)}</span> / <span id="pdf-paymentDocDateBg">{formatDateForPrint(paymentDocDateBg)}</span>
                                </td>
                                <td>
                                    PAYMENT DOCUMENT NUMBER AND DATE OF PAYMENT: <span id="pdf-paymentDocNumEn">{getValueForInput(paymentDocNumEn)}</span> / <span id="pdf-paymentDocDateEn">{formatDateForPrint(paymentDocDateEn)}</span>
                                </td>
                            </tr>
                            {/* Signature Lines (for print) */}
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
            </div> {/* END OF print-only WRAPPER DIV */}

            {/* Print Button - This button is part of the interactive UI, hidden during print */}
            <button id="printVoucherBtn" className="print-button add-button mt-8 mb-8" onClick={handlePrintButtonClick}>
                Print Voucher
            </button>
        </div> // This is the final closing div for print-preview-container
    );
};

export default VoucherPrint;
