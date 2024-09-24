import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SlideMenu.css'; // Import the CSS file for styling
import { useLanguage } from './LanguageContext'; // Import language context
import translations from '../utility/translations'; // Import translations

const SlideMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`slide-menu ${isOpen ? 'open' : ''}`} onMouseEnter={toggleMenu} onMouseLeave={toggleMenu}>
      <div className="menu-content">
        <button onClick={() => navigate('/')}>{translations[language].home}</button>
        <button onClick={() => navigate('/profile')}>{translations[language].slideMenuProfile}</button> {/* Updated */}
        <button onClick={() => navigate('/about')}>{translations[language].about}</button>
      </div>
    </div>
  );
};

export default SlideMenu;