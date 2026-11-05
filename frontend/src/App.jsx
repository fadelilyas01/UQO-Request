/**
 * Point d'entree applicatif et routage principal pour UQO-Requests.
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Chargement differe des vues pour optimiser le temps de chargement initial
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
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="loading-ring" style={{ width: '50px', height: '50px' }} />
        </div>
    );
}

function AppRoutes() {
    const { isAuthenticated, isManager, loading } = useAuth();
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setShowLoader(false), 400);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    return (
        <>
            {showLoader && (
                <div className={`loading-container ${!loading ? 'fade-out' : ''}`}>
                    <div className="loader-content">
                        <div className="brand-logo">📋</div>
                        <div className="loading-ring"></div>
                        <div className="loading-pulse">UQO-Requests</div>
                    </div>
                </div>
            )}

            {!loading && (
                <Suspense fallback={<RouteLoader />}>
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                isAuthenticated
                                    ? <Navigate to={isManager ? '/manager' : '/dashboard'} replace />
                                    : <Login />
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                isAuthenticated
                                    ? <Navigate to={isManager ? '/manager' : '/dashboard'} replace />
                                    : <Register />
                            }
                        />

                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute requireUser>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/requests/new"
                            element={
                                <ProtectedRoute requireUser>
                                    <CreateRequest />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/requests/:id/edit"
                            element={
                                <ProtectedRoute requireUser>
                                    <EditRequest />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/requests/:id"
                            element={
                                <ProtectedRoute>
                                    <RequestDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/manager"
                            element={
                                <ProtectedRoute requireManager>
                                    <ManagerDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/" element={<Home />} />

                        <Route
                            path="*"
                            element={
                                <div className="not-found animate-in">
                                    <h1>404</h1>
                                    <p>Page non trouvée</p>
                                    <a href="/" className="btn btn-primary">Retour à l'accueil</a>
                                </div>
                            }
                        />
                    </Routes>
                </Suspense>
            )}
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <div className="app">
                        <Navbar />
                        <main className="main-content">
                            <AppRoutes />
                        </main>
                    </div>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
