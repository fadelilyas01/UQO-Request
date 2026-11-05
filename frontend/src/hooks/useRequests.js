/**
 * Hook personnalise useRequests pour UQO-Requests.
 * Centralise les requetes API et le calcul d'indicateurs de synthese pour les demandes.
 */

import { useState, useCallback } from 'react';
import { api } from '../api/client';

export function useRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRequests = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getRequests(filters);
            const data = response.data.results || response.data;
            setRequests(data);
        } catch {
            setError('Impossible de charger les demandes. Veuillez réessayer ultérieurement.');
        } finally {
            setLoading(false);
        }
    }, []);

    const stats = {
        total: requests.length,
        submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
        inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
        approved: requests.filter((r) => r.status === 'APPROVED').length,
        rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    return {
        requests,
        loading,
        error,
        fetchRequests,
        stats,
    };
}

export default useRequests;
