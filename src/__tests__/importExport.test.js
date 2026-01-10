import { describe, it, expect, beforeEach } from 'vitest';
import { exportFormData, importFormData, validateImportData } from '../utils/importExport';

describe('Import/Export Functionality', () => {
    let mockItems;
    let mockSettings;
    let mockOverrides;
    let mockCustomsPreview;

    beforeEach(() => {
        mockItems = [
            {
                description: 'Test Product A',
                quantity: 100,
                exwPrice: 12.50,
                cbmPerUnit: 0.15,
                weightPerUnit: 5,
                cbmInputMode: 'perUnit',
                certifications: [
                    { name: 'CE', cost: 100 },
                    { name: 'FDA', cost: 200 }
                ]
            },
            {
                description: 'Test Product B',
                quantity: 200,
                exwPrice: 8.75,
                cbmPerUnit: 0.08,
                weightPerUnit: 3,
                cbmInputMode: 'perUnit',
                certifications: []
            }
        ];

        mockSettings = {
            containerType: 'auto',
            profitMargin: 0.15,
            profitMarginMode: 'percentage',
            commissionRate: 0.06,
            commissionMode: 'percentage'
        };

        mockOverrides = {
            seaFreightOverride: null,
            domesticChinaShippingOverride: null,
            customsDutyRate: null
        };

        mockCustomsPreview = {
            enabled: false,
            invoiceCostOverride: null,
            shippingCostOverride: null
        };
    });

    describe('exportFormData', () => {
        it('should export form data as JSON string', () => {
            const result = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should include all required fields in export', () => {
            const result = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const data = JSON.parse(result);
            expect(data).toHaveProperty('version');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('items');
            expect(data).toHaveProperty('settings');
            expect(data).toHaveProperty('overrides');
            expect(data).toHaveProperty('customsPreview');
        });

        it('should preserve all items data', () => {
            const result = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const data = JSON.parse(result);
            expect(data.items).toEqual(mockItems);
            expect(data.items.length).toBe(2);
            expect(data.items[0].certifications.length).toBe(2);
        });

        it('should preserve all settings data', () => {
            const result = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const data = JSON.parse(result);
            expect(data.settings).toEqual(mockSettings);
        });

        it('should preserve customs preview data', () => {
            const customsWithOverrides = {
                enabled: true,
                invoiceCostOverride: 2000,
                shippingCostOverride: 1500
            };
            const result = exportFormData(mockItems, mockSettings, mockOverrides, customsWithOverrides);
            const data = JSON.parse(result);
            expect(data.customsPreview).toEqual(customsWithOverrides);
        });
    });

    describe('validateImportData', () => {
        it('should validate correct data structure', () => {
            const validData = {
                items: mockItems,
                settings: mockSettings,
                overrides: mockOverrides,
                customsPreview: mockCustomsPreview
            };
            const result = validateImportData(validData);
            expect(result.valid).toBe(true);
        });

        it('should reject null data', () => {
            const result = validateImportData(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid data format');
        });

        it('should reject data without items array', () => {
            const invalidData = {
                settings: mockSettings,
                overrides: mockOverrides
            };
            const result = validateImportData(invalidData);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Items data is missing');
        });

        it('should reject data without settings', () => {
            const invalidData = {
                items: mockItems,
                overrides: mockOverrides
            };
            const result = validateImportData(invalidData);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Settings data is missing');
        });

        it('should reject items with missing required fields', () => {
            const invalidData = {
                items: [{ description: 'Test' }],
                settings: mockSettings
            };
            const result = validateImportData(invalidData);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('missing required fields');
        });
    });

    describe('importFormData', () => {
        it('should import valid JSON string', () => {
            const jsonString = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const result = importFormData(jsonString);
            expect(result).toBeDefined();
            expect(result.items).toEqual(mockItems);
            expect(result.settings).toEqual(mockSettings);
        });

        it('should throw error for invalid JSON', () => {
            expect(() => {
                importFormData('invalid json');
            }).toThrow();
        });

        it('should throw error for invalid data structure', () => {
            const invalidJson = JSON.stringify({ invalid: 'data' });
            expect(() => {
                importFormData(invalidJson);
            }).toThrow();
        });

        it('should preserve certifications on import', () => {
            const jsonString = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const result = importFormData(jsonString);
            expect(result.items[0].certifications).toEqual(mockItems[0].certifications);
            expect(result.items[0].certifications.length).toBe(2);
        });

        it('should provide default values for missing optional fields', () => {
            const minimalData = {
                items: mockItems,
                settings: mockSettings
            };
            const jsonString = JSON.stringify(minimalData);
            const result = importFormData(jsonString);
            expect(result.overrides).toBeDefined();
            expect(result.customsPreview).toBeDefined();
            expect(result.customsPreview.enabled).toBe(false);
        });
    });

    describe('Round-trip import/export', () => {
        it('should preserve all data through export and import cycle', () => {
            const exported = exportFormData(mockItems, mockSettings, mockOverrides, mockCustomsPreview);
            const imported = importFormData(exported);
            expect(imported.items).toEqual(mockItems);
            expect(imported.settings).toEqual(mockSettings);
            expect(imported.overrides).toEqual(mockOverrides);
            expect(imported.customsPreview).toEqual(mockCustomsPreview);
        });

        it('should handle customs preview with overrides', () => {
            const customsWithOverrides = {
                enabled: true,
                invoiceCostOverride: 2500,
                shippingCostOverride: 1800
            };
            const exported = exportFormData(mockItems, mockSettings, mockOverrides, customsWithOverrides);
            const imported = importFormData(exported);
            expect(imported.customsPreview).toEqual(customsWithOverrides);
        });
    });
});
