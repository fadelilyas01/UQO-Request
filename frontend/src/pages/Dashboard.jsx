/**
 * Tableau de bord utilisateur de l'application UQO-Requests.
 * Refactorisé pour utiliser le hook useRequests.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRequests } from '../hooks/useRequests';
import RequestCard from '../components/RequestCard';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const { requests, loading, error, fetchRequests, stats } = useRequests();
    const [statusFilter, setStatusFilter] = useState('');

    // Charger les demandes au montage et quand le filtre change
    useEffect(() => {
        // On passe le filtre à l'API si nécessaire, ou on filtre localement
        // Ici, l'implémentation du hook supporte les filtres via l'API
        const params = statusFilter ? { status: statusFilter } : {};
        fetchRequests(params);
    }, [fetchRequests, statusFilter]);

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header animate-scale">
                <div>
                    <h1>Bonjour, {user?.first_name || 'Étudiant'} 👋</h1>
                    <p>Voici un aperçu de vos demandes académiques.</p>
                </div>
                <Link to="/requests/new" className="btn btn-primary">
                    <span>➕</span> Nouvelle demande
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {[
                    { key: 'total', icon: '📋', label: 'Total', value: stats.total, filter: '' },
                    { key: 'submitted', icon: '📝', label: 'Soumises', value: stats.submitted, filter: 'SUBMITTED' },
                    { key: 'inProgress', icon: '⏳', label: 'En cours', value: stats.inProgress, filter: 'IN_PROGRESS' },
                    { key: 'approved', icon: '✅', label: 'Approuvées', value: stats.approved, filter: 'APPROVED' },
                    { key: 'rejected', icon: '❌', label: 'Rejetées', value: stats.rejected, filter: 'REJECTED' },
                ].map((stat, index) => (
                    <button
                        key={stat.key}
                        onClick={() => setStatusFilter(stat.filter)}
                        className={`stat-card card ${statusFilter === stat.filter ? 'active' : ''} animate-in`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <span className="stat-icon">{stat.icon}</span>
                        <div>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="requests-section card animate-in" style={{ animationDelay: '500ms' }}>
                <div className="section-header">
                    <h2>Mes demandes</h2>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="SUBMITTED">Soumises</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="APPROVED">Approuvées</option>
                        <option value="REJECTED">Rejetées</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-container" style={{ minHeight: '200px', height: 'auto', position: 'relative', background: 'transparent' }}>
                        <div className="loading-spinner" />
                        <p>Chargement...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <span>⚠️</span> {error}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <span>📭</span>
                        <h3>Aucune demande</h3>
                        <p>Vous n'avez pas encore soumis de demande pour ce filtre.</p>
                        {statusFilter === '' && (
                            <Link to="/requests/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Commencer
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map((r, index) => (
                            <RequestCard
                                key={r.id}
                                request={r}
                                className="animate-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
