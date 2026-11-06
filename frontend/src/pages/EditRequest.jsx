/**
 * Page de modification de requete pour UQO-Requests.
 * Reservee aux requetes en statut SUBMITTED, avec validation,
 * protection anti-double clic via RobustButton et notifications toast.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FiArrowLeft, 
    FiSave, 
    FiFolder, 
    FiMonitor, 
    FiTag, 
    FiAlertCircle, 
    FiLock 
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { api, getSafeApiErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { cn } from '../utils/cn';
import RobustButton from '../components/RobustButton';
import { useToast } from '../context/ToastContext';

const REQUEST_TYPES = [
    { value: 'ACADEMIC', label: 'Académique', Icon: HiOutlineAcademicCap, desc: 'Évaluation, reprise d\'examen, cours' },
    { value: 'ADMINISTRATIVE', label: 'Administrative', Icon: FiFolder, desc: 'Relevé de notes, attestations' },
    { value: 'TECHNICAL', label: 'Technique', Icon: FiMonitor, desc: 'Accès portail, courriel étudiant' },
    { value: 'OTHER', label: 'Autre requête', Icon: FiTag, desc: 'Renseignements généraux ou divers' },
];

export default function EditRequest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        type: 'ACADEMIC',
        description: '',
    });

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.getRequest(id);
                const data = response.data;
                setRequest(data);
                setCanEdit(Boolean(data?.can_edit));

                if (!data?.can_edit) {
                    setError('Cette requête est déjà prise en charge ou clôturée et ne peut plus être modifiée.');
                } else {
                    setFormData({
                        title: data.title || '',
                        type: data.type || 'ACADEMIC',
                        description: data.description || '',
                    });
                }
            } catch (err) {
                setError(getSafeApiErrorMessage(err, 'Impossible de charger les données de la requête demandée.'));
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const isTitleValid = formData.title.trim().length >= 5;
    const isDescValid = formData.description.trim().length >= 20;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canEdit) return;

        if (!isTitleValid || !isDescValid) {
            setError('Veuillez respecter les critères de longueur minimale (titre 5 car., description 20 car.).');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await api.updateRequest(id, {
                title: formData.title.trim(),
                type: formData.type,
                description: formData.description.trim(),
            });

            showToast({
                type: 'success',
                title: 'Modifications sauvegardées',
                message: 'Les modifications ont été validées avec succès.',
            });

            navigate(`/requests/${id}`, {
                state: { message: 'Les modifications ont été enregistrées avec succès.' }
            });
        } catch (err) {
            setError(getSafeApiErrorMessage(err, "Impossible d'enregistrer les modifications."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500">Chargement sécurisé de la requête...</p>
            </div>
        );
    }

    if (!canEdit) {
        return (
            <div className="max-w-xl mx-auto py-12 text-center">
                <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                        <FiLock className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Modification non autorisée
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Cette requête a déjà été prise en charge ou clôturée par les services universitaires. Les modifications directes sont verrouillées pour préserver l'intégrité du dossier.
                    </p>
                    <div className="pt-2">
                        <Link
                            to={`/requests/${id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            <span>Retourner à la consultation</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-4">
            <Link
                to={`/requests/${id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-6 transition-colors"
            >
                <FiArrowLeft className="w-4 h-4" />
                <span>Retour au dossier</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 space-y-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Modifier la requête #{id}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Ajustez l'objet ou les détails tant que le dossier n'a pas encore été traité.
                        </p>
                    </div>
                    {request?.status && <StatusBadge status={request.status} />}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200"
                    >
                        <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Titre */}
                    <div>
                        <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Objet / Titre de la requête *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
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
                                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {type.label}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                                Description détaillée *
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
                            required
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Actions Robustes */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <Link
                            to={`/requests/${id}`}
                            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </Link>
                        <RobustButton
                            type="submit"
                            variant="primary"
                            loading={saving}
                            loadingText="Enregistrement sécurisé..."
                            disabled={!isTitleValid || !isDescValid}
                            icon={FiSave}
                        >
                            Sauvegarder les modifications
                        </RobustButton>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
