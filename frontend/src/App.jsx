/**
 * Point d'entree applicatif et routage principal pour UQO-Requests.
 * Configure le theme, l'authentification, les notifications Toast,
 * la surveillance de connectivite hors-ligne et les barrieres d'erreurs (ErrorBoundary).
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';

// Chargement differe des vues pour optimiser le bundle initial
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateRequest = lazy(() => import('./pages/CreateRequest'));
const EditRequest = lazy(() => import('./pages/EditRequest'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

import './index.css';

function RouteLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
            <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-uqo-600/20 border-t-uqo-600 rounded-full animate-spin" />
                <img alt="Chargement en cours" src="/logos/uqo-symbol-blue.svg" className="absolute h-5 w-auto object-contain opacity-80 dark:hidden" />
                <img alt="Chargement en cours" src="/logos/uqo-symbol-white.svg" className="absolute h-5 w-auto object-contain opacity-80 hidden dark:inline" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                Chargement sécurisé en cours...
            </p>
        </div>
    );
}

function NotFoundView() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto"
        >
            <span className="text-6xl font-black text-uqo-600 dark:text-uqo-accent-400 mb-2 font-mono">
                404
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Page introuvable
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                L'adresse demandée n'existe pas ou a été déplacée vers un nouvel emplacement sécurisé.
            </p>
            <Link 
                to="/" 
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-uqo-600 hover:bg-uqo-700 active:bg-uqo-800 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500"
            >
                Retour à l'accueil
            </Link>
        </motion.div>
    );
}

function AppRoutes() {
    const { isAuthenticated, isManager, loading } = useAuth();
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setShowLoader(false), 300);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (showLoader && loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-opacity">
                <div className="flex flex-col items-center gap-3">
                    <img alt="Logo officiel UQO" src="/logos/uqo-symbol-blue.svg" className="h-10 w-auto object-contain animate-pulse dark:hidden" />
                    <img alt="Logo officiel UQO" src="/logos/uqo-symbol-white.svg" className="h-10 w-auto object-contain animate-pulse hidden dark:inline" />
                    <div className="w-8 h-8 border-3 border-uqo-600/20 border-t-uqo-600 rounded-full animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">
                        UQO-Requests
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<RouteLoader />}>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <ErrorBoundary level="page">
                            {isAuthenticated
                                ? <Navigate to={isManager ? '/manager' : '/dashboard'} replace />
                                : <Login />}
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <ErrorBoundary level="page">
                            {isAuthenticated
                                ? <Navigate to={isManager ? '/manager' : '/dashboard'} replace />
                                : <Register />}
                        </ErrorBoundary>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requireUser>
                            <ErrorBoundary level="page">
                                <Dashboard />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/requests/new"
                    element={
                        <ProtectedRoute requireUser>
                            <ErrorBoundary level="page">
                                <CreateRequest />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/requests/:id/edit"
                    element={
                        <ProtectedRoute requireUser>
                            <ErrorBoundary level="page">
                                <EditRequest />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/requests/:id"
                    element={
                        <ProtectedRoute>
                            <ErrorBoundary level="page">
                                <RequestDetail />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute requireManager>
                            <ErrorBoundary level="page">
                                <ManagerDashboard />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <ErrorBoundary level="page">
                            <Home />
                        </ErrorBoundary>
                    }
                />
                <Route path="*" element={<NotFoundView />} />
            </Routes>
        </Suspense>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
                            <OfflineBanner />
                            <Navbar />
                            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                                <AppRoutes />
                            </main>
                            <Footer />
                        </div>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
