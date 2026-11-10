/**
 * Page d'inscription securisee pour UQO-Requests.
 * Restreinte exclusivement aux adresses @uqo.ca avec checklist
 * cryptographique de complexite de mot de passe en temps reel.
 * Concue avec Tailwind CSS, Framer Motion et React Icons.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiMail, 
    FiLock, 
    FiUser, 
    FiEye, 
    FiEyeOff, 
    FiShield, 
    FiCheck, 
    FiX, 
    FiAlertCircle, 
    FiArrowRight,
    FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RobustButton from '../components/RobustButton';
import { cn } from '../utils/cn';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, error, setError } = useAuth();
    const navigate = useNavigate();

    // Verification en temps reel des regles de complexite du mot de passe
    const passwordChecks = {
        length: formData.password.length >= 10,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        digit: /[0-9]/.test(formData.password),
        symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password),
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = formData.password && formData.password === formData.password_confirm;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
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
            setError('Veuillez remplir l\'ensemble des champs obligatoires.');
            return;
        }

        // Validation stricte du domaine institutionnel @uqo.ca
        const uqoEmailRegex = /^[a-zA-Z0-9_.+-]+@uqo\.ca$/;
        if (!cleanEmail.endsWith('@uqo.ca') || !uqoEmailRegex.test(cleanEmail)) {
            setError('Accès restreint : Seules les adresses institutionnelles se terminant par @uqo.ca sont autorisées.');
            return;
        }

        if (formData.password !== formData.password_confirm) {
            setError('Les deux mots de passe saisis ne sont pas identiques.');
            return;
        }

        if (!isPasswordValid) {
            setError('Le mot de passe doit satisfaire à toutes les exigences de sécurité indiquées.');
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
            }, 2500);
        }
    };

    if (success) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md rounded-3xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 p-8 text-center space-y-4 shadow-lg"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <FiCheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Compte créé avec succès !
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Votre profil institutionnel a été enregistré. Vous allez être automatiquement redirigé vers l'écran de connexion...
                    </p>
                    <div className="pt-2">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
                        >
                            <span>Se connecter immédiatement</span>
                            <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 space-y-6"
            >
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-2xl bg-uqo-50 dark:bg-uqo-dark border border-uqo-200 dark:border-uqo-800/60 shadow-2xs mb-1">
                        <img alt="Logo officiel UQO" src="/logos/uqo-symbol-blue.svg" className="h-8 w-auto object-contain dark:hidden" />
                        <img alt="Logo officiel UQO" src="/logos/uqo-symbol-white.svg" className="h-8 w-auto object-contain hidden dark:inline" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Inscription étudiante
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Créez votre compte pour soumettre et suivre vos requêtes académiques
                    </p>
                </div>

                {/* Bannière de Sécurité */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <FiShield className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400 shrink-0" />
                    <span>Adresses institutionnelles @uqo.ca obligatoires</span>
                </div>

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

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Nom & Prénom en 2 colonnes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Prénom *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Jean"
                                required
                                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Nom de famille *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Tremblay"
                                required
                                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Identifiant & Courriel */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            Nom d'utilisateur / Code permanent *
                        </label>
                        <div className="relative">
                            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="trej01"
                                required
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            Courriel UQO officiel *
                        </label>
                        <div className="relative">
                            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="jean.tremblay@uqo.ca"
                                required
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Mots de passe */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Mot de passe *
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••••"
                                    required
                                    className="w-full pl-10 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Confirmation *
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password_confirm"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    placeholder="••••••••••"
                                    required
                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Checklist en Direct de Securite du Mot de Passe */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Normes de complexité du mot de passe :
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <span className={cn('flex items-center gap-1', passwordChecks.length ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordChecks.length ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                10 caractères min.
                            </span>
                            <span className={cn('flex items-center gap-1', passwordChecks.upper ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordChecks.upper ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                1 majuscule
                            </span>
                            <span className={cn('flex items-center gap-1', passwordChecks.lower ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordChecks.lower ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                1 minuscule
                            </span>
                            <span className={cn('flex items-center gap-1', passwordChecks.digit ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordChecks.digit ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                1 chiffre
                            </span>
                            <span className={cn('flex items-center gap-1', passwordChecks.symbol ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordChecks.symbol ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                1 caractère spécial
                            </span>
                            <span className={cn('flex items-center gap-1', passwordsMatch ? 'text-emerald-600 font-medium' : 'text-slate-400')}>
                                {passwordsMatch ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                Mots de passe identiques
                            </span>
                        </div>
                    </div>

                    <RobustButton
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={loading}
                        loadingText="Création sécurisée du compte..."
                        disabled={!isPasswordValid || !passwordsMatch}
                        icon={FiArrowRight}
                        iconPosition="right"
                        className="w-full"
                    >
                        Créer mon compte institutionnel
                    </RobustButton>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <span>Déjà inscrit ? </span>
                    <Link
                        to="/login"
                        className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:underline"
                    >
                        Se connecter
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
