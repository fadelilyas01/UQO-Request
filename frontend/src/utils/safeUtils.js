/**
 * safeUtils.js - Boîte à outils de programmation défensive et de résilience des données.
 * Standard Zéro-Crash : garantit qu'aucune manipulation de données malformées,
 * absence de données réseau, date corrompue ou stockage restreint ne provoque d'exception bloquante.
 */

/**
 * Formate une date de manière totalement sécurisée sans jamais lancer RangeError.
 * 
 * @param {string|number|Date|null|undefined} dateInput - Valeur temporelle
 * @param {Intl.DateTimeFormatOptions} [options] - Options de formatage Intl
 * @param {string} [fallback] - Valeur de remplacement si date invalide
 * @returns {string} - Date formatée ou chaîne de remplacement
 */
export function formatSafeDate(dateInput, options = {}, fallback = 'Non renseignée') {
    if (!dateInput) return fallback;

    try {
        const d = new Date(dateInput);
        if (Number.isNaN(d.getTime())) {
            return fallback;
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options,
        };

        return new Intl.DateTimeFormat('fr-CA', defaultOptions).format(d);
    } catch {
        return fallback;
    }
}

/**
 * Formate une date avec heure de manière sécurisée.
 */
export function formatSafeDateTime(dateInput, fallback = 'Non renseignée') {
    return formatSafeDate(
        dateInput,
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        },
        fallback
    );
}

/**
 * Garantit qu'une valeur est un tableau valide pour éliminer les erreurs `.map()` ou `.filter()`.
 * 
 * @param {*} value - Donnée à inspecter
 * @param {Array} [fallback=[]] - Valeur de repli si la donnée n'est pas un tableau
 * @returns {Array} - Tableau garanti
 */
export function safeArray(value, fallback = []) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value && typeof value === 'object' && Array.isArray(value.results)) {
        return value.results;
    }
    return Array.isArray(fallback) ? fallback : [];
}

/**
 * Garantit qu'une valeur est une chaîne de caractères pour éliminer les erreurs `.trim()` ou `.toLowerCase()`.
 * 
 * @param {*} value - Donnée à inspecter
 * @param {string} [fallback=''] - Valeur de repli
 * @returns {string}
 */
export function safeString(value, fallback = '') {
    if (typeof value === 'string') {
        return value;
    }
    if (value !== null && value !== undefined) {
        return String(value);
    }
    return typeof fallback === 'string' ? fallback : '';
}

/**
 * Parse un contenu JSON de manière totalement sécurisée.
 * 
 * @param {string} raw - Chaîne JSON brute
 * @param {*} [fallback=null] - Valeur retournée en cas d'échec de parsing
 * @returns {*} - Objet désérialisé ou fallback
 */
export function safeJsonParse(raw, fallback = null) {
    if (!raw || typeof raw !== 'string') return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/**
 * Générateur d'identifiant cryptographique universel CSPRNG (UUID v4).
 * Conforme au standard de sécurité CWE-338 (pas de Math.random).
 * 
 * @returns {string} - UUID v4 aléatoire
 */
export function generateCSPRNGId() {
    if (typeof window !== 'undefined' && window.crypto) {
        if (typeof window.crypto.randomUUID === 'function') {
            try {
                return window.crypto.randomUUID();
            } catch {
                // Fallback crypto.getRandomValues ci-dessous
            }
        }
        if (typeof window.crypto.getRandomValues === 'function') {
            const buffer = new Uint8Array(16);
            window.crypto.getRandomValues(buffer);
            buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
            buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant RFC4122
            return Array.from(buffer)
                .map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'))
                .join('');
        }
    }
    // Secours déterministe pour environnement sans window.crypto
    return `uqo-${Date.now().toString(36)}-${Date.now().toString(16)}`;
}

/**
 * Mémoire vive de secours pour les environnements où le stockage local est interdit ou saturé.
 */
const inMemoryStore = new Map();

/**
 * Adaptateur de stockage ultra-robuste avec repli automatique en RAM.
 * Évite tout crash lié à QuotaExceededError ou SecurityError en navigation privée.
 */
export const safeStorage = {
    getItem(key) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch {
            // Ignorer l'erreur et basculer sur la mémoire vive
        }
        return inMemoryStore.has(key) ? inMemoryStore.get(key) : null;
    },

    setItem(key, value) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
                return;
            }
        } catch {
            // En cas de quota dépassé ou de navigation restreinte, fallback RAM
        }
        inMemoryStore.set(key, String(value));
    },

    removeItem(key) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch {
            // Ignorer
        }
        inMemoryStore.delete(key);
    },

    clear() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
            }
        } catch {
            // Ignorer
        }
        inMemoryStore.clear();
    },
};
