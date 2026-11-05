/**
 * Composant de protection et de controle d'acces des routes de l'application.
 * Verifie l'etat d'authentification et les autorisations par role RBAC.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
    children,
    requireManager = false,
    requireUser = false,
}) {
    const { isAuthenticated, isManager, isUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Chargement des autorisations...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireManager && !isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    if (requireUser && !isUser) {
        return <Navigate to="/manager" replace />;
    }

    return children;
}
