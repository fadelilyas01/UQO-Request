/**
 * Contexte centralise d'authentification pour UQO-Requests.
 * Fournit l'etat de session, les roles RBAC, la synchronisation temps reel avec le backend
 * et la gestion fail-secure des expirations de session.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken, getSafeApiErrorMessage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction centralisee de synchronisation de profil avec le backend
    const syncProfile = useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await api.getProfile();
            setUser(response.data);
        } catch {
            // Fail-Secure : si le backend refuse le token ou s'il est invalide, purge immediate
            clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Synchronisation au montage et ecoute des expirations de session
    useEffect(() => {
        syncProfile();

        // Gestionnaire d'evenement d'expiration emise par l'intercepteur API
        const handleAuthExpired = () => {
            clearTokens();
            setUser(null);
            setError('Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.');
        };

        // Synchronisation automatique lorsque l'utilisateur revient sur l'onglet
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && getAccessToken()) {
                syncProfile();
            }
        };

        window.addEventListener('uqo:auth-expired', handleAuthExpired);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('uqo:auth-expired', handleAuthExpired);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [syncProfile]);

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await api.login(email, password);
            const { access, refresh } = response.data;
            setTokens(access, refresh);

            const profileResponse = await api.getProfile();
            setUser(profileResponse.data);
            return { success: true };
        } catch (err) {
            const message = getSafeApiErrorMessage(err, 'Adresse courriel ou mot de passe incorrect.');
            setError(message);
            return { success: false, error: message };
        }
    };

    const register = async (data) => {
        setError(null);
        try {
            await api.register(data);
            return { success: true };
        } catch (err) {
            const message = getSafeApiErrorMessage(err, "Une erreur est survenue lors de l'inscription.");
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        const refresh = getRefreshToken();
        if (refresh) {
            try {
                await api.logout(refresh);
            } catch {
                // En cas d'indisponibilite reseau, on garantit la purge locale
            }
        }
        clearTokens();
        setUser(null);
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.updateProfile(data);
            setUser(response.data);
            return { success: true };
        } catch (err) {
            const message = getSafeApiErrorMessage(err, 'Impossible de mettre à jour le profil.');
            return { success: false, error: message };
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isManager: user?.role === 'MANAGER',
        isUser: user?.role === 'USER',
        login,
        register,
        logout,
        updateProfile,
        setError,
        syncProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
    }
    return context;
}

export default AuthContext;
