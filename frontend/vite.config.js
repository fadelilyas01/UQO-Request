/**
 * Configuration de Vite pour le projet frontend.
 * 
 * Vite est un outil de build moderne et rapide pour les applications JavaScript.
 * Ce fichier configure les plugins, le serveur de développement et les proxies.
 * 
 * @author UQO
 * @version 1.0.0
 */

// Importation de la fonction de configuration de Vite
import { defineConfig } from 'vite'

// Importation du plugin React pour Vite
// Ce plugin permet le support de JSX et le Fast Refresh
import react from '@vitejs/plugin-react'

/**
 * Configuration exportée pour Vite.
 * 
 * Options configurées:
 * - plugins: Liste des plugins Vite à utiliser
 * - server: Configuration du serveur de développement
 */
export default defineConfig({
    // Plugins utilisés par Vite
    plugins: [
        react()  // Plugin React - Active le support JSX et le Hot Module Replacement
    ],

    // Configuration du serveur de développement
    server: {
        // Port sur lequel le serveur de développement écoute
        // Par défaut: 5173 (port standard de Vite)
        port: 5173,

        // Configuration du proxy pour les requêtes API
        // Cela permet d'éviter les problèmes de CORS en développement
        proxy: {
            // Toutes les requêtes commençant par /api seront redirigées vers le backend Django
            '/api': {
                // URL du serveur backend Django
                // En Docker, c'est 'http://backend:8000'
                // En Local, c'est 'http://localhost:8000'
                target: process.env.PROXY_TARGET || 'http://localhost:8000',
                // Modifie l'en-tête Origin pour correspondre au serveur cible
                // Nécessaire pour les requêtes cross-origin
                changeOrigin: true,
            },
        },
    },
})
