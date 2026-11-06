/**
 * Configuration de Vite pour le projet frontend.
 * 
 * Vite est un outil de build moderne et rapide pour les applications JavaScript.
 * Ce fichier configure les plugins, le serveur de développement et les proxies.
 * 
 * @author UQO
 * @version 1.0.0
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.PROXY_TARGET || 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
})

