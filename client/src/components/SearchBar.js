import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const response = await axios.get(`/account/${summonerName}/${summonerTag}`); // Updated endpoint
      const puuid = response.data.puuid;
      // Navigate to the profile page with puuid, summoner name, and tag
      navigate(`/profile/${puuid}/${summonerName}/${summonerTag}`);
    } catch (error) {
      console.error('Error fetching summoner data:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Summoner Name"
        value={summonerName}
        onChange={(e) => setSummonerName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tag (e.g. #1234)"
        value={summonerTag}
        onChange={(e) => setSummonerTag(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;