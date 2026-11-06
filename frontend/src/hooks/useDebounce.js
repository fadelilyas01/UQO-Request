/**
 * useDebounce.js - Hook de temporisation (Debouncing) pour stabiliser
 * la frappe et les clics rapides sans freeze ni duplication.
 */

import { useState, useEffect } from 'react';

export function useDebounce(value, delayMs = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delayMs]);

    return debouncedValue;
}

export default useDebounce;
