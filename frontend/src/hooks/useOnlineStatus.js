/**
 * useOnlineStatus.js - Hook de détection d'état réseau en direct.
 * Alerte l'utilisateur dès la perte de connectivité pour bloquer les doubles clics
 * et les envois voués à l'échec.
 */

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        return true;
    });

    const [hasBeenOffline, setHasBeenOffline] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setHasBeenOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        hasBeenOffline,
    };
}

export default useOnlineStatus;
