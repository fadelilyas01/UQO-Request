/**
 * Page d'accueil professionnelle pour la plateforme UQO-Requests.
 * Concue avec Tailwind CSS, Framer Motion et React Icons,
 * respectant la charte graphique de l'Universite du Quebec en Outaouais.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiArrowRight, 
    FiShield, 
    FiZap, 
    FiClock, 
    FiCheckCircle, 
    FiFileText, 
    FiLock,
    FiUserCheck,
    FiLayers
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
    },
};

export default function Home() {
    const { isAuthenticated, isManager } = useAuth();

    return (
        <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
            {/* Section Hero */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative text-center max-w-4xl mx-auto px-4"
            >
                {/* Badge Institutionnel */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-uqo-600/30 bg-uqo-50/80 dark:bg-uqo-dark/80 text-uqo-700 dark:text-uqo-accent-300 text-xs font-semibold mb-6 shadow-2xs backdrop-blur-xs">
                    <img alt="Symbole officiel UQO" src="/logos/uqo-symbol-blue.svg" className="h-4 w-auto object-contain dark:hidden" />
                    <img alt="Symbole officiel UQO" src="/logos/uqo-symbol-white.svg" className="h-4 w-auto object-contain hidden dark:inline" />
                    <span>Portail officiel de gestion des requêtes • UQO</span>
                </motion.div>

                {/* Titre Principal */}
                <motion.h1 
                    variants={itemVariants}
                    className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
                >
                    Simplifiez vos requêtes académiques & administratives
                </motion.h1>

                {/* Sous-titre */}
                <motion.p 
                    variants={itemVariants}
                    className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
                >
                    La plateforme numérique sécurisée de l'Université du Québec en Outaouais pour transmettre, instruire et suivre toutes vos demandes en toute transparence.
                </motion.p>

                {/* Boutons d'Action Principaux */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                    {isAuthenticated ? (
                        <Link
                            to={isManager ? "/manager" : "/dashboard"}
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-uqo-600 hover:bg-uqo-700 active:bg-uqo-800 shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500 focus-visible:ring-offset-2"
                        >
                            <span>Accéder à mon espace</span>
                            <FiArrowRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-uqo-600 hover:bg-uqo-700 active:bg-uqo-800 shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500 focus-visible:ring-offset-2"
                            >
                                <span>Connexion étudiante & personnel</span>
                                <FiArrowRight className="w-5 h-5" />
                            </Link>

                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                <span>Créer un compte</span>
                            </Link>
                        </>
                    )}
                </motion.div>

                {/* Indicateurs de Confiance & Sécurité */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 dark:text-slate-400 font-medium"
                >
                    <span className="flex items-center gap-1.5">
                        <FiShield className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400" />
                        <span>Chiffrement certifié TLS 1.3</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <FiUserCheck className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400" />
                        <span>Contrôle d'accès RBAC renforcé</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400" />
                        <span>Conforme Loi 25 (Québec)</span>
                    </span>
                </motion.div>
            </motion.section>

            {/* Grille des Piliers du Service */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        Conçu pour l'excellence opérationnelle universitaire
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Chaque aspect du traitement des requêtes a été standardisé pour réduire les délais et fiabiliser la prise en charge.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {/* Carte 1 */}
                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-uqo-50 dark:bg-uqo-dark text-uqo-600 dark:text-uqo-accent-400 flex items-center justify-center mb-5 ring-1 ring-uqo-500/20">
                            <FiZap className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Traitement Structuré & Rapide
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Formulaires guidés éliminant les pièces manquantes et transmission directe aux départements académiques concernés.
                        </p>
                    </div>

                    {/* Carte 2 */}
                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5 ring-1 ring-sky-500/20">
                            <FiClock className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Traçabilité & Historique Complet
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Suivi précis de chaque étape : soumission, examen par le gestionnaire, demandes de précisions et décision finale motivée.
                        </p>
                    </div>

                    {/* Carte 3 */}
                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 ring-1 ring-teal-500/20">
                            <FiShield className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Sécurité & Données Protégées
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Vos renseignements personnels académiques sont isolés et protégés par les protocoles cryptographiques les plus stricts.
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Étape par Étape */}
            <section className="max-w-7xl mx-auto px-4 py-8">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-8 sm:p-12">
                    <div className="max-w-2xl mx-auto text-center mb-10">
                        <span className="text-xs font-bold uppercase tracking-wider text-uqo-600 dark:text-uqo-accent-400 block mb-1">
                            Cycle de vie d'une requête
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                            Comment se déroule votre demande ?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-uqo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                1
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                Soumission en ligne
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                                Remplissez le formulaire typé (Académique, Administratif, Technique) avec les détails requis.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-uqo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                2
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                Examen & Traitement
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                                Les gestionnaires habilités étudient la requête et échangent au besoin par commentaires horodatés.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-uqo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                3
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                Résolution Officielle
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                                Clôture avec notification par courriel et archivage conforme aux règlements de l'UQO.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
