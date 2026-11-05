/**
 * Page de création de demande de l'application UQO-Requests.
 * 
 * Cette page permet aux utilisateurs de soumettre une nouvelle demande
 * en remplissant un formulaire avec titre, type et description.
 * 
 * Fonctionnalités:
 * - Formulaire avec validation
 * - Sélection du type de demande avec icônes
 * - Indicateurs de longueur minimale
 * - Redirection vers le détail après création
 * - Gestion des erreurs de validation
 * 
 * @author UQO
 * @version 1.0.0
 */

// Importation des hooks React
import { useState } from 'react';

// Importation des composants de routage
import { useNavigate, Link } from 'react-router-dom';

// Importation du client API
import { api } from '../api/client';

// Importation des styles CSS
import './RequestForm.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration des types de demandes disponibles.
 * Chaque type a une valeur, un label, une icône et une description.
 */
const REQUEST_TYPES = [
    { value: 'ACADEMIC', label: 'Académique', icon: '🎓', desc: 'Notes, examens, cours' },
    { value: 'ADMINISTRATIVE', label: 'Administrative', icon: '📁', desc: 'Documents, attestations' },
    { value: 'TECHNICAL', label: 'Technique', icon: '💻', desc: 'Accès, équipements' },
    { value: 'OTHER', label: 'Autre', icon: '📌', desc: 'Autres demandes' },
];

// ============================================================================
// COMPOSANT
// ============================================================================

/**
 * Composant CreateRequest - Formulaire de création de demande.
 * 
 * @returns {JSX.Element} Le formulaire de création
 */
export default function CreateRequest() {
    // -------------------------------------------------------------------------
    // ÉTAT LOCAL
    // -------------------------------------------------------------------------

    // Données du formulaire
    const [formData, setFormData] = useState({
        title: '',           // Titre de la demande
        type: 'ACADEMIC',    // Type de demande (par défaut: Académique)
        description: ''      // Description détaillée
    });

    // État de chargement (pendant la soumission)
    const [loading, setLoading] = useState(false);

    // Message d'erreur
    const [error, setError] = useState(null);

    // Hook de navigation
    const navigate = useNavigate();

    // -------------------------------------------------------------------------
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // -------------------------------------------------------------------------

    /**
     * Gère les changements dans les champs du formulaire.
     * 
     * @param {Event} e - L'événement de changement
     */
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);  // Effacer les erreurs précédentes
    };

    /**
     * Gère la soumission du formulaire.
     * Valide les données puis envoie la requête à l'API.
     * 
     * @param {Event} e - L'événement de soumission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Vérifier que le titre et la description sont remplis
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

        // Soumettre la demande
        setLoading(true);
        try {
            const response = await api.createRequest(formData);
            // Rediriger vers le détail de la demande créée avec un message de succès
            navigate(`/requests/${response.data.id}`, {
                state: { message: 'Demande créée avec succès!' }
            });
        } catch (err) {
            // Extraire le message d'erreur de la réponse API
            setError(
                err.response?.data?.title?.[0] ||
                err.response?.data?.description?.[0] ||
                err.response?.data?.detail ||
                'Erreur lors de la création'
            );
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // RENDU
    // -------------------------------------------------------------------------

    return (
        <div className="form-container">
            <div className="form-card card animate-in">
                {/* En-tête du formulaire */}
                <div className="form-header">
                    {/* Lien de retour */}
                    <Link to="/dashboard" className="back-link">
                        ← Retour au tableau de bord
                    </Link>
                    <h1><span>📝</span> Nouvelle demande</h1>
                    <p>Remplissez le formulaire ci-dessous pour soumettre une nouvelle demande</p>
                </div>

                {/* Message d'erreur (si présent) */}
                {error && (
                    <div className="form-error">
                        <span>⚠️</span>{error}
                    </div>
                )}

                {/* Formulaire de création */}
                <form onSubmit={handleSubmit} className="request-form" noValidate>
                    {/* Champ titre */}
                    <div className="form-group">
                        <label className="label">Titre de la demande</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input"
                            placeholder="Ex: Demande de report d'examen"
                            required
                            minLength={5}
                        />
                        <span className="hint">Minimum 5 caractères</span>
                    </div>

                    {/* Sélection du type de demande */}
                    <div className="form-group">
                        <label className="label">Type de demande</label>
                        <div className="type-grid">
                            {REQUEST_TYPES.map(type => (
                                <label
                                    key={type.value}
                                    className={`type-option ${formData.type === type.value ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.value}
                                        checked={formData.type === type.value}
                                        onChange={handleChange}
                                    />
                                    <span className="type-icon">{type.icon}</span>
                                    <div>
                                        <strong>{type.label}</strong>
                                        <span>{type.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Champ description */}
                    <div className="form-group">
                        <label className="label">Description détaillée</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input"
                            placeholder="Décrivez votre demande en détail..."
                            required
                            minLength={20}
                            rows={6}
                        />
                        <span className="hint">
                            Minimum 20 caractères. Soyez aussi précis que possible.
                        </span>
                    </div>

                    {/* Boutons d'action */}
                    <div className="form-actions">
                        <Link to="/dashboard" className="btn btn-secondary">
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Envoi...' : '📤 Soumettre la demande'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
