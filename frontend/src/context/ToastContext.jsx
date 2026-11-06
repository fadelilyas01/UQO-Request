/**
 * ToastContext.jsx - Contexte universel de notifications toast pour UQO-Requests.
 * Offre un retour accessible et discret pour toutes les actions sans bloquer l'interface.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';
import { generateCSPRNGId } from '../utils/safeUtils';

const ToastContext = createContext(null);

const ICONS = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
};

const STYLES = {
    success: 'bg-emerald-900/90 text-white border-emerald-700/50',
    error: 'bg-rose-900/90 text-white border-rose-700/50',
    warning: 'bg-amber-900/90 text-white border-amber-700/50',
    info: 'bg-slate-900/90 text-white border-slate-700/50',
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(({
        type = 'info',
        title,
        message,
        duration = 4500,
    }) => {
        const id = generateCSPRNGId();
        const newToast = { id, type, title, message };

        setToasts((prev) => [...prev.slice(-3), newToast]); // Garder au maximum 4 toasts

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}

            {/* Zone de Rendu des Toasts en bas à droite */}
            <div
                className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
                aria-live="polite"
                role="region"
                aria-label="Notifications système"
            >
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const Icon = ICONS[toast.type] || ICONS.info;
                        const style = STYLES[toast.type] || STYLES.info;

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md ${style}`}
                            >
                                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    {toast.title && (
                                        <h4 className="text-sm font-semibold leading-tight mb-1">
                                            {toast.title}
                                        </h4>
                                    )}
                                    <p className="text-xs opacity-90 leading-relaxed">
                                        {toast.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 opacity-70 hover:opacity-100 transition-opacity rounded-md -mr-1 -mt-1"
                                    aria-label="Fermer la notification"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            showToast: () => {},
            removeToast: () => {},
        };
    }
    return context;
}

export default ToastContext;
