/**
 * Composant d'etat d'erreur (Error State) conforme au standard UX Writing Senior.
 * Repond systematiquement aux 3 questions :
 * 1. Que s'est-il passe ?
 * 2. Quel est l'impact sur vos donnees ?
 * 3. Quelle est la solution immediate ?
 * Integre RobustButton avec verrouillage anti-double clic et retour accessible.
 */

import { motion } from 'framer-motion';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { RobustButton } from './RobustButton';

export default function ErrorState({
    title = "Impossible de charger les données",
    message = "Le serveur n'a pas répondu dans le délai imparti ou une instabilité réseau est survenue.",
    impact = "Vos requêtes et modifications précédentes restent sécurisées et intactes.",
    onRetry,
    isRetrying = false,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 max-w-lg mx-auto text-center"
        >
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xs">
                <FiAlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-rose-950 dark:text-rose-200 mb-2">
                {title}
            </h3>

            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                {message}
            </p>

            {impact && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Impact : </span>
                    {impact}
                </p>
            )}

            {onRetry && (
                <RobustButton
                    variant="danger"
                    size="md"
                    onClick={onRetry}
                    loading={isRetrying}
                    loadingText="Nouvelle tentative..."
                    icon={FiRefreshCw}
                    className="mx-auto"
                >
                    Réessayer
                </RobustButton>
            )}
        </motion.div>
    );
}
