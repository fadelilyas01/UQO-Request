/**
 * Page de consultation detaillee d'une requete pour UQO-Requests.
 * Integre fil chronologique, fil de commentaires securise,
 * modal de confirmation de suppression robuste, notifications toast
 * et parsing defensif Zéro-Crash.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiCalendar, 
    FiUser, 
    FiFolder, 
    FiTrash2, 
    FiEdit2, 
    FiMessageSquare, 
    FiCheckCircle, 
    FiSend, 
    FiShield, 
    FiAlertCircle, 
    FiX,
    FiClock,
    FiArrowRight
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { api, getSafeApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ErrorState from '../components/ErrorState';
import RobustButton from '../components/RobustButton';
import { cn } from '../utils/cn';
import { formatSafeDate, formatSafeDateTime, safeArray } from '../utils/safeUtils';

const TYPE_CONFIG = {
    ACADEMIC: { label: 'Académique', Icon: HiOutlineAcademicCap },
    ADMINISTRATIVE: { label: 'Administrative', Icon: FiFolder },
    TECHNICAL: { label: 'Technique', Icon: FiFolder },
    OTHER: { label: 'Générale', Icon: FiFolder },
};

export default function RequestDetail() {
    const { id } = useParams();
    const { isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentError, setCommentError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(location.state?.message || null);

    const fetchRequest = async () => {
        try {
            const response = await api.getRequest(id);
            setRequest(response.data);
            setError(null);
        } catch (err) {
            setError(getSafeApiErrorMessage(err, 'Impossible de charger le dossier demandé.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
        if (location.state?.message) {
            window.history.replaceState({}, document.title);
        }
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        const content = newComment.trim();
        if (!content) return;

        setSubmittingComment(true);
        setCommentError(null);

        try {
            await api.addComment(id, content);
            setNewComment('');
            showToast({
                type: 'success',
                title: 'Message enregistré',
                message: 'Votre commentaire a été consigné au dossier.',
            });
            await fetchRequest();
        } catch (err) {
            const msg = getSafeApiErrorMessage(err, "Impossible d'enregistrer votre message. Veuillez réessayer.");
            setCommentError(msg);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.deleteRequest(id);
            showToast({
                type: 'info',
                title: 'Dossier supprimé',
                message: 'La requête a été définitivement supprimée.',
            });
            navigate('/dashboard', { 
                state: { message: 'La requête a été définitivement supprimée.' } 
            });
        } catch (err) {
            setCommentError(getSafeApiErrorMessage(err, 'Impossible de supprimer la requête.'));
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-medium">Chargement sécurisé du dossier...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <ErrorState
                title="Dossier indisponible"
                message={error || "Cette requête n'existe pas ou vos permissions ne permettent pas sa consultation."}
                impact="Aucune donnée personnelle n'a été modifiée ou compromise."
                onRetry={fetchRequest}
            />
        );
    }

    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.OTHER;
    const { Icon: TypeIcon } = typeConfig;
    const commentsList = safeArray(request.comments);
    const historyList = safeArray(request.status_history);

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-2">
            {/* Barre de Navigation Supérieure */}
            <div className="flex items-center justify-between">
                <Link
                    to={isManager ? '/manager' : '/dashboard'}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    <span>{isManager ? 'Retour à la supervision' : 'Retour au tableau de bord'}</span>
                </Link>

                {request.can_edit && (
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/requests/${id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <FiEdit2 className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                        </Link>
                        <RobustButton
                            variant="danger"
                            size="xs"
                            onClick={() => setShowDeleteModal(true)}
                            icon={FiTrash2}
                        >
                            Supprimer
                        </RobustButton>
                    </div>
                )}
            </div>

            {/* Notification de Succès Locale */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between text-xs sm:text-sm text-emerald-800 dark:text-emerald-200"
                    >
                        <div className="flex items-center gap-2.5">
                            <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors"
                            aria-label="Fermer la notification"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Carte Principale du Dossier */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 space-y-6">
                {/* Header : Titre & Statut */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <TypeIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{typeConfig.label}</span>
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                Dossier #{request.id}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {request.title}
                        </h1>
                    </div>

                    <StatusBadge status={request.status} size="large" />
                </div>

                {/* Métadonnées du Demandeur & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                            <FiUser className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-slate-400 block">Étudiant demandeur</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {request.user?.first_name ? `${request.user.first_name} ${request.user.last_name || ''}` : request.user?.email}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                            <FiCalendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-slate-400 block">Date de soumission</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                {formatSafeDate(request.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                            <FiClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-slate-400 block">Dernière mise à jour</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                {formatSafeDate(request.updated_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description de la Requête */}
                <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Exposé de la demande
                    </h2>
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {request.description}
                    </div>
                </div>
            </div>

            {/* Section Double Colonne : Commentaires et Historique */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne Principale : Fil de Discussion */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FiMessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Échanges & Commentaires officiels
                                </h3>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                {commentsList.length}
                            </span>
                        </div>

                        {commentError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                                <FiAlertCircle className="w-4 h-4 shrink-0" />
                                <span>{commentError}</span>
                            </div>
                        )}

                        {/* Liste des Commentaires */}
                        <div className="space-y-4">
                            {commentsList.length > 0 ? (
                                commentsList.map((comment) => {
                                    const isFromManager = comment.author?.role === 'MANAGER';

                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                'p-4 rounded-2xl border space-y-2',
                                                isFromManager
                                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                                        isFromManager
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                    )}>
                                                        {comment.author?.first_name ? comment.author.first_name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                        {comment.author?.full_name || comment.author?.email}
                                                    </span>
                                                    {isFromManager && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                                            <FiShield className="w-2.5 h-2.5" />
                                                            Gestionnaire
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {formatSafeDateTime(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pl-8 whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-400 py-6 text-center italic">
                                    Aucun commentaire n'a encore été ajouté à ce dossier.
                                </p>
                            )}
                        </div>

                        {/* Formulaire d'Ajout de Commentaire avec RobustButton */}
                        <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                placeholder="Ajouter une précision ou répondre au gestionnaire..."
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex justify-end">
                                <RobustButton
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    loading={submittingComment}
                                    loadingText="Transmission..."
                                    disabled={!newComment.trim()}
                                    icon={FiSend}
                                >
                                    Envoyer le message
                                </RobustButton>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Colonne Secondaire : Historique des Statuts & Audit Trail */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <FiClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Traçabilité des décisions
                            </h3>
                        </div>

                        {historyList.length > 0 ? (
                            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                {historyList.map((history) => (
                                    <div key={history.id} className="relative group">
                                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={history.new_status} size="small" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Par {history.changed_by?.full_name || 'Système'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                {formatSafeDateTime(history.changed_at)}
                                            </p>
                                            {history.comment && (
                                                <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md">
                                                    « {history.comment} »
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                Statut initial enregistré lors de la soumission.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Confirmation de Suppression Robuste */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4"
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <FiTrash2 className="w-6 h-6" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Confirmer la suppression
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Êtes-vous certain de vouloir supprimer définitivement cette requête ? Cette action est irréversible.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Annuler
                                </button>
                                <RobustButton
                                    variant="danger"
                                    size="sm"
                                    onClick={handleDelete}
                                    loading={deleting}
                                    loadingText="Suppression en cours..."
                                >
                                    Supprimer définitivement
                                </RobustButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
