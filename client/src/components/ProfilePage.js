import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MatchHistory from './MatchHistory';
import axios from 'axios';
import './ProfilePage.css'; // Import the CSS file

const ProfilePage = () => {
  const { puuid, name, tag } = useParams(); // Get the PUUID, name, and tag from the URL parameters
  const [summonerData, setSummonerData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummonerData = async () => {
      try {
        const response = await axios.get(`/summoner/${puuid}`);
        setSummonerData(response.data);
      } catch (err) {
        console.error('Error fetching summoner data:', err);
        setError('Failed to fetch summoner data.');
      }
    };

    if (puuid) {
      fetchSummonerData();
    }
  }, [puuid]);

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {summonerData && (
        <div>
          <h3 className="profile-name">{name} <span className="profile-tag">({tag})</span></h3>
          <img 
            className="profile-icon"
            src={`https://ddragon.leagueoflegends.com/cdn/14.18.1/img/profileicon/${summonerData.profileIconId}.png`} 
            alt={`${name}'s Profile Icon`} 
          />
          <p className="profile-level">Level: {summonerData.summonerLevel}</p>
        </div>
      )}
      <MatchHistory puuid={puuid} />
    </div>
  );
};

export default ProfilePage;