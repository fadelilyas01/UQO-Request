/**
 * Page de creation de requete professionnelle pour UQO-Requests.
 * Integre validation en direct, protection anti-double clic via RobustButton,
 * sauvegarde automatique de brouillons (Auto-Save Draft), pieces jointes securisees
 * et retours toast.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiFileText, 
    FiFolder, 
    FiMonitor, 
    FiTag, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiShield,
    FiPaperclip,
    FiTrash2,
    FiFile,
    FiRotateCcw
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { api, getSafeApiErrorMessage } from '../api/client';
import { cn } from '../utils/cn';
import { safeStorage, safeJsonParse } from '../utils/safeUtils';
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

const DRAFT_STORAGE_KEY = 'uqo_request_draft';

export default function CreateRequest() {
    const [formData, setFormData] = useState(() => {
        const savedDraft = safeJsonParse(safeStorage.getItem(DRAFT_STORAGE_KEY));
        return savedDraft || {
            title: '',
            type: 'ACADEMIC',
            description: '',
        };
    });

    const [hasDraftRestored, setHasDraftRestored] = useState(() => {
        return Boolean(safeStorage.getItem(DRAFT_STORAGE_KEY));
    });

    const [lastSavedTime, setLastSavedTime] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();
    const { showToast } = useToast();

    // Sauvegarde automatique du brouillon avec debouncing
    useEffect(() => {
        if (!formData.title && !formData.description) return;

        const timer = setTimeout(() => {
            safeStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
            const now = new Date();
            setLastSavedTime(
                now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
        }, 500);

        return () => clearTimeout(timer);
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleClearDraft = () => {
        safeStorage.removeItem(DRAFT_STORAGE_KEY);
        setFormData({
            title: '',
            type: 'ACADEMIC',
            description: '',
        });
        setHasDraftRestored(false);
        setLastSavedTime(null);
        showToast({
            type: 'info',
            title: 'Brouillon réinitialisé',
            message: 'Le formulaire a été remis à zéro.',
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setFileError(null);
        if (!file) return;

        // Validation taille (5 Mo max)
        if (file.size > 5 * 1024 * 1024) {
            setFileError("Le fichier dépasse la limite autorisée de 5 Mo.");
            return;
        }

        // Validation format
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setFileError("Format non supporté. Formats acceptés : PDF, PNG, JPG, WEBP.");
            return;
        }

        setAttachment(file);
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
            // 1. Création de la demande
            const response = await api.createRequest({
                title: formData.title.trim(),
                type: formData.type,
                description: formData.description.trim(),
            });

            const createdId = response.data.id;

            // 2. Téléversement de la pièce jointe si présente
            if (attachment) {
                try {
                    const uploadData = new FormData();
                    uploadData.append('file', attachment);
                    await api.uploadAttachment(createdId, uploadData);
                } catch (uploadErr) {
                    console.error('[CreateRequest] Erreur lors du téléversement du justificatif:', uploadErr);
                    showToast({
                        type: 'warning',
                        title: 'Justificatif non téléversé',
                        message: 'La requête a été créée, mais la pièce jointe n\'a pu être ajoutée. Vous pouvez l\'ajouter depuis le dossier.',
                    });
                }
            }

            // Purge du brouillon
            safeStorage.removeItem(DRAFT_STORAGE_KEY);

            showToast({
                type: 'success',
                title: 'Requête transmise avec succès',
                message: 'Votre dossier a été enregistré et assigné aux services compétents.',
            });

            navigate(`/requests/${createdId}`, {
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
                <div className="pb-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-uqo-50 dark:bg-uqo-dark text-uqo-700 dark:text-uqo-accent-300 text-xs font-semibold mb-2 ring-1 ring-uqo-500/20">
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

                    {/* Indicateur de Brouillon Automatique */}
                    {lastSavedTime && (
                        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-uqo-accent-500 animate-pulse" />
                            <span>Brouillon sauvé à {lastSavedTime}</span>
                        </div>
                    )}
                </div>

                {/* Bannière de Restauration de Brouillon */}
                {hasDraftRestored && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-2">
                            <FiRotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Votre brouillon précédent a été automatiquement restauré.</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearDraft}
                            className="font-semibold underline hover:text-amber-700 dark:hover:text-amber-100 cursor-pointer"
                        >
                            Réinitialiser
                        </button>
                    </div>
                )}

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
                                formData.description.length < 20 ? 'text-slate-400' : 'text-uqo-600 dark:text-uqo-accent-400 font-medium'
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
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-uqo-500"
                        />
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                            <FiCheckCircle className="w-3.5 h-3.5 text-uqo-accent-500" />
                            <span>Les renseignements transmis sont traités confidentiellement selon la Loi 25.</span>
                        </p>
                    </div>

                    {/* Pièce Justificative (Optionnelle) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                            Pièce justificative (Optionnel)
                        </label>

                        {attachment ? (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-uqo-600/30 bg-uqo-50/50 dark:bg-uqo-dark text-xs">
                                <div className="flex items-center gap-2.5 truncate">
                                    <FiFile className="w-5 h-5 text-uqo-600 dark:text-uqo-accent-400 shrink-0" />
                                    <div className="truncate">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                                            {attachment.name}
                                        </p>
                                        <p className="text-slate-400 font-mono text-[10px]">
                                            {(attachment.size / (1024 * 1024)).toFixed(2)} Mo
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAttachment(null)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Retirer ce document"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-uqo-500 dark:hover:border-uqo-accent-500 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                                <FiPaperclip className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Cliquer pour joindre un document justificatif
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    PDF, PNG, JPG ou WEBP jusqu'à 5 Mo.
                                </p>
                            </div>
                        )}

                        {fileError && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                                <FiAlertCircle className="w-3.5 h-3.5" />
                                <span>{fileError}</span>
                            </p>
                        )}
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
