/**
 * Contexte de gestion de theme (sombre / clair) pour UQO-Requests.
 * Persiste la preference de maniere securisee via safeStorage (Zéro-Crash en navigation privee)
 * et applique les classes au documentElement.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeUtils';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'uqo_theme';

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = safeStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'dark' || saved === 'light')) return saved;

        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    });

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.style.colorScheme = theme;
        safeStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const contextValue = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé au sein d\'un ThemeProvider');
    }
    return context;
}

export default ThemeContext;
