import React, { useState } from 'react';
import MatchHistory from './components/MatchHistory';
import axios from 'axios';

const App = () => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [puuid, setPuuid] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!name || !tag) {
      setError('Please enter both name and tag.');
      return;
    }

    try {
      const response = await axios.get(`/account/${name}/${tag}`);
      setPuuid(response.data.puuid);
      setError('');
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError('Failed to fetch account data. Please check the name and tag.');
    }
  };

  return (
    <div>
      <h1>League of Legends Match History</h1>
      <div>
        <input 
          type="text" 
          placeholder="Enter Summoner Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Enter Tag (e.g. #1234)" 
          value={tag} 
          onChange={(e) => setTag(e.target.value)} 
        />
        <button onClick={handleSearch}>Search</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      {puuid && <MatchHistory puuid={puuid} />}
    </div>
  );
};

export default App;
