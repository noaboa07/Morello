import React, { createContext, useState, useContext } from 'react';

// Create a Language Context
const LanguageContext = createContext();

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English

  const toggleLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => useContext(LanguageContext);