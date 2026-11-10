/**
 * Page de connexion securisee pour UQO-Requests.
 * Restreinte exclusivement aux adresses institutionnelles @uqo.ca.
 * Concue avec Tailwind CSS, Framer Motion et React Icons.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiMail, 
    FiLock, 
    FiEye, 
    FiEyeOff, 
    FiShield, 
    FiAlertCircle, 
    FiArrowRight 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import RobustButton from '../components/RobustButton';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login, error, setError, isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            setError('Veuillez renseigner votre adresse institutionnelle et votre mot de passe.');
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.endsWith('@uqo.ca')) {
            setError('Accès restreint : Seules les adresses institutionnelles se terminant par @uqo.ca sont autorisées.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await login(cleanEmail, password);
        setLoading(false);

        if (result.success) {
            navigate(from || (isManager ? '/manager' : '/dashboard'), { replace: true });
        }
    };

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 space-y-6"
            >
                {/* Header Institutionnel */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-2xl bg-uqo-50 dark:bg-uqo-dark border border-uqo-200 dark:border-uqo-800/60 shadow-2xs mb-1">
                        <img alt="Logo officiel UQO" src="/logos/uqo-symbol-blue.svg" className="h-8 w-auto object-contain dark:hidden" />
                        <img alt="Logo officiel UQO" src="/logos/uqo-symbol-white.svg" className="h-8 w-auto object-contain hidden dark:inline" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Connexion au portail
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Accédez à votre espace sécurisé UQO-Requests
                    </p>
                </div>

                {/* Bannière de Sécurité & Restriction */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <FiShield className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400 shrink-0" />
                    <span>Connexion chiffrée TLS 1.3 • Domaine @uqo.ca</span>
                </div>

                {/* Message d'Erreur */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200"
                    >
                        <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                {/* Formulaire de Connexion */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Courriel institutionnel UQO *
                        </label>
                        <div className="relative">
                            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="prenom.nom@uqo.ca"
                                required
                                autoFocus
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-uqo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Mot de passe *
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-uqo-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <RobustButton
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={loading}
                        loadingText="Vérification sécurisée..."
                        icon={FiArrowRight}
                        iconPosition="right"
                        className="w-full"
                    >
                        Se connecter
                    </RobustButton>
                </form>

                {/* Lien Inscription */}
                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <span>Nouveau sur la plateforme ? </span>
                    <Link
                        to="/register"
                        className="font-semibold text-uqo-600 hover:text-uqo-700 dark:text-uqo-accent-400 dark:hover:underline"
                    >
                        Créer un compte étudiant
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
