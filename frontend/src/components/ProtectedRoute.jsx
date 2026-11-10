/**
 * Composant de protection et de controle d'acces des routes de l'application.
 * Verifie l'etat d'authentification et applique les regles RBAC strictes
 * cote frontend en conformite avec le backend.
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
                <div className="w-10 h-10 border-3 border-uqo-600/20 border-t-uqo-600 rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Validation des autorisations de sécurité...
                </p>
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
