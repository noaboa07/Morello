import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import ProfilePage from './components/ProfilePage';
import SlideMenu from './components/SlideMenu';
import { LanguageProvider } from './components/LanguageContext';
import LanguageSelector from './components/LanguageSelector';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app">
          <SlideMenu />
          <LanguageSelector /> {/* Language selector dropdown */}
          <div className="content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile/:puuid/:name/:tag" element={<ProfilePage />} />
              {/* Add other routes here */}
            </Routes>
          </div>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;