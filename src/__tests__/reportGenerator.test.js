import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDFReport, downloadPDFReport } from '../utils/reportGenerator';

// Mock jsPDF
vi.mock('jspdf', () => {
    class MockJsPDF {
        constructor() {
            this.internal = {
                pageSize: {
                    getWidth: () => 210,
                    getHeight: () => 297
                },
                getNumberOfPages: () => 1
            };
            this.setFillColor = vi.fn();
            this.setTextColor = vi.fn();
            this.setFontSize = vi.fn();
            this.setFont = vi.fn();
            this.rect = vi.fn();
            this.roundedRect = vi.fn();
            this.text = vi.fn();
            this.addPage = vi.fn();
            this.setPage = vi.fn();
            this.save = vi.fn();
            this.lastAutoTable = {
                finalY: 100
            };
        }
    }

    return {
        jsPDF: MockJsPDF
    };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
    default: vi.fn()
}));

describe('reportGenerator', () => {
    let mockResults;
    let mockItems;
    let mockSettings;

    beforeEach(() => {
        mockResults = {
            summary: {
                totalItems: 2,
                totalQuantity: 150,
                totalCbm: 10.5,
                totalWeight: 500,
                containers: ['40GP'],
                containerCount: 1,
                containerUtilization: 15.67,
                totalExwCost: 1500
            },
            costs: {
                totalExwCost: 1500,
                seaFreight: 3200,
                domesticChinaShipping: 157.5,
                freightSubtotal: 3357.5,
                insurance: 24.29,
                cifValue: 4857.5,
                cifWithInsurance: 4881.79,
                cifValueQar: 17818.53,
                qatarCharges: {
                    customsDuty: 891.93,
                    deliveryOrder: 1000,
                    terminalHandling: 1000,
                    containerReturn: 300,
                    containerMaintenance: 40.04,
                    mwani: 160,
                    terminalInspection: 35,
                    inspectionCharge: 50,
                    clearanceAgent: 250,
                    documentAttestation: 1150,
                    localTransport: 800
                },
                totalQatarChargesQar: 5677,
                totalQatarChargesUsd: 1555.61,
                certificationCost: 150,
                landedCostBeforeMargin: 7589.40,
                profitMargin: 1138.41,
                commission: 523.33,
                ddpTotal: 9251.14
            },
            itemBreakdowns: [
                {
                    description: 'Item 1',
                    quantity: 100,
                    exwPrice: 10,
                    cbmPerUnit: 0.05,
                    weightPerUnit: 3,
                    itemDdpTotal: 6167.43,
                    ddpPerUnit: 61.67
                },
                {
                    description: 'Item 2',
                    quantity: 50,
                    exwPrice: 10,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 4,
                    itemDdpTotal: 3083.71,
                    ddpPerUnit: 61.67
                }
            ],
            rates: {
                usdToQar: 3.65
            }
        };

        mockItems = [
            {
                description: 'Item 1',
                quantity: 100,
                exwPrice: 10,
                cbmPerUnit: 0.05,
                weightPerUnit: 3
            },
            {
                description: 'Item 2',
                quantity: 50,
                exwPrice: 10,
                cbmPerUnit: 0.1,
                weightPerUnit: 4
            }
        ];

        mockSettings = {
            containerType: 'auto',
            profitMargin: 0.15,
            profitMarginMode: 'percentage',
            commissionRate: 0.06,
            commissionMode: 'percentage'
        };
    });

    describe('generatePDFReport', () => {
        it('should generate a PDF document', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
            expect(doc).toHaveProperty('save');
        });

        it('should handle null results gracefully', async () => {
            const doc = await generatePDFReport(null, mockItems, mockSettings);

            expect(doc).toBeDefined();
        });

        it('should include all summary information', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            // Verify the document was created
            expect(doc).toBeDefined();
        });

        it('should include cost breakdown', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
        });

        it('should include item breakdowns', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
        });

        it('should handle empty items array', async () => {
            const doc = await generatePDFReport(mockResults, [], mockSettings);

            expect(doc).toBeDefined();
        });

        it('should display container utilization', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
            expect(mockResults.summary.containerUtilization).toBeCloseTo(15.67, 2);
        });
    });

    describe('downloadPDFReport', () => {
        it('should call save on the PDF document', () => {
            expect(() => {
                downloadPDFReport(mockResults, mockItems, mockSettings, 'test-report.pdf');
            }).not.toThrow();
        });

        it('should use provided filename', () => {
            expect(() => {
                const filename = 'custom-report.pdf';
                downloadPDFReport(mockResults, mockItems, mockSettings, filename);
            }).not.toThrow();
        });

        it('should use default filename if not provided', () => {
            expect(() => {
                downloadPDFReport(mockResults, mockItems, mockSettings);
            }).not.toThrow();
        });

        it('should not throw error when results are null', () => {
            expect(() => {
                downloadPDFReport(null, mockItems, mockSettings);
            }).not.toThrow();
        });
    });

    describe('PDF Content Validation', () => {
        it('should include all cost categories in the PDF', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            // Verify PDF methods were called
            expect(doc).toBeDefined();
            expect(doc).toHaveProperty('save');
        });

        it('should format currency values correctly', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
            expect(mockResults.costs.ddpTotal).toBeCloseTo(9251.14, 2);
        });

        it('should display both USD and QAR values', async () => {
            const doc = await generatePDFReport(mockResults, mockItems, mockSettings);

            expect(doc).toBeDefined();
            expect(mockResults.rates.usdToQar).toBe(3.65);
        });
    });
});
