/**
 * CommandPalette.jsx - Palette de commandes universelle (⌘K / Ctrl+K).
 * Navigation rapide, recherche floue et actions système instantanées au clavier.
 * Conforme aux standards Apple HIG / Material 3 et accessibilité WCAG AA.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch,
    FiPlus,
    FiGrid,
    FiSun,
    FiMoon,
    FiLogOut,
    FiFileText,
    FiX,
    FiArrowRight,
    FiCommand,
    FiShield
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { safeArray } from '../utils/safeUtils';
import { cn } from '../utils/cn';

export default function CommandPalette({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { isAuthenticated, isManager, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();

    // Récupérer les requêtes récentes à l'ouverture si connecté
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            setQuery('');
            setSelectedIndex(0);
            api.getRequests()
                .then((res) => {
                    const data = res.data?.results ?? res.data;
                    setRequests(safeArray(data).slice(0, 8));
                })
                .catch(() => {
                    setRequests([]);
                });
        }
    }, [isOpen, isAuthenticated]);

    // Focus automatique sur le champ de recherche
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Actions système prédéfinies
    const systemActions = useMemo(() => {
        const actions = [];

        if (isAuthenticated) {
            if (!isManager) {
                actions.push({
                    id: 'new-request',
                    title: 'Déposer une nouvelle requête',
                    subtitle: 'Créer un dossier académique ou administratif',
                    icon: FiPlus,
                    category: 'Actions',
                    onSelect: () => navigate('/requests/new'),
                });
            }

            actions.push({
                id: 'dashboard',
                title: isManager ? 'Tableau de bord de gestion' : 'Mes demandes en cours',
                subtitle: 'Consulter l\'ensemble des dossiers',
                icon: FiGrid,
                category: 'Navigation',
                onSelect: () => navigate(isManager ? '/manager' : '/dashboard'),
            });
        }

        actions.push({
            id: 'toggle-theme',
            title: isDark ? 'Activer le mode clair' : 'Activer le mode sombre',
            subtitle: 'Changer l\'apparence visuelle de l\'interface',
            icon: isDark ? FiSun : FiMoon,
            category: 'Préférences',
            onSelect: () => toggleTheme(),
        });

        if (isAuthenticated) {
            actions.push({
                id: 'logout',
                title: 'Déconnexion sécurisée',
                subtitle: 'Fermer la session sur cet appareil',
                icon: FiLogOut,
                category: 'Compte',
                onSelect: async () => {
                    await logout();
                    navigate('/login');
                },
            });
        }

        return actions;
    }, [isAuthenticated, isManager, isDark, navigate, toggleTheme, logout]);

    // Filtrage combiné : Actions système + Requêtes
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();

        const matchedActions = systemActions.filter(
            (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
        );

        const matchedRequests = requests
            .filter((r) => !q || r.title?.toLowerCase().includes(q) || String(r.id).includes(q))
            .map((r) => ({
                id: `req-${r.id}`,
                title: r.title,
                subtitle: `Dossier #${r.id} • Statut : ${r.status}`,
                icon: FiFileText,
                category: 'Dossiers récents',
                onSelect: () => navigate(`/requests/${r.id}`),
            }));

        return [...matchedActions, ...matchedRequests];
    }, [query, systemActions, requests, navigate]);

    // Gestion de la navigation au clavier
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                if (item) {
                    item.onSelect();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Palette de commandes"
                >
                    {/* Barre de Recherche */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                        <FiSearch className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            placeholder="Rechercher une action, un dossier, un mot-clé..."
                            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                                Échap
                            </kbd>
                            <button
                                onClick={onClose}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                                aria-label="Fermer la palette"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Liste des Résultats */}
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {filteredItems.length === 0 ? (
                            <div className="py-10 text-center text-xs text-slate-400">
                                Aucun résultat trouvé pour « {query} »
                            </div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const isSelected = index === selectedIndex;
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            item.onSelect();
                                            onClose();
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer',
                                            isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                'p-2 rounded-lg shrink-0',
                                                isSelected
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-semibold truncate">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                                                {item.category}
                                            </span>
                                            {isSelected && (
                                                <FiArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Pied de Palette */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">↑↓</kbd>
                                Naviguer
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">↵</kbd>
                                Sélectionner
                            </span>
                        </div>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                            <FiCommand className="w-3 h-3" />
                            UQO QuickSearch
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
