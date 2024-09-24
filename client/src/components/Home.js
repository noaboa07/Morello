import React from 'react';
import SearchBar from './SearchBar';
import './Home.css'; // Import the CSS file for styles
import { useLanguage } from './LanguageContext';
import translations from '../utility/translations';

const Home = () => {
  const { language } = useLanguage();

  return (
    <div className="home-container">
      <h1>{translations[language].searchForSummoner}</h1>
      <p className="description">
        {translations[language].description}
      </p>
      <SearchBar />
    </div>
  );
};

export default Home;