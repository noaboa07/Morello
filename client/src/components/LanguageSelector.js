import React from 'react';
import { useLanguage } from './LanguageContext';

const LanguageSelector = () => {
  const { language, toggleLanguage } = useLanguage();

  const handleChange = (e) => {
    toggleLanguage(e.target.value);
  };

  return (
    <select value={language} onChange={handleChange} style={{ position: 'absolute', top: '10px', right: '10px' }}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      {/* Add more languages as needed */}
    </select>
  );
};

export default LanguageSelector;