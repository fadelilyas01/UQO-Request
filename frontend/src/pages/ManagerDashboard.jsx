/**
 * Tableau de bord gestionnaire professionnel pour UQO-Requests.
 * Supervise les requetes et pilote les transitions d'etats.
 * Conforme au standard Zéro-Crash avec safeArray, debouncing,
 * boutons robustes et notifications toast.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiShield, 
    FiSearch, 
    FiFilter, 
    FiLayers, 
    FiClock, 
    FiRefreshCw, 
    FiCheckCircle, 
    FiXCircle, 
    FiEye, 
    FiEdit2, 
    FiX, 
    FiUser, 
    FiCalendar,
    FiAlertCircle
} from 'react-icons/fi';
import { api, getSafeApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader, { TableRowSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import RobustButton from '../components/RobustButton';
import { cn } from '../utils/cn';
import { formatSafeDate, safeArray } from '../utils/safeUtils';

export default function ManagerDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [changingStatus, setChangingStatus] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [error, setError] = useState(null);

    const debouncedSearch = useDebounce(searchQuery, 250);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            const response = await api.getRequests(params);
            const data = response.data?.results ?? response.data;
            setRequests(safeArray(data));
        } catch (err) {
            setError(getSafeApiErrorMessage(err, "Impossible de charger les demandes d'intervention."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, typeFilter]);

    const safeRequests = safeArray(requests);

    // Filtrage recherche en direct avec debouncing
    const filteredRequests = useMemo(() => {
        if (!debouncedSearch.trim()) return safeRequests;
        const q = debouncedSearch.toLowerCase();
        return safeRequests.filter(r => 
            (r?.title && r.title.toLowerCase().includes(q)) ||
            (r?.user?.full_name && r.user.full_name.toLowerCase().includes(q)) ||
            (r?.user?.email && r.user.email.toLowerCase().includes(q))
        );
    }, [safeRequests, debouncedSearch]);

    const stats = {
        total: safeRequests.length,
        submitted: safeRequests.filter((r) => r?.status === 'SUBMITTED').length,
        inProgress: safeRequests.filter((r) => r?.status === 'IN_PROGRESS').length,
        approved: safeRequests.filter((r) => r?.status === 'APPROVED').length,
        rejected: safeRequests.filter((r) => r?.status === 'REJECTED').length,
    };

    const handleStatusChange = async (e) => {
        e.preventDefault();
        if (!selectedRequest || !newStatus) return;
        setChangingStatus(true);
        setModalError(null);
        try {
            await api.changeRequestStatus(selectedRequest.id, {
                new_status: newStatus,
                comment: statusComment,
            });

            showToast({
                type: 'success',
                title: 'Statut mis à jour',
                message: `La requête #${selectedRequest.id} a été mise à jour avec succès.`,
            });

            setSelectedRequest(null);
            setNewStatus('');
            setStatusComment('');
            await fetchRequests();
        } catch (err) {
            setModalError(getSafeApiErrorMessage(err, "Erreur lors de la mise à jour du statut."));
        } finally {
            setChangingStatus(false);
        }
    };

    const getAllowedTransitions = (s) =>
        ({
            SUBMITTED: ['IN_PROGRESS', 'APPROVED', 'REJECTED'],
            IN_PROGRESS: ['APPROVED', 'REJECTED'],
        }[s] || []);

    const statCards = [
        { key: 'total', label: 'Toutes', value: stats.total, filter: '', Icon: FiLayers, color: 'text-slate-600 dark:text-slate-300' },
        { key: 'submitted', label: 'À traiter', value: stats.submitted, filter: 'SUBMITTED', Icon: FiClock, color: 'text-amber-600 dark:text-amber-400' },
        { key: 'inProgress', label: 'En cours', value: stats.inProgress, filter: 'IN_PROGRESS', Icon: FiRefreshCw, color: 'text-sky-600 dark:text-sky-400' },
        { key: 'approved', label: 'Approuvées', value: stats.approved, filter: 'APPROVED', Icon: FiCheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
        { key: 'rejected', label: 'Refusées', value: stats.rejected, filter: 'REJECTED', Icon: FiXCircle, color: 'text-rose-600 dark:text-rose-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Header Gestionnaire */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-uqo-50 dark:bg-uqo-dark text-uqo-700 dark:text-uqo-accent-300 text-xs font-semibold mb-2 ring-1 ring-uqo-500/20">
                        <FiShield className="w-3.5 h-3.5" />
                        <span>Espace de Supervision & Décision</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Tableau de bord de gestion
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Gestionnaire : <span className="font-semibold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</span>. Traitez les requêtes des étudiants.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <RobustButton
                        variant="secondary"
                        size="sm"
                        onClick={fetchRequests}
                        loading={loading}
                        loadingText="Synchronisation..."
                        icon={FiRefreshCw}
                    >
                        Actualiser
                    </RobustButton>
                </div>
            </div>

            {/* Statistiques Métier Clés */}
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
                                'flex flex-col text-left p-4 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500 cursor-pointer',
                                isSelected
                                    ? 'bg-uqo-50 dark:bg-uqo-dark border-uqo-600 shadow-2xs ring-1 ring-uqo-600'
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

            {/* Barre de Recherche et Filtres */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par titre, étudiant, courriel..."
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FiFilter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="">Toutes les catégories</option>
                            <option value="ACADEMIC">Académique</option>
                            <option value="ADMINISTRATIVE">Administrative</option>
                            <option value="TECHNICAL">Technique</option>
                            <option value="OTHER">Autre</option>
                        </select>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="SUBMITTED">À traiter</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="APPROVED">Approuvées</option>
                        <option value="REJECTED">Refusées</option>
                    </select>
                </div>
            </div>

            {/* Tableau des Requêtes Supervisees */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-4">
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                    </div>
                ) : error ? (
                    <div className="p-8">
                        <ErrorState 
                            message={error}
                            onRetry={fetchRequests}
                        />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-8">
                        <EmptyState
                            title={searchQuery ? "Aucun dossier ne correspond à votre recherche" : "Aucune requête à traiter"}
                            description={
                                searchQuery 
                                    ? "Modifiez vos filtres ou la chaîne de recherche." 
                                    : "Toutes les requêtes de cette catégorie ont été traitées avec succès."
                            }
                            actionLabel={searchQuery ? "Effacer la recherche" : undefined}
                            onAction={searchQuery ? () => setSearchQuery('') : undefined}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Réf</th>
                                    <th className="py-3.5 px-4">Étudiant</th>
                                    <th className="py-3.5 px-4">Objet de la requête</th>
                                    <th className="py-3.5 px-4">Catégorie</th>
                                    <th className="py-3.5 px-4">Statut</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {filteredRequests.map((r) => {
                                    const allowedTransitions = getAllowedTransitions(r.status);
                                    const canChangeStatus = allowedTransitions.length > 0;

                                    return (
                                        <tr 
                                            key={r.id}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                                                #{r.id}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                                                        {r.user?.first_name ? r.user.first_name[0].toUpperCase() : 'E'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                                                            {r.user?.first_name ? `${r.user.first_name} ${r.user.last_name || ''}` : r.user?.email}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {r.user?.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                                                    {r.title}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                                                {r.type}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <StatusBadge status={r.status} size="small" />
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                                                {formatSafeDate(r.created_at)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        to={`/requests/${r.id}`}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Consulter le dossier complet"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>

                                                    {canChangeStatus && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(r);
                                                                setNewStatus('');
                                                                setStatusComment('');
                                                                setModalError(null);
                                                            }}
                                                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                                            title="Mettre à jour le statut"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Transition de Statut avec RobustButton */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FiShield className="text-emerald-600" />
                                    <span>Mise à jour du statut de la requête #{selectedRequest.id}</span>
                                </h3>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleStatusChange} className="p-6 space-y-4">
                                {modalError && (
                                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                        <FiAlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                        Nouveau statut décisionnel *
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="">Sélectionnez un statut cible...</option>
                                        {getAllowedTransitions(selectedRequest.status).map((s) => (
                                            <option key={s} value={s}>
                                                {s === 'IN_PROGRESS'
                                                    ? 'En traitement (Prise en charge)'
                                                    : s === 'APPROVED'
                                                    ? 'Approuvée (Accordée)'
                                                    : 'Refusée (Demande rejetée)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                        Motif de la décision (Optionnel mais recommandé)
                                    </label>
                                    <textarea
                                        value={statusComment}
                                        onChange={(e) => setStatusComment(e.target.value)}
                                        rows={3}
                                        placeholder="Explication formelle à l'attention de l'étudiant..."
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <RobustButton
                                        type="submit"
                                        variant="primary"
                                        loading={changingStatus}
                                        loadingText="Enregistrement sécurisé..."
                                        disabled={!newStatus}
                                    >
                                        Confirmer la décision
                                    </RobustButton>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
