/**
 * ErrorBoundary.jsx - Composant barrière d'interception d'erreurs (React Error Boundary).
 * Standard Zéro-Crash : élimine radicalement les écrans blancs (White Screen of Death)
 * en cas d'exception imprévue dans le cycle de rendu React.
 * Conforme au standard Senior UX Writing (Règle 7.7) et Zero-Divulgation (CWE-209).
 */

import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome, FiShield } from 'react-icons/fi';
import { RobustButton } from './RobustButton';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error, errorInfo) {
        // Journalisation sécurisée sans divulgation de secrets
        const safeError = {
            message: error?.message || 'Erreur inconnue',
            componentStack: errorInfo?.componentStack?.slice(0, 300) || '',
            timestamp: new Date().toISOString(),
        };

        console.error('[ErrorBoundary] Exception interceptée avec succès:', safeError);

        if (typeof this.props.onError === 'function') {
            try {
                this.props.onError(error, errorInfo);
            } catch {
                // Fail-safe
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (typeof this.props.onReset === 'function') {
            try {
                this.props.onReset();
            } catch {
                // Fail-safe
            }
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return typeof this.props.fallback === 'function'
                    ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
                    : this.props.fallback;
            }

            const isPageLevel = this.props.level === 'page';

            return (
                <div className={`flex flex-col items-center justify-center p-6 text-center ${isPageLevel ? 'min-h-[50vh] py-12' : 'py-8'}`}>
                    <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                        {/* Icône d'Alerte Sécurisée */}
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                            <FiAlertTriangle className="w-7 h-7" />
                        </div>

                        {/* Réponses aux 3 Questions UX Writing Senior */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {this.props.title || "Interruption temporaire d'affichage"}
                            </h2>

                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {this.props.message || "Une anomalie imprévue a été neutralisée par le système de sécurité pour protéger votre session."}
                            </p>

                            {/* Rassurance sur les données */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-left text-xs text-slate-600 dark:text-slate-300">
                                <FiShield className="w-4 h-4 text-uqo-600 dark:text-uqo-accent-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        Intégrité des données garantie :{' '}
                                    </span>
                                    <span>
                                        Vos requêtes et vos informations restent totalement intactes et sécurisées sur les serveurs institutionnels.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Immédiates de Rétablissement */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <RobustButton
                                variant="primary"
                                onClick={this.handleReset}
                                icon={FiRefreshCw}
                                loadingText="Actualisation..."
                                className="w-full sm:w-auto"
                            >
                                Réessayer l'affichage
                            </RobustButton>

                            <a
                                href="/dashboard"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uqo-500"
                            >
                                <FiHome className="w-4 h-4" />
                                <span>Tableau de bord</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
