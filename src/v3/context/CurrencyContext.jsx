import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    // Фиксиран курс за превалутиране (официален за България)
    const EUR_TO_BGN = 1.95583;
    
    // Глобална настройка за визуализация (в каква валута потребителят вижда Dashboard-а)
    const [displayCurrency, setDisplayCurrency] = useState('BGN');

    // Функция за форматиране (напр. 100.00 лв. или €51.13)
    const formatCurrency = (amount, originalCurrency = 'BGN') => {
        let value = Number(amount) || 0;

        // Ако искаме да виждаме всичко в EUR, а сумата е в BGN -> конвертираме
        if (displayCurrency === 'EUR' && originalCurrency === 'BGN') {
            value = value / EUR_TO_BGN;
        } 
        // Ако искаме да виждаме всичко в BGN, а сумата е в EUR -> конвертираме
        else if (displayCurrency === 'BGN' && originalCurrency === 'EUR') {
            value = value * EUR_TO_BGN;
        }

        return new Intl.NumberFormat('bg-BG', {
            style: 'currency',
            currency: displayCurrency,
        }).format(value);
    };

    // Помощна функция само за чиста конверсия
    const convert = (amount, from, to) => {
        if (from === to) return amount;
        return from === 'BGN' ? amount / EUR_TO_BGN : amount * EUR_TO_BGN;
    };

    return (
        <CurrencyContext.Provider value={{ 
            displayCurrency, 
            setDisplayCurrency, 
            formatCurrency, 
            convert,
            EUR_TO_BGN 
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
