// Home.js
import React, { useState } from 'react';
import MatchHistory from './MatchHistory';

const Home = () => {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [puuid, setPuuid] = useState(null);

  const handleSearch = async () => {
    // Fetch the PUUID using the summoner name and tag
    try {
      const response = await axios.get(`/summoner/${summonerName}/${summonerTag}`);
      setPuuid(response.data.puuid); // Assuming the response has a puuid property
    } catch (error) {
      console.error('Error fetching summoner data:', error);
    }
  };

  return (
    <div>
      <h1>Search Match History</h1>
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

      {puuid && <MatchHistory puuid={puuid} />}
    </div>
  );
};

export default Home;