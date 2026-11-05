/**
 * Contexte centralise d'authentification pour UQO-Requests.
 * Fournit l'etat de session, les roles RBAC et les methodes d'authentification.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { api, setTokens, clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Synchronisation de la session au montage
    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const token = getAccessToken();

            if (token) {
                try {
                    const response = await api.getProfile();
                    if (isMounted) {
                        setUser(response.data);
                    }
                } catch {
                    if (isMounted) {
                        clearTokens();
                        setUser(null);
                    }
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

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
            const message = err.response?.data?.detail || 'Adresse email ou mot de passe incorrect.';
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
            const message =
                err.response?.data?.email?.[0] ||
                err.response?.data?.password?.[0] ||
                err.response?.data?.detail ||
                "Une erreur est survenue lors de l'inscription.";
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        clearTokens();
        setUser(null);
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.updateProfile(data);
            setUser(response.data);
            return { success: true };
        } catch {
            return { success: false, error: 'Impossible de mettre a jour le profil.' };
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
