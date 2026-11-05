/**
 * Composant Badge de statut pour afficher l'état d'une demande.
 * 
 * Ce composant affiche un badge coloré représentant le statut d'une demande.
 * Chaque statut a une couleur et une icône distincte pour une identification rapide.
 * 
 * Statuts possibles:
 * - SUBMITTED (Soumise): Jaune/Orange - 📝
 * - IN_PROGRESS (En cours): Bleu - ⏳
 * - APPROVED (Approuvée): Vert - ✅
 * - REJECTED (Rejetée): Rouge - ❌
 * 
 * @author UQO
 * @version 1.0.0
 */

// Importation des styles CSS du composant
import './StatusBadge.css';

// ============================================================================
// CONFIGURATION DES STATUTS
// ============================================================================

/**
 * Configuration des statuts de demande.
 * Chaque statut a un label, une classe CSS et une icône.
 */
const STATUS_CONFIG = {
    SUBMITTED: {
        label: 'Soumise',       // Texte affiché
        className: 'badge-submitted',  // Classe CSS pour le style
        icon: '📝'              // Icône émoji
    },
    IN_PROGRESS: {
        label: 'En cours',
        className: 'badge-in-progress',
        icon: '⏳'
    },
    APPROVED: {
        label: 'Approuvée',
        className: 'badge-approved',
        icon: '✅'
    },
    REJECTED: {
        label: 'Rejetée',
        className: 'badge-rejected',
        icon: '❌'
    },
};

// ============================================================================
// COMPOSANT
// ============================================================================

/**
 * Composant StatusBadge - Badge de statut coloré.
 * 
 * @param {Object} props - Les props du composant
 * @param {string} props.status - Le code du statut (SUBMITTED, IN_PROGRESS, etc.)
 * @param {boolean} props.showIcon - Afficher l'icône (true par défaut)
 * @param {string} props.size - Taille du badge ('normal' ou 'small')
 * @returns {JSX.Element} Le badge de statut
 * 
 * @example
 * // Badge normal avec icône
 * <StatusBadge status="APPROVED" />
 * 
 * @example
 * // Badge petit sans icône
 * <StatusBadge status="IN_PROGRESS" showIcon={false} size="small" />
 */
export default function StatusBadge({
    status,
    showIcon = true,
    size = 'normal'
}) {
    // Récupérer la configuration du statut ou utiliser une valeur par défaut
    const config = STATUS_CONFIG[status] || {
        label: status,              // Afficher le code brut si inconnu
        className: 'badge-default', // Style par défaut
        icon: '❓',                 // Icône d'interrogation
    };

    return (
        <span
            className={`badge ${config.className} ${size === 'small' ? 'badge-small' : ''}`}
        >
            {/* Icône (optionnelle) */}
            {showIcon && <span className="badge-icon">{config.icon}</span>}

            {/* Label du statut */}
            <span>{config.label}</span>
        </span>
    );
}

// Export de la configuration des statuts pour réutilisation
export { STATUS_CONFIG };
