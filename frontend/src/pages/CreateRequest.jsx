/**
 * Page de creation de requete professionnelle pour UQO-Requests.
 * Integre validation en direct, protection anti-double clic via RobustButton,
 * retours toast et gestion securisee des erreurs API.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiFileText, 
    FiFolder, 
    FiMonitor, 
    FiTag, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiShield 
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { api, getSafeApiErrorMessage } from '../api/client';
import { cn } from '../utils/cn';
import RobustButton from '../components/RobustButton';
import { useToast } from '../context/ToastContext';

const REQUEST_TYPES = [
    { 
        value: 'ACADEMIC', 
        label: 'Académique', 
        Icon: HiOutlineAcademicCap, 
        desc: 'Évaluation, reprise d\'examen, inscription aux cours' 
    },
    { 
        value: 'ADMINISTRATIVE', 
        label: 'Administrative', 
        Icon: FiFolder, 
        desc: 'Relevé de notes, attestation d\'études, formulaires officiels' 
    },
    { 
        value: 'TECHNICAL', 
        label: 'Technique', 
        Icon: FiMonitor, 
        desc: 'Accès portail, courriel étudiant, équipement de laboratoire' 
    },
    { 
        value: 'OTHER', 
        label: 'Autre requête', 
        Icon: FiTag, 
        desc: 'Renseignements généraux ou demande particulière' 
    },
];

export default function CreateRequest() {
    const [formData, setFormData] = useState({
        title: '',
        type: 'ACADEMIC',
        description: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const isTitleValid = formData.title.trim().length >= 5;
    const isDescValid = formData.description.trim().length >= 20;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Veuillez compléter l\'ensemble des champs obligatoires.');
            return;
        }

        if (!isTitleValid) {
            setError('Le titre doit comporter au minimum 5 caractères.');
            return;
        }

        if (!isDescValid) {
            setError('La description détaillée doit comporter au moins 20 caractères pour un traitement adéquat.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.createRequest({
                title: formData.title.trim(),
                type: formData.type,
                description: formData.description.trim(),
            });

            showToast({
                type: 'success',
                title: 'Requête transmise',
                message: 'Votre dossier a été enregistré et assigné aux services compétents.',
            });

            navigate(`/requests/${response.data.id}`, {
                state: { message: 'Votre requête a été transmise avec succès au service concerné.' }
            });
        } catch (err) {
            setError(getSafeApiErrorMessage(err, "Impossible d'enregistrer la requête. Veuillez vérifier votre connexion."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-6 transition-colors"
            >
                <FiArrowLeft className="w-4 h-4" />
                <span>Retour au tableau de bord</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 space-y-8"
            >
                {/* En-tete du Formulaire */}
                <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 ring-1 ring-emerald-500/20">
                        <FiShield className="w-3.5 h-3.5" />
                        <span>Transmission Directe & Chiffrée</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Déposer une nouvelle requête
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Précisez la nature de votre demande pour une prise en charge rapide par le personnel administratif.
                    </p>
                </div>

                {/* Message d'Erreur Sécurisé */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200"
                    >
                        <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <div className="space-y-1">
                            <span className="font-semibold block">Attention requise :</span>
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Titre */}
                    <div>
                        <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Objet / Titre explicite de la requête *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ex : Demande de révision de note - INF6003"
                            required
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex justify-between items-center mt-1.5 text-xs">
                            <span className="text-slate-400">Soyez concis et mentionnez le sigle du cours si applicable.</span>
                            <span className={cn(
                                formData.title.length < 5 ? 'text-slate-400' : 'text-emerald-600 font-medium'
                            )}>
                                {formData.title.length} / 5 car. min
                            </span>
                        </div>
                    </div>

                    {/* Type de Requête */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Catégorie administrative *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {REQUEST_TYPES.map((type) => {
                                const isSelected = formData.type === type.value;
                                const { Icon } = type;

                                return (
                                    <label
                                        key={type.value}
                                        className={cn(
                                            'relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150',
                                            isSelected
                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs'
                                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.value}
                                            checked={isSelected}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={cn(
                                            'p-2 rounded-lg shrink-0 mt-0.5',
                                            isSelected
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {type.label}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                {type.desc}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Description détaillée & Contexte *
                            </label>
                            <span className={cn(
                                'text-xs',
                                formData.description.length < 20 ? 'text-slate-400' : 'text-emerald-600 font-medium'
                            )}>
                                {formData.description.length} / 20 car. min
                            </span>
                        </div>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={6}
                            placeholder="Décrivez précisément votre situation, en incluant le sigle du cours, le groupe ou toute référence pertinente..."
                            required
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Les renseignements transmis sont traités confidentiellement selon la Loi 25.</span>
                        </p>
                    </div>

                    {/* Boutons d'Action Robustes */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <Link
                            to="/dashboard"
                            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </Link>
                        <RobustButton
                            type="submit"
                            variant="primary"
                            loading={loading}
                            loadingText="Transmission sécurisée en cours..."
                            disabled={!isTitleValid || !isDescValid}
                            icon={FiFileText}
                        >
                            Transmettre ma requête
                        </RobustButton>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
