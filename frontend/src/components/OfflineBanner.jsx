/**
 * OfflineBanner.jsx - Bannière de résilience hors-ligne.
 * Avertit l'utilisateur sans bloquer la vue si la connectivité réseau est interrompue,
 * évitant les clics multiples voués à l'échec.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { FiWifiOff, FiCheckCircle } from 'react-icons/fi';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
    const { isOnline, hasBeenOffline } = useOnlineStatus();
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (isOnline && hasBeenOffline) {
            setShowReconnected(true);
            const timer = setTimeout(() => {
                setShowReconnected(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, hasBeenOffline]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-amber-600 text-white text-xs sm:text-sm font-medium px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm"
                    role="alert"
                >
                    <FiWifiOff className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>
                        Connexion réseau interrompue. Les transmissions sont temporairement suspendues pour préserver vos données.
                    </span>
                </motion.div>
            )}

            {isOnline && showReconnected && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-emerald-600 text-white text-xs sm:text-sm font-medium px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm"
                    role="status"
                >
                    <FiCheckCircle className="w-4 h-4 shrink-0" />
                    <span>Connexion Internet rétablie avec succès. Vos services sont synchronisés.</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
