// src/VoucherPrint.jsx
import React, { useCallback } from 'react';
import './VoucherPrint.css';
import Logo from './Logo.png'; // Make sure Logo.png is accessible

const VoucherPrint = ({ reservationData, onPrintFinish }) => {

    // Helper functions for formatting (re-used from your original code)
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

    if (!reservationData) {
        // This component should ideally only be rendered when reservationData is available.
        // If it's rendered without data, something is wrong in App.jsx.
        return null; 
    }

    // Prepare data for printing based on reservationData
    const voucherPrintData = useMemo(() => {
        const leadTourist = reservationData.tourists?.[0] || {};
        const accompanyingTourists = reservationData.tourists ? reservationData.tourists.slice(1) : [];

        return {
            voucherNumber: getValue(reservationData.reservationNumber, 'ВАУЧЕР НОМЕР'),
            voucherType: 'ОРИГИНАЛ / ORIGINAL', // Defaulting to original for print
            destinationBulgarian: getValue(reservationData.hotel, 'ДЕСТИНАЦИЯ'),
            destinationEnglish: getValue(reservationData.hotel, 'DESTINATION'),
            
            tourists: [
                { bgName: getValue(`${leadTourist.firstName || ''} ${leadTourist.fatherName || ''} ${leadTourist.familyName || ''}`.trim(), 'Неизвестен'), enName: getValue(`${leadTourist.firstName || ''} ${leadTourist.fatherName || ''} ${leadTourist.familyName || ''}`.trim(), 'Unknown') },
                ...accompanyingTourists.map(t => ({ 
                    bgName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Неизвестен'), 
                    enName: getValue(`${t.firstName || ''} ${t.fatherName || ''} ${t.familyName || ''}`.trim(), 'Unknown') 
                }))
            ],
            adultsCountBg: getValue(reservationData.adults, 0),
            adultsCountEn: getValue(reservationData.adults, 0),
            childrenRegularBedCountBg: getValue(reservationData.children, 0),
            childrenRegularBedCountEn: getValue(reservationData.children, 0),
            childrenExtraBedCountBg: 0, // No direct mapping, default to 0
            childrenExtraBedCountEn: 0, // No direct mapping, default to 0

            itineraryBg: getValue(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim()),
            itineraryEn: getValue(`${reservationData.place || ''}, ${reservationData.hotel || ''}`.trim()),
            destinationPlaceBg: getValue(reservationData.place, ''),
            destinationPlaceEn: getValue(reservationData.place, ''),

            dateStartBg: formatDateForPrint(reservationData.checkIn),
            dateEndBg: formatDateForPrint(reservationData.checkOut),
            dateStartEn: formatDateForPrint(reservationData.checkIn),
            dateEndEn: formatDateForPrint(reservationData.checkOut),

            accommodationBg: getValue(reservationData.hotel, 'НАСТАНЯВАНЕ'),
            accommodationEn: getValue(reservationData.hotel, 'ACCOMMODATION'),
            roomCategoryBg: getValue(reservationData.roomType, 'СТАЯ'),
            roomCategoryEn: getValue(reservationData.roomType, 'ROOM'),

            checkInBg: formatDateTimeForPrint(reservationData.checkIn),
            checkInEn: formatDateTimeForPrint(reservationData.checkIn),
            checkOutBg: formatDateTimeForPrint(reservationData.checkOut),
            checkOutEn: formatDateTimeForPrint(reservationData.checkOut),

            excursionsBg: 'НЯМА ВКЛЮЧЕНИ ЕКСКУРЗИИ', 
            excursionsEn: 'NO INCLUDED EXCURSIONS', 
            otherServicesBg: 'Водач-представител на фирмата по време на цялото пътуване;', 
            otherServicesEn: 'Company representative/guide throughout the trip;', 
            notesBg: 'Без забележки', 
            notesEn: 'No notes', 

            dateIssuedBg: formatDateForPrint(new Date().toISOString().split('T')[0]),
            dateIssuedEn: formatDateForPrint(new Date().toISOString().split('T')[0]),
            paymentDocNumBg: 'N/A', // Assuming no direct mapping from reservation
            paymentDocDateBg: 'N/A', // Assuming no direct mapping from reservation
            paymentDocNumEn: 'N/A', // Assuming no direct mapping from reservation
            paymentDocDateEn: 'N/A', // Assuming no direct mapping from reservation
        };
    }, [reservationData, formatDateForPrint, formatDateTimeForPrint, getValue]);

    return (
        // This is the ONLY content that will be rendered for printing.
        // It should NOT contain any UI elements you don't want on the physical paper.
        // The App.jsx will decide when to render this component.
        <div className="voucher-container print-content-styling"> {/* Renamed from pdf-page for clarity */}
            <div className="logo-section">
                <img src={Logo} alt="Company Logo" style={{height: '60px', width: 'auto'}}></img> {/* Smaller logo for print */}
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
                            {/* Fill up to 7 lines with blank if less than 7 tourists, adjust as needed */}
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
    );
};

export default VoucherPrint;
