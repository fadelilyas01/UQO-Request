/**
 * Module d'acces API base sur Axios pour UQO-Requests.
 * Gere les intercepteurs JWT, le rafraichissement automatique des tokens
 * et la gestion des sessions utilisateur.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const TOKEN_KEY = 'uqo_access_token';
const REFRESH_TOKEN_KEY = 'uqo_refresh_token';

/**
 * Fonctions de persistance securisee des jetons JWT.
 */
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (access, refresh) => {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Injection automatique de l'en-tete Authorization
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Gestion du rafraichissement de jeton lors d'une reponse 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = getRefreshToken();

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem(TOKEN_KEY, access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                clearTokens();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Catalogue centralise des methodes de l'API UQO-Requests.
 */
export const api = {
    // Authentification & Profil
    login: (email, password) => apiClient.post('/auth/token/', { email, password }),
    register: (data) => apiClient.post('/auth/register/', data),
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

    // Supervision Gestionnaire
    getManagerRequests: (params = {}) => apiClient.get('/manager/requests/', { params }),
};

export default apiClient;
