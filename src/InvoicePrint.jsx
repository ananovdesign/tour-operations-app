import React, { useEffect } from 'react';
import './InvoicePrint.css';
import Logo from './Logo.png'; // Assuming your logo is accessible from here

// --- Helper Constants and Functions ---
const EUR_TO_BGN_RATE = 1.95583;

function amountToWordsBulgarian(num) {
    if (num === 0) return "Нула лева";
    
    const units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
    const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
    const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
    const hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];

    function convertLessThanOneThousand(n) {
        let s = '';
        if (n >= 100) {
            s += hundreds[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 10 && n < 20) {
            s += teens[n - 10] + ' ';
            return s.trim();
        } else if (n >= 20) {
            s += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }
        if (n > 0) {
            s += units[n] + ' ';
        }
        return s.trim();
    }

    let integerPart = Math.floor(num);
    let fractionalPart = Math.round((num - integerPart) * 100);
    let result = '';

    if (integerPart >= 1000) {
        let thousands = Math.floor(integerPart / 1000);
        if (thousands === 1) {
            result += 'хиляда ';
        } else if (thousands === 2) {
            result += 'две хиляди ';
        } else {
            result += convertLessThanOneThousand(thousands) + ' хиляди ';
        }
        integerPart %= 1000;
    }

    if (integerPart > 0) {
        result += convertLessThanOneThousand(integerPart);
    }
    
    if (result === '') {
        result = 'нула';
    }

    result = result.trim();
    result += ' лева';

    if (fractionalPart > 0) {
        result += ' и ' + String(fractionalPart).padStart(2, '0') + ' стотинки';
    } else {
        result += ' и нула стотинки';
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
}

const InvoicePrint = ({ invoiceData, onPrintFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      // Ensure onPrintFinish is called after print dialog is closed/canceled
      window.onafterprint = onPrintFinish; 
    }, 500); // Using 500ms as it was previously working. Adjust if needed.

    // Cleanup function for useEffect
    return () => {
      clearTimeout(timer);
      window.onafterprint = null; // Clean up event listener
    };
  }, [onPrintFinish]); // Depend on onPrintFinish

  const totalBasePriceEUR = (invoiceData.totalAmount || 0) / EUR_TO_BGN_RATE;
  const totalVATAmountEUR = (invoiceData.totalVAT || 0) / EUR_TO_BGN_RATE;
  const totalDueAmountEUR = (invoiceData.grandTotal || 0) / EUR_TO_BGN_RATE;
  const amountInWordsBGN = amountToWordsBulgarian(invoiceData.grandTotal || 0);
  const invoiceType = invoiceData.isCopy ? 'Копие' : 'Оригинал';
  const displayedPaymentMethodText = invoiceData.paymentMethod === 'Bank' ? 'По банков път' : 'В брой';
  const fullClientAddress = [invoiceData.clientAddress, invoiceData.clientCity, invoiceData.clientPostCode].filter(Boolean).join(', ');

  return (
    // This outer div is for displaying the preview on screen.
    // The actual content meant for printing now goes inside the 'print-only' div.
    <div className="print-preview-container">
      <div className="print-only"> {/* ADDED THIS WRAPPER DIV */}
        <div className="invoice-output">
          <div className="header-info">
            <div className="logo-container"><img src={Logo} alt="Company Logo" /></div>
            <div className="invoice-title-section">
              <h1>Фактура</h1>
              <div className="subtitle">{invoiceType}</div>
            </div>
            <div className="invoice-number-date-section">
              <table>
                <tbody>
                  <tr><td className="label">Номер:</td><td>{invoiceData.invoiceNumber}</td></tr>
                  <tr><td className="label">Дата:</td><td>{invoiceData.invoiceDate}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="party-box" style={{ width: '48%' }}>
              <div className="title">Получател</div>
              <table>
                <tbody>
                  <tr><td className="label">Име на фирма:</td><td>{invoiceData.clientName}</td></tr>
                  <tr><td className="label">ДДС No:</td><td>{invoiceData.clientVATID}</td></tr>
                  <tr><td className="label">Идент. No:</td><td>{invoiceData.clientID}</td></tr>
                  <tr><td className="label">Адрес:</td><td>{fullClientAddress}</td></tr>
                  <tr><td className="label">МОЛ:</td><td>{invoiceData.clientMOL}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="party-box" style={{ width: '48%' }}>
              <div className="title">Доставчик</div>
              <table>
                <tbody>
                  <tr><td className="label">Име на фирма:</td><td>ДАЙНАМЕКС ТУР ЕООД</td></tr>
                  <tr><td className="label">ДДС No:</td><td>BG208193140</td></tr>
                  <tr><td className="label">ЕИК:</td><td>208193140</td></tr>
                  <tr><td className="label">Адрес:</td><td>гр. Ракитово, ул. Васил Куртев 12А</td></tr>
                  <tr><td className="label">МОЛ:</td><td>КРАСИМИР АНАНОВ</td></tr>
                  <tr><td className="label">Телефон:</td><td>+359879 97 64 46</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="details-table">
            <thead>
              <tr>
                <th>№</th><th>Код</th><th>Наименование</th><th>Мярка</th><th>Кол.</th><th>Цена (BGN/EUR)</th><th>Сума (BGN/EUR)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.products.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.productCode}</td>
                  <td>{item.productName}</td>
                  <td>бр.</td>
                  <td>{item.quantity.toFixed(2)}</td>
                  <td>{(item.price || 0).toFixed(2)} ({((item.price || 0) / EUR_TO_BGN_RATE).toFixed(2)} EUR)</td>
                  <td>{(item.lineTotal || 0).toFixed(2)} ({((item.lineTotal || 0) / EUR_TO_BGN_RATE).toFixed(2)} EUR)</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary-section">
            <div className="left-col">
              <p>Словом: {amountInWordsBGN}</p>
            </div>
            <div className="right-col">
              <table className="summary-table">
                <tbody>
                  <tr>
                    <td className="label">Данъчна основа:</td>
                    <td>{invoiceData.totalAmount.toFixed(2)} ({totalBasePriceEUR.toFixed(2)} EUR)</td>
                  </tr>
                  {invoiceData.totalVAT !== 0 && (
                    <tr>
                      <td className="label">ДДС {invoiceData.products[0]?.vatRate || 0}%:</td>
                      <td>{invoiceData.totalVAT.toFixed(2)} ({totalVATAmountEUR.toFixed(2)} EUR)</td>
                    </tr>
                  )}
                  <tr>
                    <td className="total-sum">Сума за плащане:</td>
                    <td className="total-sum">{invoiceData.grandTotal.toFixed(2)} ({totalDueAmountEUR.toFixed(2)} EUR)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="footer-section">
            <div style={{ width: '48%' }}>
              <table>
                <tbody>
                  <tr><td className="label">Дата на данъчно събитие:</td><td>{invoiceData.invoiceDate}</td></tr>
                  <tr><td className="label">Основание на сделката:</td><td>{invoiceData.transactionBasis}</td></tr>
                  <tr><td className="label">Описание на сделката:</td><td>{invoiceData.transactionDescription}</td></tr>
                  <tr><td className="label">Място на сделката:</td><td>{invoiceData.transactionPlace}</td></tr>
                  <tr><td className="label">Получил:</td><td><span className="signature-line">{invoiceData.receivedBy || '.........................'}</span></td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ width: '48%' }}>
              <table>
                <tbody>
                  <tr><td className="label">Плащане:</td><td>{displayedPaymentMethodText}</td></tr>
                  {invoiceData.paymentMethod === 'Bank' && (
                    <>
                      <tr><td className="label">IBAN:</td><td>{invoiceData.bankDetails.iban}</td></tr>
                      <tr><td className="label">Банка:</td><td>{invoiceData.bankDetails.bankName}</td></tr>
                    </>
                  )}
                  <tr><td className="label">Съставил:</td><td><span className="signature-line">КРАСИМИР АНАНОВ</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="note">
            <p>{invoiceData.notes || ''}</p>
            {invoiceData.totalVAT === 0 && (
              <p>Основание за неначисляване на ДДС:"Режим на облагането на маржа в тур. услуги" - По член 86. ал.1 от ЗДДС.</p>
            )}
            <p>Съгласно чл. 6, ал. 1 от Закона за счетоводството, чл. 114 от ЗДДС и чл. 78 от ППЗДДС печатът и подписът не са задължителни реквизити във фактурата.</p>
          </div>
        </div>
      </div> {/* END OF THE NEW WRAPPER DIV */}
    </div>
  );
};

export default InvoicePrint;
