import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ddp-calculator-history';
const MAX_HISTORY_ITEMS = 50;
const AUTOSAVE_KEY = 'ddp-calculator-autosave';

/**
 * Custom hook for managing quotation history in localStorage
 */
export function useQuotationHistory() {
    const [history, setHistory] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Sort by date descending (newest first)
                const sorted = parsed.sort((a, b) =>
                    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
                );
                setHistory(sorted);
            }
        } catch (error) {
            console.error('Error loading history from localStorage:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            } catch (error) {
                console.error('Error saving history to localStorage:', error);
            }
        }
    }, [history, isLoaded]);

    /**
     * Save a quotation to history
     */
    const saveQuotation = useCallback((quotationData, customName = null) => {
        const { items, settings, overrides, customsPreview, reportName, results } = quotationData;

        // Generate a unique ID
        const id = `quotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create display name
        const name = customName || reportName || generateDefaultName(items);

        const newEntry = {
            id,
            name,
            savedAt: new Date().toISOString(),
            data: {
                items,
                settings,
                overrides,
                customsPreview,
                reportName,
            },
            // Store summary for quick display
            summary: {
                itemCount: items.filter(i => i.quantity > 0 && i.unitPrice > 0).length,
                totalCBM: items.reduce((sum, item) => sum + (item.cbmPerUnit * item.quantity), 0),
                ddpTotal: results?.totals?.ddpTotal || 0,
                currency: 'USD',
            }
        };

        setHistory(prev => {
            // Remove any existing entry with the same name to avoid duplicates
            const filtered = prev.filter(item => item.name !== name);
            // Add new entry at the beginning
            const updated = [newEntry, ...filtered];
            // Limit to MAX_HISTORY_ITEMS
            return updated.slice(0, MAX_HISTORY_ITEMS);
        });

        return id;
    }, []);

    /**
     * Load a quotation from history
     */
    const loadQuotation = useCallback((id) => {
        const entry = history.find(item => item.id === id);
        if (!entry) {
            console.error('Quotation not found:', id);
            return null;
        }
        return entry.data;
    }, [history]);

    /**
     * Delete a quotation from history
     */
    const deleteQuotation = useCallback((id) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    /**
     * Rename a quotation in history
     */
    const renameQuotation = useCallback((id, newName) => {
        setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, name: newName } : item
        ));
    }, []);

    /**
     * Clear all history
     */
    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    /**
     * Get autosaved data (last session)
     */
    const getAutosave = useCallback(() => {
        try {
            const stored = localStorage.getItem(AUTOSAVE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading autosave:', error);
        }
        return null;
    }, []);

    /**
     * Save current state as autosave
     */
    const setAutosave = useCallback((data) => {
        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
                ...data,
                savedAt: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Error saving autosave:', error);
        }
    }, []);

    /**
     * Clear autosave
     */
    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);

    return {
        history,
        isLoaded,
        saveQuotation,
        loadQuotation,
        deleteQuotation,
        renameQuotation,
        clearHistory,
        getAutosave,
        setAutosave,
        clearAutosave,
    };
}

/**
 * Generate a default name based on items
 */
function generateDefaultName(items) {
    const validItems = items.filter(i => i.description && i.description.trim());
    if (validItems.length === 0) {
        return `Quotation ${new Date().toLocaleDateString()}`;
    }

    const firstItem = validItems[0].description.trim();
    const truncated = firstItem.length > 30 ? firstItem.substring(0, 30) + '...' : firstItem;

    if (validItems.length === 1) {
        return truncated;
    }

    return `${truncated} (+${validItems.length - 1} more)`;
}

export default useQuotationHistory;
