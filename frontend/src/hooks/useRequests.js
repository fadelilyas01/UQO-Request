/**
 * Hook personnalise useRequests pour UQO-Requests.
 * Centralise les requetes API et le calcul d'indicateurs de synthese pour les demandes.
 * Totalement securise par safeArray (Zéro-Crash garanti).
 */

import { useState, useCallback } from 'react';
import { api, getSafeApiErrorMessage } from '../api/client';
import { safeArray } from '../utils/safeUtils';

export function useRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRequests = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getRequests(filters);
            const data = response.data?.results ?? response.data;
            setRequests(safeArray(data));
        } catch (err) {
            setError(getSafeApiErrorMessage(err, 'Impossible de charger les demandes. Veuillez réessayer ultérieurement.'));
        } finally {
            setLoading(false);
        }
    }, []);

    const safeRequestsList = safeArray(requests);

    const stats = {
        total: safeRequestsList.length,
        submitted: safeRequestsList.filter((r) => r?.status === 'SUBMITTED').length,
        inProgress: safeRequestsList.filter((r) => r?.status === 'IN_PROGRESS').length,
        approved: safeRequestsList.filter((r) => r?.status === 'APPROVED').length,
        rejected: safeRequestsList.filter((r) => r?.status === 'REJECTED').length,
    };

    return {
        requests: safeRequestsList,
        loading,
        error,
        fetchRequests,
        stats,
    };
}

export default useRequests;
