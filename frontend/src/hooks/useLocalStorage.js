// src/hooks/useLocalStorage.js

import { useState, useEffect } from 'react';

// Custom event name for same-window updates
const LOCAL_STORAGE_EVENT_NAME = 'local-storage-update';

// Utility to get the value from storage
const getStorageValue = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    // If a saved value exists, use it. Otherwise, use the provided default.
    return saved !== null ? saved : defaultValue;
};

/**
 * Custom hook to sync a React state value with Local Storage.
 * It also listens for 'storage' events (cross-tab) and a custom event (same-tab).
 * @param {string} key - The key in local storage
 * @param {string} defaultValue - The default value to use if none is found
 * @returns {[string, function]} - [storedValue, setValue]
 */
export function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => getStorageValue(key, defaultValue));

    useEffect(() => {
        // 1. Initial write (if using default) or sync
        localStorage.setItem(key, value);
        
        // 2. Event listener for updates (cross-tab sync)
        const handleStorageChange = (e) => {
            if (e.key === key) {
                // Update state with the new value from Local Storage
                setValue(e.newValue);
            }
        };

        // 3. Event listener for custom event (same-tab sync)
        const handleCustomUpdate = () => {
             // Re-read the value from storage
            setValue(getStorageValue(key, defaultValue));
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(LOCAL_STORAGE_EVENT_NAME, handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(LOCAL_STORAGE_EVENT_NAME, handleCustomUpdate);
        };
    }, [key, value, defaultValue]);

    
    const setLocalStorageValue = (newValue) => {
        // 1. Update React state
        setValue(newValue);
        
        // 2. Update Local Storage directly
        localStorage.setItem(key, newValue);

        // 3. Dispatch custom event for other components in the same tab/window
        // to pick up the change immediately, as 'storage' event doesn't fire locally.
        window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT_NAME));
    };

    return [value, setLocalStorageValue];
}

// Helper function that a separate Header component would use to update the code
export const updateDealerCodeInStorage = (newCode) => {
    localStorage.setItem("dealerCode", newCode);
    window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT_NAME));
};