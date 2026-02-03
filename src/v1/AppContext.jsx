import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'bg');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'bg' ? 'en' : 'bg');

  const translations = {
    bg: {
      dashboard: 'Табло',
      reservations: 'Резервации',
      hotels: 'Хотели',
      bus: 'Автобуси',
      invoices: 'Фактури',
      marketing: 'Маркетинг',
      tasks: 'Задачи',
      logout: 'Изход',
      loginTitle: 'Вход в Системата',
      email: 'Имейл',
      password: 'Парола',
      loginBtn: 'Влез',
      loading: 'Зареждане...',
      welcome: 'Добре дошли в модул',
      themeLight: 'Светла',
      themeDark: 'Тъмна'
    },
    en: {
      dashboard: 'Dashboard',
      reservations: 'Reservations',
      hotels: 'Hotels',
      bus: 'Bus Tours',
      invoices: 'Invoices',
      marketing: 'Marketing',
      tasks: 'Tasks',
      logout: 'Logout',
      loginTitle: 'System Login',
      email: 'Email',
      password: 'Password',
      loginBtn: 'Login',
      loading: 'Loading...',
      welcome: 'Welcome to module',
      themeLight: 'Light',
      themeDark: 'Dark'
    }
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
