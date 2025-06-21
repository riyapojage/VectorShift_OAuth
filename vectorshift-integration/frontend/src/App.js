import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import IntegrationSelector from './components/IntegrationSelector';
import HubspotCallback from './components/HubspotCallback';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main application route */}
          <Route path="/" element={<MainApp />} />
          
          {/* HubSpot OAuth callback route */}
          <Route path="/hubspot/callback" element={<HubspotCallback />} />
        </Routes>
      </div>
    </Router>
  );
}

/**
 * Main application component with header and integration selector
 */
function MainApp() {
  return (
    <>
      <header className="App-header" style={{ backgroundColor: '#282c34', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>VectorShift Integrations</h1>
        <p style={{ fontSize: '1.2rem', margin: '0' }}>Connect your favorite tools and import your data seamlessly</p>
      </header>
      
      <main className="App-main" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <IntegrationSelector />
      </main>
    </>
  );
}

export default App;
