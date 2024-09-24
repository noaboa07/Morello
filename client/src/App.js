import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import ProfilePage from './components/ProfilePage'; // Create a profile page component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:puuid/:name/:tag" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;