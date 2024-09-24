import React, { useEffect, useState } from 'react';
import axios from 'axios';
import championImageMap from '../utility/championImageMap'; // Adjust the path as needed
import './MatchHistory.css';
import { useLanguage } from './LanguageContext'; // Import language context
import translations from '../utility/translations'; // Import translations

const MatchHistory = ({ puuid }) => {
  const [matches, setMatches] = useState([]);
  const { language } = useLanguage(); // Get the current language

  useEffect(() => {
    const fetchMatchIds = async () => {
      try {
        const response = await axios.get(`/match-history/${puuid}`);
        fetchMatchDetails(response.data); // Fetch match details with the retrieved IDs
      } catch (error) {
        console.error('Error fetching match IDs:', error);
      }
    };

    const fetchMatchDetails = async (ids) => {
      const matchDetailsPromises = ids.map(id => axios.get(`/match-details/${id}`));
      try {
        const matchDetailsResponses = await Promise.all(matchDetailsPromises);
        setMatches(matchDetailsResponses.map(res => res.data));
      } catch (error) {
        console.error('Error fetching match details:', error);
      }
    };

    fetchMatchIds();
  }, [puuid]);

  return (
    <div>
      <h2>{translations[language].matchHistory}</h2> {/* Translated match history title */}
      <ul>
        {matches.map(match => {
          const participant = match.info.participants.find(p => p.puuid === puuid);
          return (
            <li key={match.metadata.matchId}>
              {participant && (
                <>
                  <img 
                    src={championImageMap[participant.championName]} // Use championName to get the image
                    alt="Champion Icon" 
                    className="champion-icon" 
                  />
                  <div className="match-info">
                    <h3>{translations[language].matchId}: {match.metadata.matchId}</h3> {/* Translated match ID */}
                    <p>{translations[language].duration}: {match.info.gameDuration} seconds</p> {/* Translated duration */}
                    <p>{translations[language].winner}: {match.info.teams[0].win ? translations[language].team1 : translations[language].team2}</p> {/* Translated winner */}
                    <p>{translations[language].champion}: {participant.championName}</p> {/* Translated champion */}
                    <p>{translations[language].kda}: {participant.kills}/{participant.deaths}/{participant.assists}</p> {/* Translated KDA */}
                    <p>{translations[language].gameType}: {match.info.queueId === 420 ? translations[language].ranked : translations[language].normal}</p> {/* Translated game type */}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MatchHistory;