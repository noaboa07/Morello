import React from 'react';
import SearchBar from './SearchBar';
import './Home.css'; // Import the CSS file for styles

const Home = () => {
  return (
    <div className="home-container">
      <h1>Search for a Summoner</h1>
      <p className="description">
        Discover and analyze your favorite League of Legends summoners! 
        Enter a summoner's name and tag to view their profile data, match history, and more. 
        Start your search below!
      </p>
      <SearchBar />
    </div>
  );
};

export default Home;