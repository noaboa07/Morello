import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MatchHistory from './MatchHistory';
import axios from 'axios';
import './ProfilePage.css'; // Import the CSS file
import { useLanguage } from './LanguageContext';
import translations from '../utility/translations';

const ProfilePage = () => {
  const { puuid, name, tag } = useParams(); // Get the PUUID, name, and tag from the URL parameters
  const [summonerData, setSummonerData] = useState(null);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null); // State to store last refresh time
  const { language } = useLanguage(); // Get the current language

  const fetchProfileData = useCallback(async () => {
    try {
      // Fetch summoner data using PUUID
      const response = await axios.get(`/summoner/${puuid}`);
      setSummonerData(response.data);
      setError(''); // Clear error if successful
    } catch (err) {
      console.error('Error fetching summoner data:', err);
      setError(translations[language].fetchError); // Use translation for error message
    }
  }, [puuid, language]);

  useEffect(() => {
    fetchProfileData(); // Fetch data on initial load
  }, [fetchProfileData]);

  const refreshProfile = () => {
    fetchProfileData(); // Refresh the summoner data
    setLastRefreshed(new Date().toLocaleString()); // Update the last refreshed time
  };

  return (
    <div className="profile-container">
      <h2>{translations[language].profilePageTitle}</h2> {/* Updated to use new key */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {summonerData && (
        <div>
          <h3 className="profile-name">{name} <span className="profile-tag">({tag})</span></h3>
          <img 
            className="profile-icon"
            src={`https://ddragon.leagueoflegends.com/cdn/14.18.1/img/profileicon/${summonerData.profileIconId}.png`} 
            alt={`${name}'s Profile Icon`} 
          />
          <p className="profile-level">{translations[language].level}: {summonerData.summonerLevel}</p> {/* Updated */}
        </div>
      )}
      <button className="refresh-button" onClick={refreshProfile}>{translations[language].refreshProfile}</button> {/* Updated */}
      <p className="last-refreshed">
        {lastRefreshed ? `${translations[language].lastRefreshed}: ${lastRefreshed}` : translations[language].notRefreshed} {/* Updated */}
      </p>
      <MatchHistory puuid={puuid} />
    </div>
  );
};

export default ProfilePage;