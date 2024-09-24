import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css'; // Import the CSS file for styles
import { useLanguage } from './LanguageContext';
import translations from '../utility/translations';

const SearchBar = () => {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const navigate = useNavigate();
  const { language } = useLanguage(); // Get the current language

  const handleSearch = async () => {
    // Normalize inputs to lowercase for case-insensitive search
    const normalizedSummonerName = summonerName.toLowerCase();
    const normalizedSummonerTag = summonerTag.toLowerCase();

    try {
      const response = await axios.get(`/account/${normalizedSummonerName}/${normalizedSummonerTag}`); // Updated endpoint
      const puuid = response.data.puuid;
      // Navigate to the profile page with puuid, summoner name, and tag
      navigate(`/profile/${puuid}/${normalizedSummonerName}/${normalizedSummonerTag}`);
    } catch (error) {
      console.error('Error fetching summoner data:', error);
    }
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        className="search-input"
        placeholder={translations[language].searchForSummoner} // Translated placeholder
        value={summonerName}
        onChange={(e) => setSummonerName(e.target.value)}
      />
      <input
        type="text"
        className="search-input"
        placeholder={translations[language].tag} // Translated placeholder
        value={summonerTag}
        onChange={(e) => setSummonerTag(e.target.value)}
      />
      <button className="search-button" onClick={handleSearch}>
        {translations[language].search} {/* Translated button text */}
      </button>
    </div>
  );
};

export default SearchBar;