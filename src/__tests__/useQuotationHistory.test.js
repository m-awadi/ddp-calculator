import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuotationHistory } from '../hooks/useQuotationHistory';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useQuotationHistory', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe('initialization', () => {
        test('should initialize with empty history', () => {
            const { result } = renderHook(() => useQuotationHistory());

            expect(result.current.history).toEqual([]);
            expect(result.current.isLoaded).toBe(true);
        });

        test('should load existing history from localStorage', () => {
            const existingHistory = [
                {
                    id: 'test-1',
                    name: 'Test Quotation',
                    savedAt: '2026-02-05T10:00:00.000Z',
                    data: { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '' },
                    summary: { itemCount: 0, totalCBM: 0, ddpTotal: 0, currency: 'USD' },
                },
            ];
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingHistory));

            const { result } = renderHook(() => useQuotationHistory());

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].name).toBe('Test Quotation');
        });

        test('should handle corrupted localStorage data gracefully', () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid json');

            const { result } = renderHook(() => useQuotationHistory());

            expect(result.current.history).toEqual([]);
            expect(result.current.isLoaded).toBe(true);
        });
    });

    describe('saveQuotation', () => {
        test('should save a new quotation to history', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const quotationData = {
                items: [{ description: 'Widget', quantity: 10, unitPrice: 5, cbmPerUnit: 0.01 }],
                settings: { containerType: 'auto', profitMargin: 0.15 },
                overrides: {},
                customsPreview: { enabled: false },
                reportName: 'Test Report',
                results: { totals: { ddpTotal: 1000 } },
            };

            act(() => {
                result.current.saveQuotation(quotationData, 'My Quotation');
            });

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].name).toBe('My Quotation');
            expect(result.current.history[0].summary.ddpTotal).toBe(1000);
        });

        test('should use reportName as default name when no custom name provided', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const quotationData = {
                items: [{ description: 'Widget', quantity: 10, unitPrice: 5, cbmPerUnit: 0.01 }],
                settings: {},
                overrides: {},
                customsPreview: {},
                reportName: 'ABC Trading',
                results: { totals: { ddpTotal: 500 } },
            };

            act(() => {
                result.current.saveQuotation(quotationData);
            });

            expect(result.current.history[0].name).toBe('ABC Trading');
        });

        test('should generate default name from first item description', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const quotationData = {
                items: [
                    { description: 'Premium Steel Widgets', quantity: 10, unitPrice: 5, cbmPerUnit: 0.01 },
                    { description: 'Another Item', quantity: 5, unitPrice: 10, cbmPerUnit: 0.02 },
                ],
                settings: {},
                overrides: {},
                customsPreview: {},
                reportName: '',
                results: { totals: { ddpTotal: 500 } },
            };

            act(() => {
                result.current.saveQuotation(quotationData);
            });

            expect(result.current.history[0].name).toContain('Premium Steel Widgets');
            expect(result.current.history[0].name).toContain('+1 more');
        });

        test('should limit history to 50 items', () => {
            const { result } = renderHook(() => useQuotationHistory());

            // Add 55 quotations
            for (let i = 0; i < 55; i++) {
                act(() => {
                    result.current.saveQuotation(
                        {
                            items: [{ description: `Item ${i}`, quantity: 1, unitPrice: 1, cbmPerUnit: 0.01 }],
                            settings: {},
                            overrides: {},
                            customsPreview: {},
                            reportName: `Quotation ${i}`,
                            results: { totals: { ddpTotal: i * 100 } },
                        },
                        `Quotation ${i}`
                    );
                });
            }

            expect(result.current.history.length).toBeLessThanOrEqual(50);
        });

        test('should replace quotation with same name', () => {
            const { result } = renderHook(() => useQuotationHistory());

            act(() => {
                result.current.saveQuotation(
                    {
                        items: [],
                        settings: {},
                        overrides: {},
                        customsPreview: {},
                        reportName: '',
                        results: { totals: { ddpTotal: 100 } },
                    },
                    'Same Name'
                );
            });

            act(() => {
                result.current.saveQuotation(
                    {
                        items: [],
                        settings: {},
                        overrides: {},
                        customsPreview: {},
                        reportName: '',
                        results: { totals: { ddpTotal: 200 } },
                    },
                    'Same Name'
                );
            });

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].summary.ddpTotal).toBe(200);
        });
    });

    describe('loadQuotation', () => {
        test('should load quotation data by id', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const quotationData = {
                items: [{ description: 'Test', quantity: 5, unitPrice: 10, cbmPerUnit: 0.01 }],
                settings: { containerType: '20GP' },
                overrides: { seaFreightOverride: 500 },
                customsPreview: { enabled: true },
                reportName: 'Load Test',
                results: { totals: { ddpTotal: 1500 } },
            };

            let savedId;
            act(() => {
                savedId = result.current.saveQuotation(quotationData, 'Load Test');
            });

            const loaded = result.current.loadQuotation(savedId);

            expect(loaded).not.toBeNull();
            expect(loaded.items[0].description).toBe('Test');
            expect(loaded.settings.containerType).toBe('20GP');
            expect(loaded.overrides.seaFreightOverride).toBe(500);
        });

        test('should return null for non-existent id', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const loaded = result.current.loadQuotation('non-existent-id');

            expect(loaded).toBeNull();
        });
    });

    describe('deleteQuotation', () => {
        test('should delete quotation by id', () => {
            const { result } = renderHook(() => useQuotationHistory());

            let savedId;
            act(() => {
                savedId = result.current.saveQuotation(
                    {
                        items: [],
                        settings: {},
                        overrides: {},
                        customsPreview: {},
                        reportName: 'To Delete',
                        results: { totals: { ddpTotal: 100 } },
                    },
                    'To Delete'
                );
            });

            expect(result.current.history).toHaveLength(1);

            act(() => {
                result.current.deleteQuotation(savedId);
            });

            expect(result.current.history).toHaveLength(0);
        });

        test('should not affect other quotations when deleting', () => {
            const { result } = renderHook(() => useQuotationHistory());

            let id1, id2;
            act(() => {
                id1 = result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 100 } } },
                    'Keep This'
                );
                id2 = result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 200 } } },
                    'Delete This'
                );
            });

            act(() => {
                result.current.deleteQuotation(id2);
            });

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].name).toBe('Keep This');
        });
    });

    describe('renameQuotation', () => {
        test('should rename quotation by id', () => {
            const { result } = renderHook(() => useQuotationHistory());

            let savedId;
            act(() => {
                savedId = result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 100 } } },
                    'Original Name'
                );
            });

            act(() => {
                result.current.renameQuotation(savedId, 'New Name');
            });

            expect(result.current.history[0].name).toBe('New Name');
        });
    });

    describe('clearHistory', () => {
        test('should clear all history', () => {
            const { result } = renderHook(() => useQuotationHistory());

            act(() => {
                result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 100 } } },
                    'Quotation 1'
                );
                result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 200 } } },
                    'Quotation 2'
                );
            });

            expect(result.current.history).toHaveLength(2);

            act(() => {
                result.current.clearHistory();
            });

            expect(result.current.history).toHaveLength(0);
        });
    });

    describe('autosave', () => {
        test('should save and retrieve autosave data', () => {
            const { result } = renderHook(() => useQuotationHistory());

            const autosaveData = {
                items: [{ description: 'Autosaved Item', quantity: 1, unitPrice: 10, cbmPerUnit: 0.01 }],
                settings: { containerType: 'auto' },
                overrides: {},
                customsPreview: {},
                reportName: 'Autosave Test',
            };

            act(() => {
                result.current.setAutosave(autosaveData);
            });

            const retrieved = result.current.getAutosave();

            expect(retrieved).not.toBeNull();
            expect(retrieved.items[0].description).toBe('Autosaved Item');
            expect(retrieved.reportName).toBe('Autosave Test');
            expect(retrieved.savedAt).toBeDefined();
        });

        test('should clear autosave data', () => {
            const { result } = renderHook(() => useQuotationHistory());

            act(() => {
                result.current.setAutosave({ items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '' });
            });

            act(() => {
                result.current.clearAutosave();
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('ddp-calculator-autosave');
        });
    });

    describe('localStorage persistence', () => {
        test('should persist history to localStorage on save', () => {
            const { result } = renderHook(() => useQuotationHistory());

            act(() => {
                result.current.saveQuotation(
                    { items: [], settings: {}, overrides: {}, customsPreview: {}, reportName: '', results: { totals: { ddpTotal: 100 } } },
                    'Persist Test'
                );
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'ddp-calculator-history',
                expect.any(String)
            );
        });
    });
});
