/**
 * main.jsx - Point d'entrée principal de l'application React UQO-Requests.
 * Monte la racine React dans le StrictMode avec Barrière d'Erreur Globale (ErrorBoundary)
 * et gestionnaires de neutralisation des rejets non interceptés (Zéro-Crash standard).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Neutralisation globale des rejets de Promesses non interceptés (Fail-Secure)
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Système Zéro-Crash] Rejet de Promesse intercepté globalement:', {
            reason: event.reason?.message || event.reason,
            timestamp: new Date().toISOString(),
        });
        // Empêche le plantage brutal de l'environnement d'exécution
        event.preventDefault();
    });

    window.addEventListener('error', (event) => {
        console.error('[Système Zéro-Crash] Exception globale interceptée:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            timestamp: new Date().toISOString(),
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary title="UQO-Requests - Sécurité applicative">
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
