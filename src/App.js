import React from 'react';
import './App.css';
import IntegrationSelector from './components/IntegrationSelector';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>VectorShift Integrations</h1>
        <p>Connect your favorite tools and import your data seamlessly</p>
      </header>
      
      <main className="App-main">
        <IntegrationSelector />
      </main>
    </div>
  );
}

export default App;
// Force reload - updated 