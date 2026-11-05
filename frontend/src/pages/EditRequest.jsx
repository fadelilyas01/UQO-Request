/**
 * Page de modification de demande de l'application UQO-Requests.
 * 
 * Cette page permet aux utilisateurs de modifier une demande existante.
 * La modification n'est possible que si la demande est au statut SUBMITTED.
 * 
 * Fonctionnalités:
 * - Chargement des données de la demande existante
 * - Vérification des permissions de modification
 * - Formulaire pré-rempli avec les valeurs actuelles
 * - Validation des modifications
 * - Affichage d'un message si la modification n'est pas autorisée
 * 
 * @author UQO
 * @version 1.0.0
 */

// Importation des hooks React
import { useState, useEffect } from 'react';

// Importation des composants de routage
import { useNavigate, useParams, Link } from 'react-router-dom';

// Importation du client API
import { api } from '../api/client';

// Importation des styles CSS
import './RequestForm.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration des types de demandes disponibles.
 */
const REQUEST_TYPES = [
    { value: 'ACADEMIC', label: 'Académique', icon: '🎓' },
    { value: 'ADMINISTRATIVE', label: 'Administrative', icon: '📁' },
    { value: 'TECHNICAL', label: 'Technique', icon: '💻' },
    { value: 'OTHER', label: 'Autre', icon: '📌' },
];

// ============================================================================
// COMPOSANT
// ============================================================================

/**
 * Composant EditRequest - Formulaire de modification de demande.
 * 
 * @returns {JSX.Element} Le formulaire de modification ou un message d'erreur
 */
export default function EditRequest() {
    // -------------------------------------------------------------------------
    // HOOKS ET ÉTAT
    // -------------------------------------------------------------------------

    // Récupération de l'ID de la demande depuis l'URL
    const { id } = useParams();

    // Hook de navigation
    const navigate = useNavigate();

    // Données du formulaire
    const [formData, setFormData] = useState({
        title: '',
        type: 'ACADEMIC',
        description: ''
    });

    // États de chargement
    const [loading, setLoading] = useState(true);   // Chargement initial
    const [saving, setSaving] = useState(false);    // Sauvegarde en cours

    // Message d'erreur
    const [error, setError] = useState(null);

    // Indicateur de modification possible
    const [canEdit, setCanEdit] = useState(false);

    // -------------------------------------------------------------------------
    // EFFET: CHARGEMENT DE LA DEMANDE
    // -------------------------------------------------------------------------

    /**
     * Effet pour charger les données de la demande au montage du composant.
     */
    useEffect(() => {
        const fetchRequest = async () => {
            try {
                // Récupérer les détails de la demande
                const response = await api.getRequest(id);
                const request = response.data;

                // Vérifier si la modification est autorisée
                setCanEdit(request.can_edit);

                if (!request.can_edit) {
                    // Si non modifiable, afficher un message d'erreur
                    setError('Cette demande ne peut plus être modifiée.');
                }

                // Pré-remplir le formulaire avec les valeurs actuelles
                setFormData({
                    title: request.title,
                    type: request.type,
                    description: request.description
                });
            } catch (err) {
                // Gérer les erreurs (403: Non autorisé, 404: Non trouvée)
                setError(
                    err.response?.status === 403 ? 'Non autorisé.' :
                        err.response?.status === 404 ? 'Non trouvée.' :
                            'Erreur.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    // -------------------------------------------------------------------------
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // -------------------------------------------------------------------------

    /**
     * Gère les changements dans les champs du formulaire.
     */
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /**
     * Gère la soumission du formulaire de modification.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Vérifier que tous les champs sont remplis
        if (!formData.title || !formData.description) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        // Validation: Vérifier la longueur minimale du titre
        if (formData.title.length < 5) {
            setError('Le titre doit contenir au moins 5 caractères.');
            return;
        }

        // Validation: Vérifier la longueur minimale de la description
        if (formData.description.length < 20) {
            setError('La description doit contenir au moins 20 caractères.');
            return;
        }

        // Sauvegarder les modifications
        setSaving(true);
        try {
            await api.updateRequest(id, formData);
            // Rediriger vers le détail avec un message de succès
            navigate(`/requests/${id}`, {
                state: { message: 'Demande modifiée!' }
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur.');
        } finally {
            setSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // RENDU: ÉTAT DE CHARGEMENT
    // -------------------------------------------------------------------------

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Chargement...</p>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDU: MODIFICATION NON AUTORISÉE
    // -------------------------------------------------------------------------

    if (!canEdit) {
        return (
            <div className="form-container">
                <div className="form-card card blocked-state">
                    <span>🔒</span>
                    <h3>Modification impossible</h3>
                    <p>{error}</p>
                    <Link to={`/requests/${id}`} className="btn btn-primary">
                        Voir la demande
                    </Link>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDU: FORMULAIRE DE MODIFICATION
    // -------------------------------------------------------------------------

    return (
        <div className="form-container">
            <div className="form-card card animate-in">
                {/* En-tête du formulaire */}
                <div className="form-header">
                    <Link to={`/requests/${id}`} className="back-link">
                        ← Retour à la demande
                    </Link>
                    <h1><span>✏️</span> Modifier la demande</h1>
                </div>

                {/* Message d'erreur (si présent) */}
                {error && (
                    <div className="form-error">
                        <span>⚠️</span>{error}
                    </div>
                )}

                {/* Formulaire de modification */}
                <form onSubmit={handleSubmit} className="request-form" noValidate>
                    {/* Champ titre */}
                    <div className="form-group">
                        <label className="label">Titre</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            required
                            minLength={5}
                        />
                    </div>

                    {/* Sélection du type */}
                    <div className="form-group">
                        <label className="label">Type</label>
                        <div className="type-grid">
                            {REQUEST_TYPES.map(t => (
                                <label
                                    key={t.value}
                                    className={`type-option ${formData.type === t.value ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t.value}
                                        checked={formData.type === t.value}
                                        onChange={handleChange}
                                    />
                                    <span className="type-icon">{t.icon}</span>
                                    <strong>{t.label}</strong>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Champ description */}
                    <div className="form-group">
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input"
                            required
                            minLength={20}
                            rows={6}
                        />
                    </div>

                    {/* Boutons d'action */}
                    <div className="form-actions">
                        <Link to={`/requests/${id}`} className="btn btn-secondary">
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
