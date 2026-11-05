/**
 * Composant Carte de demande pour l'affichage dans les listes.
 * 
 * Ce composant affiche un aperçu d'une demande sous forme de carte cliquable.
 * Il est utilisé dans le tableau de bord pour lister les demandes.
 * 
 * Fonctionnalités:
 * - Affichage du type avec icône
 * - Badge de statut coloré
 * - Titre de la demande
 * - Métadonnées (utilisateur, date)
 * - Indication si la demande est modifiable
 * - Navigation vers le détail au clic
 * 
 * @author UQO
 * @version 1.0.0
 */

// Importation du composant Link pour la navigation
import { Link } from 'react-router-dom';

// Importation du composant de badge de statut
import StatusBadge from './StatusBadge';

// Importation des styles CSS du composant
import './RequestCard.css';

// ============================================================================
// CONFIGURATION DES TYPES
// ============================================================================

/**
 * Configuration des types de demandes.
 * Chaque type a un label lisible et une icône émoji.
 */
const TYPE_CONFIG = {
    ACADEMIC: { label: 'Académique', icon: '🎓' },      // Demandes liées aux cours/examens
    ADMINISTRATIVE: { label: 'Administrative', icon: '📁' },  // Documents officiels
    TECHNICAL: { label: 'Technique', icon: '💻' },      // Problèmes techniques
    OTHER: { label: 'Autre', icon: '📌' },              // Autres demandes
};

// ============================================================================
// COMPOSANT
// ============================================================================

/**
 * Composant RequestCard - Carte d'aperçu d'une demande.
 * 
 * @param {Object} props - Les props du composant
 * @param {Object} props.request - Les données de la demande
 * @param {boolean} props.showUser - Afficher ou non les informations de l'utilisateur
 * @param {string} props.className - Classes CSS supplémentaires
 * @param {Object} props.style - Styles inline supplémentaires
 * @returns {JSX.Element} La carte de demande cliquable
 */
export default function RequestCard({
    request,
    showUser = false,
    className = '',
    style = {}
}) {
    // -------------------------------------------------------------------------
    // FONCTIONS UTILITAIRES
    // -------------------------------------------------------------------------

    /**
     * Formate une date ISO en format canadien-français lisible.
     * 
     * @param {string} dateString - La date au format ISO (ex: "2024-01-15T10:30:00Z")
     * @returns {string} La date formatée (ex: "15 janv. 2024")
     */
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-CA', {
            year: 'numeric',   // Année complète (2024)
            month: 'short',    // Mois abrégé (janv.)
            day: 'numeric',    // Jour (15)
        });
    };

    // Récupérer la configuration du type (ou fallback vers OTHER)
    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.OTHER;

    // -------------------------------------------------------------------------
    // RENDU
    // -------------------------------------------------------------------------

    return (
        <Link
            to={`/requests/${request.id}`}  // Navigation vers le détail
            className={`request-card card card-hover ${className}`}
            style={style}
        >
            {/* En-tête de la carte: Type et Statut */}
            <div className="request-card-header">
                {/* Badge du type de demande */}
                <div className="request-type">
                    <span>{typeConfig.icon}</span>
                    <span>{typeConfig.label}</span>
                </div>

                {/* Badge de statut (Soumise, En cours, etc.) */}
                <StatusBadge status={request.status} />
            </div>

            {/* Titre de la demande */}
            <h3 className="request-card-title">{request.title}</h3>

            {/* Métadonnées: Utilisateur et Date */}
            <div className="request-card-meta">
                {/* Afficher l'utilisateur si demandé (utile pour les gestionnaires) */}
                {showUser && request.user && (
                    <span className="meta-item">
                        <span>👤</span> {request.user.full_name}
                    </span>
                )}

                {/* Date de création */}
                <span className="meta-item">
                    <span>📅</span> {formatDate(request.created_at)}
                </span>
            </div>

            {/* 
                Pied de carte: Indication de modification possible
                Affiché uniquement si l'utilisateur peut modifier la demande
                (propriétaire + statut SUBMITTED)
            */}
            {request.can_edit && (
                <div className="request-card-footer">
                    <span className="editable-badge">✏️ Modifiable</span>
                </div>
            )}
        </Link>
    );
}

// Export de la configuration des types pour réutilisation
export { TYPE_CONFIG };
