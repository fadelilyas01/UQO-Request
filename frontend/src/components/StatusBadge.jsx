/**
 * Composant Badge de statut professionnel pour afficher l'etat d'une demande.
 * Stylise avec Tailwind CSS et des icones vectorielles React Icons (sans emoji).
 */

import { motion } from 'framer-motion';
import { 
    FiClock, 
    FiRefreshCw, 
    FiCheckCircle, 
    FiXCircle, 
    FiHelpCircle 
} from 'react-icons/fi';
import { cn } from '../utils/cn';

const STATUS_CONFIG = {
    SUBMITTED: {
        label: 'Soumise',
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60',
        dot: 'bg-amber-500',
        Icon: FiClock,
    },
    IN_PROGRESS: {
        label: 'En traitement',
        bg: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/60',
        dot: 'bg-sky-500',
        Icon: FiRefreshCw,
        spin: true,
    },
    APPROVED: {
        label: 'Approuvée',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
        Icon: FiCheckCircle,
    },
    REJECTED: {
        label: 'Refusée',
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/60',
        dot: 'bg-rose-500',
        Icon: FiXCircle,
    },
};

export default function StatusBadge({
    status,
    showIcon = true,
    size = 'normal',
    className = '',
}) {
    const config = STATUS_CONFIG[status] || {
        label: status || 'Non défini',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
        Icon: FiHelpCircle,
    };

    const { Icon, spin } = config;

    return (
        <motion.span
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs select-none transition-colors',
                size === 'small' 
                    ? 'px-2 py-0.5 text-xs' 
                    : 'px-2.5 py-1 text-xs sm:text-sm',
                config.bg,
                className
            )}
        >
            {showIcon && (
                <Icon 
                    className={cn(
                        'shrink-0',
                        size === 'small' ? 'w-3 h-3' : 'w-3.5 h-3.5',
                        spin ? 'animate-spin' : ''
                    )} 
                />
            )}
            <span>{config.label}</span>
        </motion.span>
    );
}

export { STATUS_CONFIG };
