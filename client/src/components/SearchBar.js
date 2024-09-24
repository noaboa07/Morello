import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css'; // Import the CSS file for styles

const SearchBar = () => {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const navigate = useNavigate();

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
        placeholder="Summoner Name"
        value={summonerName}
        onChange={(e) => setSummonerName(e.target.value)}
      />
      <input
        type="text"
        className="search-input"
        placeholder="Tag (e.g. #1234)"
        value={summonerTag}
        onChange={(e) => setSummonerTag(e.target.value)}
      />
      <button className="search-button" onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;