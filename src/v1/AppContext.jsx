import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'bg');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // При промяна на темата, добавяме или махаме клас на целия сайт
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(language === 'bg' ? 'en' : 'bg');

  // Кратки преводи за интерфейса (ще ги допълваме)
  const t = {
    dashboard: language === 'bg' ? 'Табло' : 'Dashboard',
    reservations: language === 'bg' ? 'Резервации' : 'Reservations',
    hotels: language === 'bg' ? 'Хотели' : 'Hotels',
    bus: language === 'bg' ? 'Автобуси' : 'Bus Tours',
    invoices: language === 'bg' ? 'Фактури' : 'Invoices',
    marketing: language === 'bg' ? 'Маркетинг' : 'Marketing',
    tasks: language === 'bg' ? 'Задачи' : 'Tasks',
    logout: language === 'bg' ? 'Изход' : 'Logout',
    loginTitle: language === 'bg' ? 'Вход в Системата' : 'System Login',
    email: language === 'bg' ? 'Имейл' : 'Email',
    password: language === 'bg' ? 'Парола' : 'Password',
    loginBtn: language === 'bg' ? 'Влез' : 'Login'
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
