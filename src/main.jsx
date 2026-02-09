import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/lib/offlineMutations';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Failed to find the root element");
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .catch((error) => console.error('Service Worker registration failed:', error));
    });
}

ReactDOM.createRoot(rootElement).render(
  <>
    <AuthProvider>
      <ViewModeProvider>
        <App />
      </ViewModeProvider>
    </AuthProvider>
  </>
);
