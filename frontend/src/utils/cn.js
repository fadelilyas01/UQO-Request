import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire standard combinant clsx et tailwind-merge pour la gestion
 * robuste et sans conflit des classes conditionnelles Tailwind CSS.
 * 
 * @param {...any} inputs - Liste de classes conditionnelles, tableaux ou objets
 * @returns {string} Chaine de classes CSS normalisee et fusionnee
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default cn;
