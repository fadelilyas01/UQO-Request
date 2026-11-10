/**
 * Barre de navigation principale professionnelle pour UQO-Requests.
 * Integre le design system Tailwind CSS, des animations Framer Motion
 * et la totalite des icones vectorielles React Icons (zero emoji).
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiSun, 
    FiMoon, 
    FiLogOut, 
    FiPlusCircle, 
    FiInbox, 
    FiUser, 
    FiShield, 
    FiMenu, 
    FiX,
    FiCheckCircle,
    FiChevronRight,
    FiSearch
} from 'react-icons/fi';
import { HiOutlineSquares2X2 } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import CommandPalette from './CommandPalette';
import { cn } from '../utils/cn';

export default function Navbar() {
    const { user, isAuthenticated, isManager, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('[Navbar] Erreur lors de la déconnexion:', err);
            navigate('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo & Marque UQO */}
                    <div className="flex items-center gap-6">
                        <Link 
                            to={isAuthenticated ? (isManager ? '/manager' : '/dashboard') : '/'}
                            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
                        >
                            <img alt="Symbole officiel UQO" src="/logos/uqo-symbol.svg" className="h-8 w-8 object-contain" />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                                        UQO
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                                        REQUESTS
                                    </span>
                                </div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium hidden sm:inline">
                                    Université du Québec en Outaouais
                                </span>
                            </div>
                        </Link>

                        {/* Navigation Desktop (Utilisateurs authentifiés) */}
                        {isAuthenticated && (
                            <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Navigation principale">
                                {isManager ? (
                                    <Link
                                        to="/manager"
                                        className={cn(
                                            'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                                            isActive('/manager')
                                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                        )}
                                    >
                                        <HiOutlineSquares2X2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Tableau de bord</span>
                                        {isActive('/manager') && (
                                            <motion.div
                                                layoutId="navbar-indicator"
                                                className="absolute inset-0 border-b-2 border-emerald-600 dark:border-emerald-400 rounded-lg pointer-events-none"
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            className={cn(
                                                'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                                                isActive('/dashboard')
                                                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <FiInbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Mes requêtes</span>
                                            {isActive('/dashboard') && (
                                                <motion.div
                                                    layoutId="navbar-indicator"
                                                    className="absolute inset-0 border-b-2 border-emerald-600 dark:border-emerald-400 rounded-lg pointer-events-none"
                                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                />
                                            )}
                                        </Link>

                                        <Link
                                            to="/requests/new"
                                            className={cn(
                                                'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                                                isActive('/requests/new')
                                                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <FiPlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Nouvelle requête</span>
                                            {isActive('/requests/new') && (
                                                <motion.div
                                                    layoutId="navbar-indicator"
                                                    className="absolute inset-0 border-b-2 border-emerald-600 dark:border-emerald-400 rounded-lg pointer-events-none"
                                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                />
                                            )}
                                        </Link>
                                    </>
                                )}
                            </nav>
                        )}
                    </div>

                    {/* Actions a Droite (Theme, Profil, Auth) */}
                    <div className="flex items-center gap-2.5">
                        {/* Bouton Palette de Commandes (⌘K) */}
                        <button
                            type="button"
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Ouvrir la palette de commandes (Ctrl+K)"
                            aria-label="Recherche rapide"
                        >
                            <FiSearch className="w-3.5 h-3.5" />
                            <span className="hidden md:inline font-medium">Recherche</span>
                            <kbd className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Centre de Notifications In-App */}
                        {isAuthenticated && <NotificationBell />}

                        {/* Bouton Bascule Theme */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors cursor-pointer"
                            aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                        >
                            {isDark ? (
                                <FiSun className="w-5 h-5 text-amber-400" />
                            ) : (
                                <FiMoon className="w-5 h-5 text-slate-600" />
                            )}
                        </button>

                        {/* Zone Utilisateur Authentifie */}
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2.5 text-left">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/20">
                                        {user?.first_name ? user.first_name[0].toUpperCase() : <FiUser />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                                            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            {isManager ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    <FiShield className="w-3 h-3" />
                                                    Gestionnaire
                                                </span>
                                            ) : (
                                                <span>Étudiant</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors ml-1 disabled:opacity-50"
                                    title="Déconnexion sécurisée"
                                    aria-label="Déconnexion sécurisée"
                                >
                                    {isLoggingOut ? (
                                        <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FiLogOut className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    Inscription
                                </Link>
                            </div>
                        )}

                        {/* Bouton Menu Mobile Hamburger */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            aria-expanded={isMenuOpen}
                            aria-label="Ouvrir le menu de navigation"
                        >
                            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu Déroulant Mobile avec Framer Motion */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-3"
                    >
                        {isAuthenticated ? (
                            <>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                                            {user?.first_name ? user.first_name[0].toUpperCase() : <FiUser />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {isManager ? 'Gestionnaire académique' : 'Étudiant UQO'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                        <FiCheckCircle className="w-3.5 h-3.5" />
                                        Session active
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {isManager ? (
                                        <Link
                                            to="/manager"
                                            className={cn(
                                                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium',
                                                isActive('/manager')
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <HiOutlineSquares2X2 className="w-5 h-5 text-emerald-600" />
                                                <span>Tableau de bord</span>
                                            </div>
                                            <FiChevronRight className="w-4 h-4 text-slate-400" />
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                to="/dashboard"
                                                className={cn(
                                                    'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium',
                                                    isActive('/dashboard')
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <FiInbox className="w-5 h-5 text-emerald-600" />
                                                    <span>Mes requêtes</span>
                                                </div>
                                                <FiChevronRight className="w-4 h-4 text-slate-400" />
                                            </Link>

                                            <Link
                                                to="/requests/new"
                                                className={cn(
                                                    'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium',
                                                    isActive('/requests/new')
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <FiPlusCircle className="w-5 h-5 text-emerald-600" />
                                                    <span>Nouvelle requête</span>
                                                </div>
                                                <FiChevronRight className="w-4 h-4 text-slate-400" />
                                            </Link>
                                        </>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                                <span>Déconnexion en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiLogOut className="w-4 h-4" />
                                                <span>Déconnexion sécurisée</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2 pt-1">
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
                                >
                                    Inscription
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Palette de Commandes Globale (⌘K) */}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
        </header>
    );
}
