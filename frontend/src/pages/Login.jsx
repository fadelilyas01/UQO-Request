/**
 * Page de connexion de l'application UQO-Requests.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, error, setError, isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await login(email.trim(), password);
        setLoading(false);

        if (result.success) {
            navigate(from || (isManager ? '/manager' : '/dashboard'), { replace: true });
        }
    };

    return (
        <div className="auth-container">
            <div className="simple-bg-layer"></div>

            <div className="auth-card card animate-in">
                <div className="auth-header">
                    <span className="auth-icon">🔐</span>
                    <h1>Connexion</h1>
                    <p>Accédez à votre espace UQO-Requests</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="label">Adresse email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="nom.prenom@uqo.ca"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="label">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                                Connexion...
                            </>
                        ) : 'Se connecter'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
                </div>

            </div>
        </div>
    );
}
