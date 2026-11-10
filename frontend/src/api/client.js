/**
 * Module d'acces API base sur Axios pour UQO-Requests.
 * Integre :
 * 1. Gestion securisee des jetons JWT avec synchronisation atomique anti-concurrence
 * 2. Cles d'idempotence automatiques (Idempotency-Key) pour securiser les transactions (Rule 7.9)
 * 3. Retry exponentiel avec gigue (Jitter) sur erreurs transitoires reseau (Rule 7.8)
 * 4. Adaptateur de stockage securise resistant aux environnements prives (safeStorage)
 * 5. Parsing defensif d'erreur (getSafeApiErrorMessage) conforme au standard Senior UX Writing
 */

import axios from 'axios';
import { safeStorage, generateCSPRNGId } from '../utils/safeUtils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 8000, // Timeout strict de 8s (resilience industrielle)
    headers: {
        'Content-Type': 'application/json',
    },
});

const TOKEN_KEY = 'uqo_access_token';
const REFRESH_TOKEN_KEY = 'uqo_refresh_token';

/**
 * Fonctions de persistance securisee des jetons JWT avec repli en memoire vive.
 */
export const getAccessToken = () => safeStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => safeStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (access, refresh) => {
    if (access) safeStorage.setItem(TOKEN_KEY, access);
    if (refresh) safeStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Injection automatique de l'en-tete Authorization Bearer et cle d'idempotence
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Attribution d'une cle d'idempotence unique aux mutations HTTP si non specifiee
        const method = (config.method || '').toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            if (!config.headers['Idempotency-Key']) {
                config.headers['Idempotency-Key'] = generateCSPRNGId();
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// File d'attente (Mutex) pour les rafraichissements concurrents de jetons
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Intercepteur de reponse : Gestion securisee du rafraichissement 401 et retry avec gigue
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        // 1. Rafraichissement atomique du jeton JWT sur erreur 401
        const isAuthEndpoint = originalRequest.url?.includes('/auth/token/');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();

            if (!refreshToken) {
                isRefreshing = false;
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('uqo:auth-expired'));
                }
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refreshToken,
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 8000
                });

                const { access, refresh: newRefresh } = response.data;
                setTokens(access, newRefresh || refreshToken);

                apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
                originalRequest.headers.Authorization = `Bearer ${access}`;

                processQueue(null, access);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('uqo:auth-expired'));
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // 2. Retry exponentiel avec gigue sur pannes reseau ou 502/503/504 temporaires (Rule 7.8)
        const isNetworkOrServerError = !error.response || [502, 503, 504].includes(error.response?.status);
        const isIdempotent = ['get', 'head', 'options'].includes(originalRequest.method?.toLowerCase()) ||
            Boolean(originalRequest.headers?.['Idempotency-Key']);

        const maxRetries = 2;
        const currentRetry = originalRequest._retryCount || 0;

        if (isNetworkOrServerError && isIdempotent && currentRetry < maxRetries) {
            originalRequest._retryCount = currentRetry + 1;
            // Backoff exponentiel (500ms, 1000ms) + gigue aleatoire (0 a 150ms)
            const jitter = Math.floor(Math.random() * 150);
            const delay = (500 * Math.pow(2, currentRetry)) + jitter;

            await new Promise((resolve) => setTimeout(resolve, delay));
            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);

/**
 * Traduit et extrait de maniere defensive le message d'erreur sans divulgation de jargon (Rule 7.7).
 */
export const getSafeApiErrorMessage = (error, defaultMessage = "Une anomalie de communication est survenue. Veuillez réessayer.") => {
    if (!error) return defaultMessage;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return "Le délai de réponse du serveur a expiré. Veuillez vérifier votre connexion.";
    }

    if (!error.response) {
        return "Connexion réseau impossible. Veuillez vérifier votre accès à Internet.";
    }

    const { status, data } = error.response;

    if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') return data.detail;
        if (typeof data.error === 'string') return data.error;
        if (typeof data.message === 'string') return data.message;

        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey]) && typeof data[firstKey][0] === 'string') {
            return data[firstKey][0];
        }
    }

    if (status === 429) {
        return "Nombre maximal de requêtes atteint. Veuillez patienter une minute avant de réessayer.";
    }

    if (status === 403) {
        return "Accès non autorisé pour cette ressource avec votre profil actuel.";
    }

    if (status === 404) {
        return "Le dossier ou la ressource demandée n'existe pas ou a été déplacée.";
    }

    if (status >= 500) {
        return "Le service institutionnel rencontre une instabilité temporaire. Vos données sont préservées.";
    }

    return defaultMessage;
};

/**
 * Catalogue centralise des methodes de l'API REST securisee UQO-Requests.
 */
export const api = {
    // Authentification & Profil
    login: (email, password) => apiClient.post('/auth/token/', { email, password }),
    register: (data) => apiClient.post('/auth/register/', data),
    logout: (refresh) => apiClient.post('/auth/logout/', { refresh }),
    getProfile: () => apiClient.get('/auth/profile/'),
    updateProfile: (data) => apiClient.patch('/auth/profile/', data),
    changePassword: (data) => apiClient.post('/auth/change-password/', data),

    // Demandes
    getRequests: (params = {}) => apiClient.get('/requests/', { params }),
    getRequest: (id) => apiClient.get(`/requests/${id}/`),
    createRequest: (data) => apiClient.post('/requests/', data),
    updateRequest: (id, data) => apiClient.patch(`/requests/${id}/`, data),
    deleteRequest: (id) => apiClient.delete(`/requests/${id}/`),
    changeRequestStatus: (id, data) => apiClient.post(`/requests/${id}/change-status/`, data),

    // Commentaires
    getComments: (requestId) => apiClient.get(`/requests/${requestId}/comments/`),
    addComment: (requestId, content) => apiClient.post(`/requests/${requestId}/comments/`, { content }),

    // Attestation PDF scellée SHA-256 (Rule 1.3)
    downloadReceipt: (requestId) => apiClient.get(`/requests/${requestId}/download-receipt/`, { responseType: 'blob' }),

    // Pièces Jointes & Justificatifs
    getAttachments: (requestId) => apiClient.get(`/requests/${requestId}/attachments/`),
    uploadAttachment: (requestId, formData) => apiClient.post(`/requests/${requestId}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadAttachment: (requestId, attachmentId) => apiClient.get(`/requests/${requestId}/attachments/${attachmentId}/download/`, {
        responseType: 'blob'
    }),

    // Centre de Notifications In-App
    getNotifications: () => apiClient.get('/notifications/'),
    getUnreadNotificationsCount: () => apiClient.get('/notifications/unread-count/'),
    markNotificationAsRead: (id) => apiClient.post(`/notifications/${id}/mark-as-read/`),
    markAllNotificationsAsRead: () => apiClient.post('/notifications/mark-all-read/'),

    // Supervision Gestionnaire
    getManagerRequests: (params = {}) => apiClient.get('/manager/requests/', { params }),
};

export default apiClient;
