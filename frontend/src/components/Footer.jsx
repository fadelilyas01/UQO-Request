/**
 * Pied de page officiel et securise pour l'application UQO-Requests.
 * Integre les normes institutionnelles de l'Universite du Quebec en Outaouais,
 * les exigences de conformite (Loi 25, accessibilite WCAG 2.2 AA)
 * et le statut de securite en temps reel.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiShield, 
    FiCheckCircle, 
    FiMail, 
    FiPhone, 
    FiMapPin, 
    FiExternalLink, 
    FiClock, 
    FiLock, 
    FiFileText,
    FiHelpCircle,
    FiAward
} from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-[#182128] text-slate-300 border-t border-slate-800 transition-colors duration-300 mt-auto">
            {/* Ruban Superieur : Statut Operationnel & Chiffrement de Securite */}
            <div className="border-b border-slate-800/80 bg-[#0f151a] py-3 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uqo-accent-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-uqo-accent-500"></span>
                        </span>
                        <span className="font-medium text-uqo-accent-400">
                            Tous les services sont opérationnels
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400 hidden sm:inline">
                            Portail sécurisé UQO (TLS 1.3 & Chiffrement de bout en bout)
                        </span>
                    </div>

                    <div className="flex items-center space-x-4 text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <FiShield className="text-uqo-accent-400 text-sm" />
                            <span>Conforme Loi 25 (Québec)</span>
                        </span>
                        <span className="hidden md:flex items-center gap-1.5">
                            <FiLock className="text-uqo-accent-400 text-sm" />
                            <span>Authentification JWT & RBAC</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Corps Principal du Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Colonne 1 & 2 : Marque & Identite Institutionnelle */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-uqo-accent-400 rounded-md">
                            <img alt="Emblème officiel de l'UQO" src="/logos/uqo-symbol-white.svg" className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                            <div>
                                <span className="text-lg font-black tracking-tight text-white block">
                                    UQO <span className="text-uqo-accent-400 font-bold">REQUESTS</span>
                                </span>
                                <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold block">
                                    Université du Québec en Outaouais
                                </span>
                            </div>
                        </Link>

                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                            Plateforme officielle et centralisée de gestion des requêtes académiques, administratives et techniques pour la communauté étudiante, le corps professoral et les gestionnaires de l'UQO.
                        </p>

                        <div className="pt-2 space-y-2 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <HiOutlineBuildingOffice2 className="text-uqo-accent-400 text-base shrink-0" />
                                <span>Réseau de l'Université du Québec (UQ)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiClock className="text-uqo-accent-400 text-base shrink-0" />
                                <span>Support informatique : Lundi au vendredi de 8h30 à 16h30</span>
                            </div>
                        </div>
                    </div>

                    {/* Colonne 3 : Navigation Rapide & Services */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4 flex items-center gap-2">
                            <FiFileText className="text-uqo-accent-400" />
                            <span>Services & Accès</span>
                        </h3>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to="/requests/new" className="text-slate-400 hover:text-white transition-colors duration-200">
                                    Nouvelle requête
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors duration-200">
                                    Suivi de mes demandes
                                </Link>
                            </li>
                            <li>
                                <a 
                                    href="https://uqo.ca/etudiants" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors duration-200"
                                >
                                    <span>Services aux étudiants</span>
                                    <FiExternalLink className="text-xs text-slate-500" />
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://uqo.ca/registrariat" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors duration-200"
                                >
                                    <span>Registrariat</span>
                                    <FiExternalLink className="text-xs text-slate-500" />
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://uqo.ca/decanat" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors duration-200"
                                >
                                    <span>Décanat des études</span>
                                    <FiExternalLink className="text-xs text-slate-500" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Colonne 4 : Campus de l'UQO */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4 flex items-center gap-2">
                            <FiMapPin className="text-uqo-accent-400" />
                            <span>Nos Campus</span>
                        </h3>
                        <div className="space-y-3.5 text-xs text-slate-400">
                            <div>
                                <p className="font-semibold text-slate-200">Campus de Gatineau</p>
                                <p>Pavillon Alexandre-Taché</p>
                                <p>283, boulevard Alexandre-Taché</p>
                                <p className="text-slate-500">Gatineau (Québec) J9A 1L8</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-200">Campus de Saint-Jérôme</p>
                                <p>5, rue Saint-Joseph</p>
                                <p className="text-slate-500">Saint-Jérôme (Québec) J7Z 0B7</p>
                            </div>
                            <div className="pt-1">
                                <a 
                                    href="tel:18195953900" 
                                    className="inline-flex items-center gap-1.5 text-uqo-accent-400 hover:underline"
                                >
                                    <FiPhone className="text-xs" />
                                    <span>819 595-3900 | 1 800 567-1283</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Colonne 5 : Securite, A11y & Support */}
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4 flex items-center gap-2">
                            <FiShield className="text-uqo-accent-400" />
                            <span>Sécurité & Support</span>
                        </h3>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <div className="text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded border border-slate-700/60 space-y-1">
                                    <p className="font-semibold text-slate-200 flex items-center gap-1">
                                        <FiAward className="text-uqo-accent-400" />
                                        <span>Conformité & Normes</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Protection des renseignements personnels conforme à la Loi 25 du Québec.
                                    </p>
                                </div>
                            </li>
                            <li>
                                <a 
                                    href="mailto:support-requests@uqo.ca" 
                                    className="text-slate-400 hover:text-white inline-flex items-center gap-1.5 text-xs transition-colors duration-200"
                                >
                                    <FiMail className="text-uqo-accent-400" />
                                    <span>support-requests@uqo.ca</span>
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://uqo.ca/politiques" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-xs transition-colors duration-200"
                                >
                                    <FiHelpCircle className="text-slate-500" />
                                    <span>Politiques de sécurité et d'usage</span>
                                    <FiExternalLink className="text-[10px] text-slate-500" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Ruban Inferieur : Mentions Legales & Droits Reserves */}
            <div className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p className="text-center md:text-left">
                        © {currentYear} <span className="text-slate-400 font-medium">Université du Québec en Outaouais</span>. Tous droits réservés.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <a 
                            href="https://uqo.ca/accessibilite" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-slate-300 transition-colors duration-200"
                        >
                            Accessibilité Web (WCAG 2.2 AA)
                        </a>
                        <a 
                            href="https://uqo.ca/vie-privee" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-slate-300 transition-colors duration-200"
                        >
                            Protection de la vie privée
                        </a>
                        <a 
                            href="https://uqo.ca/securite-information" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-slate-300 transition-colors duration-200"
                        >
                            Sécurité de l'information
                        </a>
                        <span className="text-slate-600 font-mono text-[11px]">v1.0.0 (Prod)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
