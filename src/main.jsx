import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow-lg)',
        },
        success: {
          iconTheme: { primary: 'var(--emerald-400)', secondary: 'var(--bg-base)' },
        },
        error: {
          iconTheme: { primary: '#f87171', secondary: 'var(--bg-base)' },
        },
      }}
    />
  </React.StrictMode>
);
