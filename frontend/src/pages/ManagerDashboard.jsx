/**
 * Tableau de bord gestionnaire de l'application UQO-Requests.
 * Supervision globale et gestion des transitions de statuts.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [changingStatus, setChangingStatus] = useState(false);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            const response = await api.getRequests(params);
            setRequests(response.data.results || response.data);
        } catch (err) {
            setError('Impossible de charger les demandes.');
            console.error('Erreur de chargement:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, typeFilter]);

    const stats = {
        total: requests.length,
        submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
        inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
        approved: requests.filter((r) => r.status === 'APPROVED').length,
        rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    const handleStatusChange = async () => {
        if (!selectedRequest || !newStatus) return;
        setChangingStatus(true);
        try {
            await api.changeRequestStatus(selectedRequest.id, {
                new_status: newStatus,
                comment: statusComment,
            });
            setSelectedRequest(null);
            setNewStatus('');
            setStatusComment('');
            await fetchRequests();
        } catch (err) {
            const msg = err.response?.data?.new_status?.[0] || 'Erreur lors du changement de statut.';
            alert(msg);
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
        { key: 'total', icon: '📋', label: 'Total', value: stats.total, filter: '' },
        { key: 'submitted', icon: '📝', label: 'Soumises', value: stats.submitted, filter: 'SUBMITTED' },
        { key: 'inProgress', icon: '⏳', label: 'En cours', value: stats.inProgress, filter: 'IN_PROGRESS' },
        { key: 'approved', icon: '✅', label: 'Approuvées', value: stats.approved, filter: 'APPROVED' },
        { key: 'rejected', icon: '❌', label: 'Rejetées', value: stats.rejected, filter: 'REJECTED' },
    ];

    return (
        <div className="manager-dashboard dashboard">
            <div className="dashboard-header animate-scale">
                <div>
                    <h1>Tableau de bord gestionnaire 👔</h1>
                    <p>Bienvenue, {user?.first_name}. Gestion de l'ensemble des requêtes.</p>
                </div>
            </div>

            <div className="stats-grid">
                {statCards.map((s, index) => (
                    <button
                        key={s.key}
                        onClick={() => setStatusFilter(s.filter)}
                        className={`stat-card card ${statusFilter === s.filter ? 'active' : ''} animate-in`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <span className="stat-icon">{s.icon}</span>
                        <div>
                            <span className="stat-value">{s.value}</span>
                            <span className="stat-label">{s.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="table-section card animate-in" style={{ animationDelay: '500ms' }}>
                <div className="table-header">
                    <h2>Toutes les demandes</h2>
                    <div className="filters">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input"
                        >
                            <option value="">Tous statuts</option>
                            <option value="SUBMITTED">Soumises</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="APPROVED">Approuvées</option>
                            <option value="REJECTED">Rejetées</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="input"
                        >
                            <option value="">Tous types</option>
                            <option value="ACADEMIC">Académique</option>
                            <option value="ADMINISTRATIVE">Administrative</option>
                            <option value="TECHNICAL">Technique</option>
                            <option value="OTHER">Autre</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p className="loading-pulse">Chargement des demandes...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <span>⚠️</span> {error}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <span>📭</span>
                        <h3>Aucune demande trouvée</h3>
                        <p>Il n'y a aucune demande correspondant aux critères sélectionnés.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Type</th>
                                    <th>Demandeur</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r, index) => (
                                    <tr
                                        key={r.id}
                                        className="animate-in-row"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td>
                                            <Link to={`/requests/${r.id}`} className="title-link">
                                                {r.title}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className="type-badge">{r.type_display}</span>
                                        </td>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {(r.user?.first_name?.[0] || r.user?.username?.[0] || 'U').toUpperCase()}
                                                    {(r.user?.last_name?.[0] || '').toUpperCase()}
                                                </div>
                                                <span>{r.user?.full_name || r.user?.username}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="date">
                                            {new Date(r.created_at).toLocaleDateString('fr-CA')}
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <Link
                                                    to={`/requests/${r.id}`}
                                                    className="action-btn"
                                                    title="Voir détails"
                                                >
                                                    👁️
                                                </Link>
                                                {getAllowedTransitions(r.status).length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(r);
                                                            setNewStatus('');
                                                            setStatusComment('');
                                                        }}
                                                        className="action-btn change"
                                                        title="Changer statut"
                                                    >
                                                        🔄
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedRequest && (
                <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="modal card animate-scale" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Changer le statut</h3>
                            <button onClick={() => setSelectedRequest(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-title">{selectedRequest.title}</p>
                            <div className="current-status">
                                <span>Actuel:</span>
                                <StatusBadge status={selectedRequest.status} />
                            </div>
                            <div className="form-group">
                                <label className="label">Nouveau statut</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="input"
                                >
                                    <option value="">Sélectionner...</option>
                                    {getAllowedTransitions(selectedRequest.status).map((s) => (
                                        <option key={s} value={s}>
                                            {s === 'IN_PROGRESS'
                                                ? 'En cours'
                                                : s === 'APPROVED'
                                                ? 'Approuvée'
                                                : 'Rejetée'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Commentaire (optionnel)</label>
                                <textarea
                                    value={statusComment}
                                    onChange={(e) => setStatusComment(e.target.value)}
                                    className="input"
                                    rows={3}
                                    placeholder="Préciser le motif de cette mise à jour..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="btn btn-secondary"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleStatusChange}
                                className="btn btn-primary"
                                disabled={!newStatus || changingStatus}
                            >
                                {changingStatus ? 'Enregistrement...' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
