require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

// Simple root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Route to fetch account by Riot ID
app.get('/account/:name/:tag', async (req, res) => {
  try {
    const { name, tag } = req.params;

    // Fetch account details using the Riot ID
    const accountResponse = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${process.env.RIOT_API_KEY}`
    );

    // Send response back to client
    res.json(accountResponse.data);
  } catch (error) {
    console.error('Error fetching account data:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to fetch account data',
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Fetch account data by PUUID using the correct endpoint
app.get('/summoner/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;

    if (!puuid) {
      return res.status(400).json({ error: 'PUUID is required' });
    }

    // Fetch summoner details using the PUUID (corrected endpoint)
    const accountResponse = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${process.env.RIOT_API_KEY}`
    );

    // Send response back to client
    res.json(accountResponse.data);
  } catch (error) {
    console.error('Error fetching account data by PUUID:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to fetch account data by PUUID',
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Fetch match history based on PUUID
app.get('/match-history/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params;
    const matchHistoryResponse = await axios.get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${process.env.RIOT_API_KEY}`
    );
    res.json(matchHistoryResponse.data);
  } catch (error) {
    console.error('Error fetching match history:', error.message);
    res.status(500).json({
      error: 'Failed to fetch match history',
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Fetch match details based on match ID
app.get('/match-details/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const matchDetailsResponse = await axios.get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`
    );
    res.json(matchDetailsResponse.data);
  } catch (error) {
    console.error('Error fetching match details:', error.message);
    res.status(500).json({
      error: 'Failed to fetch match details',
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});