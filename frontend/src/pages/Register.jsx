/**
 * Page d'inscription de l'application UQO-Requests.
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

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.first_name.trim() ||
            !formData.last_name.trim() ||
            !formData.email.trim() ||
            !formData.username.trim() ||
            !formData.password ||
            !formData.password_confirm
        ) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (formData.password !== formData.password_confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await register({
            email: formData.email.trim(),
            username: formData.username.trim(),
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
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
                        <h1>Compte créé avec succès !</h1>
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
                    <h1>Inscription</h1>
                    <p>Rejoignez la plateforme UQO-Requests</p>
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
                                placeholder="Dupont"
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
                            placeholder="jdupont"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="label">Adresse email UQO</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            placeholder="jean.dupont@uqo.ca"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="label">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="Au moins 8 caractères"
                            required
                        />
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
                            placeholder="••••••••"
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
                        ) : "S'inscrire"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
                </div>
            </div>
        </div>
    );
}
