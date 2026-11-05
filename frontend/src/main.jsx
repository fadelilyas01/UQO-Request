/*
 * main.jsx - Le point d'entrée de notre app React
 * 
 * C'est le premier fichier qui s'execute quand on lance l'app.
 * Il crée la racine React et monte notre composant App.
 * 
 * On utilise StrictMode pour nous aider à trouver les bugs
 * pendant le developpement (ça fait rien en prod).
 */

// React pour le StrictMode
import React from 'react'

// ReactDOM pour afficher notre app dans le HTML
import ReactDOM from 'react-dom/client'

// Notre composant principal
import App from './App'

// Les styles globaux de l'app
import './index.css'

/*
 * On crée la racine React et on lance l'app
 * 
 * getElementById('root') => c'est la div dans index.html
 * StrictMode => ca active des verifications supplementaires
 */
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
