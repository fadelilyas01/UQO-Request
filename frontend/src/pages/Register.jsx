/**
 * Page d'inscription de l'application UQO-Requests.
 * Restreinte exclusivement aux adresses courriel institutionnelles @uqo.ca
 * avec contrainte renforcée de complexité du mot de passe.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, error, setError } = useAuth();
    const navigate = useNavigate();

    // Vérification en temps réel des règles de complexité du mot de passe
    const passwordChecks = {
        length: formData.password.length >= 10,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        digit: /[0-9]/.test(formData.password),
        symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password),
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanEmail = formData.email.trim().toLowerCase();
        const cleanUsername = formData.username.trim();
        const cleanFirstName = formData.first_name.trim();
        const cleanLastName = formData.last_name.trim();

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanEmail ||
            !cleanUsername ||
            !formData.password ||
            !formData.password_confirm
        ) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        // 1. Validation stricte du domaine institutionnel @uqo.ca
        const uqoEmailRegex = /^[a-zA-Z0-9_.+-]+@uqo\.ca$/;
        if (!cleanEmail.endsWith('@uqo.ca') || !uqoEmailRegex.test(cleanEmail)) {
            setError('Accès restreint : Seules les adresses institutionnelles se terminant par @uqo.ca sont autorisées.');
            return;
        }

        // 2. Validation stricte de concordance des mots de passe
        if (formData.password !== formData.password_confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        // 3. Validation de complexité du mot de passe
        if (!isPasswordValid) {
            setError('Le mot de passe ne respecte pas les critères de sécurité exigés (minimum 10 caractères, majuscule, minuscule, chiffre et symbole).');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await register({
            email: cleanEmail,
            username: cleanUsername,
            first_name: cleanFirstName,
            last_name: cleanLastName,
            password: formData.password,
            password_confirm: formData.password_confirm,
        });

        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="simple-bg-layer"></div>
                <div className="auth-card card animate-scale">
                    <div className="auth-header">
                        <span className="auth-icon">✅</span>
                        <h1>Compte étudiant créé avec succès !</h1>
                        <p>Redirection vers la page de connexion...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="simple-bg-layer"></div>

            <div className="auth-card card animate-in">
                <div className="auth-header">
                    <span className="auth-icon">📝</span>
                    <h1>Inscription Étudiant</h1>
                    <p>Rejoignez la plateforme officielle UQO-Requests</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name" className="label">Prénom</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Jean"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name" className="label">Nom</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Tremblay"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username" className="label">Nom d'utilisateur</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input"
                            placeholder="jtremblay01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="label">Adresse courriel institutionnelle UQO</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            placeholder="prenom.nom@uqo.ca"
                            required
                        />
                        <span className="auth-hint">Seules les adresses se terminant par @uqo.ca sont acceptées.</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="label">Mot de passe complexe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="••••••••••••"
                            required
                        />

                        {/* Indicateur visuel des critères de mot de passe */}
                        <div className="password-rules">
                            <div className="password-rules-title">Exigences de sécurité du mot de passe :</div>
                            <div className={`password-rule-item ${passwordChecks.length ? 'valid' : ''}`}>
                                <span>{passwordChecks.length ? '✓' : '○'}</span> Au moins 10 caractères
                            </div>
                            <div className={`password-rule-item ${passwordChecks.upper ? 'valid' : ''}`}>
                                <span>{passwordChecks.upper ? '✓' : '○'}</span> Au moins une lettre majuscule (A-Z)
                            </div>
                            <div className={`password-rule-item ${passwordChecks.lower ? 'valid' : ''}`}>
                                <span>{passwordChecks.lower ? '✓' : '○'}</span> Au moins une lettre minuscule (a-z)
                            </div>
                            <div className={`password-rule-item ${passwordChecks.digit ? 'valid' : ''}`}>
                                <span>{passwordChecks.digit ? '✓' : '○'}</span> Au moins un chiffre (0-9)
                            </div>
                            <div className={`password-rule-item ${passwordChecks.symbol ? 'valid' : ''}`}>
                                <span>{passwordChecks.symbol ? '✓' : '○'}</span> Au moins un caractère spécial (!@#$%^&*...)
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password_confirm" className="label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            id="password_confirm"
                            name="password_confirm"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            className="input"
                            placeholder="••••••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Inscription en cours...
                            </>
                        ) : "Créer mon compte étudiant"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
                </div>
            </div>
        </div>
    );
}
