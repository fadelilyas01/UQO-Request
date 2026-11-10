/**
 * Composant d'etat vide (Empty State) conforme aux regles UI/UX professionnelles.
 * Affiche une illustration vectorielle sobre, un message rassurant et une action directe.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiInbox, FiPlus } from 'react-icons/fi';

export default function EmptyState({
    title = "Aucune requête trouvée",
    description = "Vous n'avez pas encore soumis de requête ou aucun élément ne correspond à vos filtres de recherche.",
    actionLabel = "Créer une nouvelle requête",
    actionLink = "/requests/new",
    icon: Icon = FiInbox,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 max-w-lg mx-auto"
        >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-uqo-50 dark:bg-uqo-dark flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4 shadow-xs">
                <Icon className="w-7 h-7 text-uqo-600 dark:text-uqo-accent-400" />
            </div>

            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                {title}
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                {description}
            </p>

            {actionLabel && actionLink && (
                <Link
                    to={actionLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-uqo-600 hover:bg-uqo-700 active:bg-uqo-800 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500 focus-visible:ring-offset-2"
                >
                    <FiPlus className="w-4 h-4" />
                    <span>{actionLabel}</span>
                </Link>
            )}
        </motion.div>
    );
}
