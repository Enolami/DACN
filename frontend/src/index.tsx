import React from 'react';
import ReactDOM from 'react-dom/client';
import { LoginPage } from './components/LoginPage';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <LoginPage 
      onLogin={() => console.log('Login clicked')}
      onSkipToSubscription={() => console.log('Skip to subscription clicked')}
    />

    
  </React.StrictMode>
);

