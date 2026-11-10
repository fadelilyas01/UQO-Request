/**
 * NotificationBell.jsx - Centre de notifications in-app pour la barre de navigation.
 * Affiche la cloche avec badge de comptage non-lu, fil déroulant et actions directes.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBell,
    FiCheckCircle,
    FiMessageSquare,
    FiInfo,
    FiCheck,
    FiExternalLink
} from 'react-icons/fi';
import { api } from '../api/client';
import { safeArray, formatSafeDateTime } from '../utils/safeUtils';
import { cn } from '../utils/cn';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchUnreadCount = async () => {
        try {
            const res = await api.getUnreadNotificationsCount();
            setUnreadCount(res.data?.unread_count || 0);
        } catch {
            // Fail-safe
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.getNotifications();
            const data = res.data?.results ?? res.data;
            setNotifications(safeArray(data));
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // Polling sobre toutes les 45 secondes pour le compteur non-lu
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 45000);
        return () => clearInterval(interval);
    }, []);

    // Charger la liste détaillée quand l'usager ouvre le panneau
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Fermeture lors d'un clic extérieur
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (notification) => {
        if (!notification.is_read) {
            try {
                await api.markNotificationAsRead(notification.id);
                setUnreadCount((prev) => Math.max(0, prev - 1));
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                );
            } catch {
                // Fail-safe
            }
        }

        if (notification.request) {
            setIsOpen(false);
            navigate(`/requests/${notification.request}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch {
            // Fail-safe
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'STATUS_CHANGE':
                return <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
            case 'COMMENT':
                return <FiMessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
            default:
                return <FiInfo className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bouton Cloche */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                aria-label="Centre de notifications"
                aria-expanded={isOpen}
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Menu Déroulant des Notifications */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden"
                    >
                        {/* En-tête */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full">
                                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                                >
                                    <FiCheck className="w-3.5 h-3.5" />
                                    <span>Tout marquer lu</span>
                                </button>
                            )}
                        </div>

                        {/* Liste */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    Chargement des notifications...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    Aucune notification pour le moment.
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleMarkAsRead(n)}
                                        className={cn(
                                            'p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left',
                                            !n.is_read && 'bg-emerald-50/30 dark:bg-emerald-950/20'
                                        )}
                                    >
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                                            {getIcon(n.notification_type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className={cn(
                                                    'text-xs font-semibold truncate',
                                                    n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                                                )}>
                                                    {n.title}
                                                </p>
                                                {!n.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                                {formatSafeDateTime(n.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
