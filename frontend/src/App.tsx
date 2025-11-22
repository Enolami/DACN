import React from 'react';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to the Application</h1>
      </header>
      <main className="app-main">
        <p>This is the main application component.</p>
      </main>
    </div>
  );
};

export default App;

