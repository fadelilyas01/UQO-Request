/**
 * Barre de navigation principale de l'application UQO-Requests.
 * Affiche les liens adaptes au role (visiteur, etudiant, gestionnaire)
 * et gere le basculement de theme et la deconnexion.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, isManager, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    if (!isAuthenticated) {
        return (
            <nav className="navbar navbar-guest">
                <div className="navbar-container">
                    <Link to="/" className="navbar-brand">
                        <span className="brand-icon">📋</span>
                        <span className="brand-text">UQO-Requests</span>
                    </Link>

                    <div className="navbar-actions">
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle"
                            aria-label="Changer de thème"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <Link to="/login" className="nav-link">Connexion</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="navbar navbar-auth">
            <div className="navbar-container">
                <div className="navbar-header">
                    <Link to={isManager ? '/manager' : '/dashboard'} className="navbar-brand">
                        <span className="brand-icon">📋</span>
                        <span className="brand-text">UQO-Requests</span>
                    </Link>

                    <button
                        className={`mobile-menu-toggle ${isMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <div className="navbar-menu desktop-menu">
                    {isManager ? (
                        <Link to="/manager" className={`nav-item ${isActive('/manager') ? 'active' : ''}`}>
                            <span>👔</span> Tableau de bord
                        </Link>
                    ) : (
                        <>
                            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                                <span>📊</span> Mes demandes
                            </Link>
                            <Link to="/requests/new" className={`nav-item ${isActive('/requests/new') ? 'active' : ''}`}>
                                <span>➕</span> Nouvelle demande
                            </Link>
                        </>
                    )}
                </div>

                <div className="navbar-actions desktop-actions">
                    <button onClick={toggleTheme} className="theme-toggle" aria-label="Changer de thème">
                        {isDark ? '☀️' : '🌙'}
                    </button>
                    <div className="user-info">
                        <span className="user-name">{user?.first_name} {user?.last_name}</span>
                        <span className="user-role">{isManager ? 'Gestionnaire' : 'Utilisateur'}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
                </div>

                <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
                    <div className="mobile-menu-content">
                        {isManager ? (
                            <Link to="/manager" className={`mobile-nav-item ${isActive('/manager') ? 'active' : ''}`}>
                                <span>👔</span> Tableau de bord
                            </Link>
                        ) : (
                            <>
                                <Link to="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                                    <span>📊</span> Mes demandes
                                </Link>
                                <Link to="/requests/new" className={`mobile-nav-item ${isActive('/requests/new') ? 'active' : ''}`}>
                                    <span>➕</span> Nouvelle demande
                                </Link>
                            </>
                        )}

                        <div className="mobile-divider"></div>

                        <div className="mobile-user-actions">
                            <div className="user-info-mobile">
                                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                                <span className="user-role">{isManager ? 'Gestionnaire' : 'Utilisateur'}</span>
                            </div>
                            <div className="mobile-buttons">
                                <button onClick={toggleTheme} className="theme-toggle-mobile">
                                    {isDark ? 'Thème Clair ☀️' : 'Thème Sombre 🌙'}
                                </button>
                                <button onClick={handleLogout} className="btn-logout-mobile">Déconnexion</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
