// Процент на превалутиране, използван в InvoicePrint
export const EUR_TO_BGN_RATE = 1.95583;

// Универсална функция за думи (пренесена от InvoicePrint.jsx)
export function amountToWordsBulgarian(num) {
    if (num === 0) return "Нула лева";
    const units = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
    const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
    const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
    const hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];

    function convertLessThanOneThousand(n) {
        let s = '';
        if (n >= 100) { s += hundreds[Math.floor(n / 100)] + ' '; n %= 100; }
        if (n >= 10 && n < 20) { s += teens[n - 10] + ' '; return s.trim(); }
        else if (n >= 20) { s += tens[Math.floor(n / 10)] + ' '; n %= 10; }
        if (n > 0) { s += units[n] + ' '; }
        return s.trim();
    }

    let integerPart = Math.floor(num);
    let fractionalPart = Math.round((num - integerPart) * 100);
    let result = '';

    if (integerPart >= 1000) {
        let thousands = Math.floor(integerPart / 1000);
        if (thousands === 1) result += 'хиляда ';
        else if (thousands === 2) result += 'две хиляди ';
        else result += convertLessThanOneThousand(thousands) + ' хиляди ';
        integerPart %= 1000;
    }
    if (integerPart > 0) result += convertLessThanOneThousand(integerPart);
    if (result === '') result = 'нула';
    
    result = result.trim() + ' лева';
    result += fractionalPart > 0 ? ` и ${String(fractionalPart).padStart(2, '0')} стотинки` : ' и нула стотинки';
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Функции за форматиране на дати (пренесени от VoucherPrint.jsx)
export const formatDateForPrint = (dateString) => {
    if (!dateString) return '..................';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
};
