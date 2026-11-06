/**
 * Tableau de bord etudiant professionnel pour UQO-Requests.
 * Integre debouncing de recherche, parsing defensif safeArray
 * et gestion exhaustive des 5 etats UI (Zéro-Crash standard).
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiPlus, 
    FiLayers, 
    FiClock, 
    FiRefreshCw, 
    FiCheckCircle, 
    FiXCircle, 
    FiFilter, 
    FiSearch 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useRequests } from '../hooks/useRequests';
import { useDebounce } from '../hooks/useDebounce';
import RequestCard from '../components/RequestCard';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { cn } from '../utils/cn';
import { safeArray } from '../utils/safeUtils';

export default function Dashboard() {
    const { user } = useAuth();
    const { requests, loading, error, fetchRequests, stats } = useRequests();
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const debouncedSearch = useDebounce(searchQuery, 250);

    useEffect(() => {
        const params = statusFilter ? { status: statusFilter } : {};
        fetchRequests(params);
    }, [fetchRequests, statusFilter]);

    // Filtrage recherche en direct avec debouncing
    const safeRequests = safeArray(requests);
    const filteredRequests = useMemo(() => {
        if (!debouncedSearch.trim()) return safeRequests;
        const q = debouncedSearch.toLowerCase();
        return safeRequests.filter(r => 
            (r?.title && r.title.toLowerCase().includes(q)) ||
            (r?.description && r.description.toLowerCase().includes(q)) ||
            (r?.type && r.type.toLowerCase().includes(q))
        );
    }, [safeRequests, debouncedSearch]);

    const statCards = [
        { key: 'total', label: 'Toutes les requêtes', value: stats.total, filter: '', Icon: FiLayers, color: 'text-slate-600 dark:text-slate-300' },
        { key: 'submitted', label: 'Soumises', value: stats.submitted, filter: 'SUBMITTED', Icon: FiClock, color: 'text-amber-600 dark:text-amber-400' },
        { key: 'inProgress', label: 'En traitement', value: stats.inProgress, filter: 'IN_PROGRESS', Icon: FiRefreshCw, color: 'text-sky-600 dark:text-sky-400' },
        { key: 'approved', label: 'Approuvées', value: stats.approved, filter: 'APPROVED', Icon: FiCheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
        { key: 'rejected', label: 'Refusées', value: stats.rejected, filter: 'REJECTED', Icon: FiXCircle, color: 'text-rose-600 dark:text-rose-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Header du Tableau de Bord */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Bonjour, {user?.first_name || 'Étudiant(e)'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Consultez l'état d'avancement et gérez l'ensemble de vos requêtes académiques.
                    </p>
                </div>

                <Link
                    to="/requests/new"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs hover:shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <FiPlus className="w-4 h-4" />
                    <span>Nouvelle requête</span>
                </Link>
            </div>

            {/* Cartes d'Indicateurs / Statistiques Clés */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {statCards.map((stat) => {
                    const { Icon, color } = stat;
                    const isSelected = statusFilter === stat.filter;

                    return (
                        <button
                            key={stat.key}
                            type="button"
                            onClick={() => setStatusFilter(stat.filter)}
                            className={cn(
                                'flex flex-col text-left p-4 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer',
                                isSelected
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-2xs ring-1 ring-emerald-500'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {stat.label}
                                </span>
                                <Icon className={cn('w-4 h-4', color)} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                                {stat.value}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Barre d'Outils : Recherche & Filtres */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par mot-clé, cours, objet..."
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FiFilter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="SUBMITTED">Soumises</option>
                        <option value="IN_PROGRESS">En traitement</option>
                        <option value="APPROVED">Approuvées</option>
                        <option value="REJECTED">Refusées</option>
                    </select>
                </div>
            </div>

            {/* Zone de Contenu : Les 5 États */}
            {loading ? (
                <SkeletonLoader count={6} />
            ) : error ? (
                <ErrorState 
                    message={error}
                    onRetry={() => fetchRequests(statusFilter ? { status: statusFilter } : {})}
                />
            ) : filteredRequests.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "Aucune requête ne correspond à votre recherche" : "Aucune requête enregistrée"}
                    description={
                        searchQuery 
                            ? "Essayez d'ajuster vos termes de recherche ou réinitialisez le filtre de statut."
                            : "Vous n'avez pas encore soumis de requête académique ou administrative."
                    }
                    actionLabel={searchQuery ? "Effacer la recherche" : "Créer une nouvelle requête"}
                    actionLink={searchQuery ? undefined : "/requests/new"}
                    onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
            ) : (
                <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <AnimatePresence>
                        {filteredRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
