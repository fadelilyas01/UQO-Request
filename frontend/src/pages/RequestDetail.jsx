/**
 * Page de consultation detaillee d'une demande pour UQO-Requests.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import './RequestDetail.css';

const TYPE_LABELS = {
    ACADEMIC: 'Académique',
    ADMINISTRATIVE: 'Administrative',
    TECHNICAL: 'Technique',
    OTHER: 'Autre',
};

export default function RequestDetail() {
    const { id } = useParams();
    const { isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentError, setCommentError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(location.state?.message);

    const fetchRequest = async () => {
        try {
            const response = await api.getRequest(id);
            setRequest(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Demande non trouvée.' : 'Impossible de charger la demande.');
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

        setSubmitting(true);
        setCommentError(null);
        try {
            await api.addComment(id, content);
            setNewComment('');
            await fetchRequest();
        } catch {
            setCommentError("Impossible d'enregistrer le commentaire.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;
        try {
            await api.deleteRequest(id);
            navigate('/dashboard', { state: { message: 'Demande supprimée avec succès.' } });
        } catch {
            alert('Impossible de supprimer la demande.');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-pulse">Chargement des détails...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="detail-error card animate-scale">
                <span>⚠️</span>
                <h2>Erreur</h2>
                <p>{error || 'Demande introuvable.'}</p>
                <Link to={isManager ? '/manager' : '/dashboard'} className="btn btn-primary">
                    Retour au tableau de bord
                </Link>
            </div>
        );
    }

    return (
        <div className="detail-container animate-in">
            {successMessage && (
                <div className="success-banner">
                    <span>✅</span>
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            <div className="detail-header card">
                <Link to={isManager ? '/manager' : '/dashboard'} className="back-link">
                    ← Retour
                </Link>
                <div className="header-content">
                    <div className="title-row">
                        <h1>{request.title}</h1>
                        <StatusBadge status={request.status} />
                    </div>
                    <div className="meta-row">
                        <span>📁 {TYPE_LABELS[request.type] || request.type}</span>
                        <span>👤 {request.user?.full_name}</span>
                        <span>📅 {formatDate(request.created_at)}</span>
                    </div>
                </div>
                {request.can_edit && (
                    <div className="action-buttons">
                        <Link to={`/requests/${id}/edit`} className="btn btn-secondary">
                            Modifier
                        </Link>
                        <button onClick={handleDelete} className="btn btn-danger">
                            Supprimer
                        </button>
                    </div>
                )}
            </div>

            <div className="detail-grid">
                <div className="main-col">
                    <div className="card section">
                        <h2>Description</h2>
                        <p className="description">{request.description}</p>
                    </div>
                    <div className="card section">
                        <h2>Commentaires ({request.comments?.length || 0})</h2>
                        {commentError && (
                            <div className="auth-error" style={{ marginBottom: '1rem' }}>
                                <span>⚠️</span>
                                <span>{commentError}</span>
                            </div>
                        )}
                        {request.comments?.length > 0 ? (
                            <div className="comments-list">
                                {request.comments.map((c) => (
                                    <div key={c.id} className="comment">
                                        <div className="comment-header">
                                            <span className="author">
                                                {c.author?.role === 'MANAGER' ? '👔' : '👤'} {c.author?.full_name}
                                                {c.author?.role === 'MANAGER' && <span className="role-tag">Gestionnaire</span>}
                                            </span>
                                            <span className="date">{formatDate(c.created_at)}</span>
                                        </div>
                                        <p>{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-text">Aucun commentaire pour le moment.</p>
                        )}
                        <form onSubmit={handleAddComment} className="comment-form">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="input"
                                placeholder="Ajouter un commentaire..."
                                rows={3}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!newComment.trim() || submitting}
                            >
                                {submitting ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="side-col">
                    <div className="card section">
                        <h2>Historique des statuts</h2>
                        {request.status_history?.length > 0 ? (
                            <div className="timeline">
                                {request.status_history.map((e) => (
                                    <div key={e.id} className="timeline-item">
                                        <div className="dot"></div>
                                        <div className="timeline-content">
                                            <div className="status-change">
                                                <StatusBadge status={e.old_status} size="small" showIcon={false} />
                                                <span>→</span>
                                                <StatusBadge status={e.new_status} size="small" showIcon={false} />
                                            </div>
                                            <span className="meta">{e.changed_by?.full_name || 'Système'}</span>
                                            <span className="meta">{formatDate(e.changed_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-text">Aucun changement de statut.</p>
                        )}
                        <div className="creation-info">
                            Créée le {formatDate(request.created_at)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
