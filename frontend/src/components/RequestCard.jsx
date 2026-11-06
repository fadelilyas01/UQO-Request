/**
 * Composant Carte de demande professionnel pour affichage en grille/liste.
 * Stylise avec Tailwind CSS, Framer Motion et React Icons.
 * Conforme au standard Zéro-Crash avec formatSafeDate et vérifications défensives.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiCalendar, 
    FiUser, 
    FiEdit3, 
    FiFolder, 
    FiMonitor, 
    FiTag, 
    FiArrowRight 
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import StatusBadge from './StatusBadge';
import { cn } from '../utils/cn';
import { formatSafeDate } from '../utils/safeUtils';

const TYPE_CONFIG = {
    ACADEMIC: { 
        label: 'Académique', 
        Icon: HiOutlineAcademicCap,
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
    },
    ADMINISTRATIVE: { 
        label: 'Administrative', 
        Icon: FiFolder,
        color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
    },
    TECHNICAL: { 
        label: 'Technique', 
        Icon: FiMonitor,
        color: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60'
    },
    OTHER: { 
        label: 'Générale', 
        Icon: FiTag,
        color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
    },
};

const MotionLink = motion.create(Link);

export default function RequestCard({
    request,
    showUser = false,
    className = '',
}) {
    if (!request) return null;

    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.OTHER;
    const { Icon: TypeIcon, color: typeColor } = typeConfig;

    return (
        <MotionLink
            to={`/requests/${request.id}`}
            whileHover={{ y: -3, transition: { duration: 0.15, ease: 'easeOut' } }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                'group relative flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                className
            )}
        >
            <div>
                {/* En-tete : Type & Badge Statut */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
                        typeColor
                    )}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{typeConfig.label}</span>
                    </span>

                    <StatusBadge status={request.status} size="small" />
                </div>

                {/* Titre */}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {request.title || 'Requête sans titre'}
                </h3>

                {/* Extrait description si presente */}
                {request.description && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {request.description}
                    </p>
                )}
            </div>

            {/* Pied de Carte : Metadonnees */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatSafeDate(request.created_at)}</span>
                    </div>

                    {showUser && request.user && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <FiUser className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">
                                {request.user.first_name ? `${request.user.first_name} ${request.user.last_name || ''}` : request.user.email}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Consulter</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </MotionLink>
    );
}
