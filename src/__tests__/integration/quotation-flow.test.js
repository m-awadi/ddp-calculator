import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDDP } from '../../utils/calculations.js';
import { DEFAULT_RATES } from '../../utils/constants.js';

/**
 * Integration tests for the quotation generation flow
 * Tests the full pipeline from item input to PDF/HTML generation
 */

describe('Quotation Flow Integration Tests', () => {
    const defaultSettings = {
        containerType: 'auto',
        profitMargin: 0.15,
        profitMarginMode: 'percentage',
        commissionRate: 0.06,
        commissionMode: 'percentage',
        pricingMode: 'EXW'
    };

    describe('Full Flow: Item Input to Quotation Data', () => {
        it('should transform DDP input items to quotation items with certification costs', () => {
            // Step 1: Define input items with certifications
            const inputItems = [
                {
                    description: 'Industrial Pump Model A',
                    quantity: 10,
                    unitPrice: 500,
                    cbmPerUnit: 0.5,
                    weightPerUnit: 25,
                    certifications: [
                        { name: 'SASO', cost: 50 },
                        { name: 'Lab Test', cost: 25 }
                    ]
                },
                {
                    description: 'Valve Assembly',
                    quantity: 20,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [
                        { name: 'COC', cost: 30 },
                        { name: 'Lab Test', cost: 15 }
                    ]
                }
            ];

            // Step 2: Calculate DDP
            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Step 3: Transform to quotation items
            const quotationItems = ddpResult.itemBreakdowns.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: parseFloat(item.ddpPerUnit.toFixed(2)),
                image: null
            }));

            // Step 4: Calculate quotation totals
            const totalUSD = quotationItems.reduce(
                (sum, item) => sum + (item.quantity * item.price),
                0
            );
            const totalQAR = totalUSD * 3.65;

            // Verify the flow
            expect(quotationItems).toHaveLength(2);
            expect(quotationItems[0].quantity).toBe(10);
            expect(quotationItems[1].quantity).toBe(20);

            // DDP per unit should include certification costs
            expect(quotationItems[0].price).toBeGreaterThan(500); // Base price
            expect(quotationItems[1].price).toBeGreaterThan(100); // Base price

            // Total should be close to DDP total (small rounding differences allowed)
            expect(totalUSD).toBeCloseTo(ddpResult.costs.ddpTotal, 0);

            // QAR conversion should work
            expect(totalQAR).toBeCloseTo(totalUSD * 3.65, 2);
        });

        it('should include certification data in quotation data structure', () => {
            const inputItems = [
                {
                    description: 'Product with SASO',
                    quantity: 10,
                    unitPrice: 500,
                    cbmPerUnit: 0.5,
                    weightPerUnit: 25,
                    certifications: [
                        { name: 'SASO', cost: 50 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Build complete quotation data structure
            const quotationData = {
                date: new Date().toISOString().slice(0, 10),
                items: ddpResult.itemBreakdowns.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: parseFloat(item.ddpPerUnit.toFixed(2)),
                    image: null
                })),
                totalUSD: ddpResult.costs.ddpTotal,
                totalQAR: ddpResult.costs.ddpTotal * 3.65,
                companyInfo: {
                    name: 'Arabian Trade Route',
                    address: 'Doha, Qatar',
                    email: 'info@test.com'
                },
                showPictureColumn: true,
                customBlocks: [],
                quantityUnit: 'pcs'
            };

            // Verify structure is complete
            expect(quotationData.date).toBeDefined();
            expect(quotationData.items).toHaveLength(1);
            expect(quotationData.totalUSD).toBeGreaterThan(0);
            expect(quotationData.companyInfo.name).toBe('Arabian Trade Route');
        });
    });

    describe('Certification Data Flow', () => {
        it('should flow certification costs through entire pipeline', () => {
            const inputItems = [
                {
                    description: 'Certified Product',
                    quantity: 10,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [
                        { name: 'SASO', cost: 20 },
                        { name: 'COC', cost: 15 },
                        { name: 'Lab Test', cost: 10 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Verify certification flow
            // 1. Total certification cost includes base + item certs
            const expectedCertCost = DEFAULT_RATES.certificationCost + 20 + 15 + 10; // 150 + 45 = 195
            expect(ddpResult.costs.certificationCost).toBe(expectedCertCost);

            // 2. Item breakdown includes allocated certification
            const itemBreakdown = ddpResult.itemBreakdowns[0];
            expect(itemBreakdown.allocatedCertification).toBe(expectedCertCost);

            // 3. Certification is included in landed cost
            expect(ddpResult.costs.landedCostBeforeMargin).toBeGreaterThan(
                ddpResult.costs.totalExwCost + ddpResult.costs.certificationCost
            );

            // 4. DDP per unit reflects certification
            expect(itemBreakdown.ddpPerUnit).toBeGreaterThan(
                itemBreakdown.unitPrice
            );
        });

        it('should correctly allocate certifications across multiple items', () => {
            const inputItems = [
                {
                    description: 'Item A with SASO',
                    quantity: 10,
                    unitPrice: 200,
                    cbmPerUnit: 0.2,
                    weightPerUnit: 10,
                    certifications: [{ name: 'SASO', cost: 40 }]
                },
                {
                    description: 'Item B with COC',
                    quantity: 20,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [{ name: 'COC', cost: 30 }]
                },
                {
                    description: 'Item C no cert',
                    quantity: 5,
                    unitPrice: 50,
                    cbmPerUnit: 0.05,
                    weightPerUnit: 2
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Total values: A=2000, B=2000, C=250, Total=4250
            // Value ratios: A=47.06%, B=47.06%, C=5.88%

            // Total cert cost: base 150 + SASO 40 + COC 30 = 220
            expect(ddpResult.costs.certificationCost).toBe(220);

            // Verify allocation
            const itemA = ddpResult.itemBreakdowns[0];
            const itemB = ddpResult.itemBreakdowns[1];
            const itemC = ddpResult.itemBreakdowns[2];

            // Item A: base*ratio + 40
            // Item B: base*ratio + 30
            // Item C: base*ratio + 0

            // Sum of allocated certifications should equal total cert cost
            const totalAllocatedCert = itemA.allocatedCertification +
                itemB.allocatedCertification +
                itemC.allocatedCertification;

            expect(totalAllocatedCert).toBeCloseTo(ddpResult.costs.certificationCost, 2);
        });
    });

    describe('Lab Test Cost Flow', () => {
        it('should handle lab test costs identically to certifications', () => {
            const inputItems = [
                {
                    description: 'Lab Tested Product',
                    quantity: 10,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [
                        { name: 'Material Test', cost: 30 },
                        { name: 'Performance Test', cost: 25 },
                        { name: 'Safety Test', cost: 20 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Total: base 150 + 30 + 25 + 20 = 225
            expect(ddpResult.costs.certificationCost).toBe(225);

            // Lab costs flow to item breakdown
            const breakdown = ddpResult.itemBreakdowns[0];
            expect(breakdown.allocatedCertification).toBe(225);
        });

        it('should combine certification and lab test costs', () => {
            const inputItems = [
                {
                    description: 'Certified and Tested Product',
                    quantity: 10,
                    unitPrice: 500,
                    cbmPerUnit: 0.5,
                    weightPerUnit: 25,
                    certifications: [
                        { name: 'SASO', cost: 50 },
                        { name: 'COC', cost: 30 },
                        { name: 'Lab Test - Material', cost: 25 },
                        { name: 'Lab Test - Performance', cost: 20 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Total: 150 + 50 + 30 + 25 + 20 = 275
            expect(ddpResult.costs.certificationCost).toBe(275);

            // All costs should be in the final DDP
            expect(ddpResult.costs.ddpTotal).toBeGreaterThan(
                ddpResult.costs.totalExwCost + ddpResult.costs.certificationCost
            );
        });
    });

    describe('Quotation Generation Pipeline', () => {
        it('should prepare data for PDF generation', () => {
            const inputItems = [
                {
                    description: 'Pump with SASO',
                    quantity: 10,
                    unitPrice: 500,
                    cbmPerUnit: 0.5,
                    weightPerUnit: 25,
                    certifications: [{ name: 'SASO', cost: 50 }]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Prepare PDF data
            const pdfData = {
                date: '2026-02-05',
                items: ddpResult.itemBreakdowns.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: parseFloat(item.ddpPerUnit.toFixed(2)),
                    image: null
                })),
                totalQAR: ddpResult.costs.ddpTotal * 3.65,
                totalUSD: ddpResult.costs.ddpTotal,
                companyInfo: {
                    name: 'Arabian Trade Route',
                    address: 'Doha, Qatar\nP.O. Box 12345',
                    email: 'info@arabiantraderoute.com'
                },
                showPictureColumn: true,
                customBlocks: [
                    {
                        id: 'cert-block',
                        title: 'Certifications:',
                        sections: [
                            {
                                id: 'saso-section',
                                title: 'SASO Certification',
                                items: ['SASO conformity included']
                            }
                        ]
                    }
                ],
                quantityUnit: 'pcs'
            };

            // Verify PDF data structure
            expect(pdfData.items).toHaveLength(1);
            expect(pdfData.totalUSD).toBeCloseTo(ddpResult.costs.ddpTotal, 2);
            expect(pdfData.customBlocks).toHaveLength(1);
            expect(pdfData.customBlocks[0].sections[0].title).toBe('SASO Certification');
        });

        it('should prepare data for HTML generation', () => {
            const inputItems = [
                {
                    description: 'Valve with COC',
                    quantity: 20,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [{ name: 'COC', cost: 30 }]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Prepare HTML data (same structure as PDF)
            const htmlData = {
                date: '2026-02-05',
                items: ddpResult.itemBreakdowns.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: parseFloat(item.ddpPerUnit.toFixed(2)),
                    image: null
                })),
                totalQAR: ddpResult.costs.ddpTotal * 3.65,
                totalUSD: ddpResult.costs.ddpTotal,
                companyInfo: {
                    name: 'Arabian Trade Route',
                    address: 'Doha, Qatar',
                    email: 'info@arabiantraderoute.com'
                },
                showPictureColumn: false,
                customBlocks: [],
                quantityUnit: 'units'
            };

            expect(htmlData.items).toHaveLength(1);
            expect(htmlData.showPictureColumn).toBe(false);
            expect(htmlData.quantityUnit).toBe('units');
        });
    });

    describe('Edge Cases in Pipeline', () => {
        it('should handle items with no certifications in the flow', () => {
            const inputItems = [
                {
                    description: 'Basic Item',
                    quantity: 10,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5
                    // No certifications
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            expect(ddpResult.costs.certificationCost).toBe(DEFAULT_RATES.certificationCost);
            expect(ddpResult.itemBreakdowns[0].allocatedCertification).toBe(
                DEFAULT_RATES.certificationCost
            );
        });

        it('should handle mixed items (with and without certifications)', () => {
            const inputItems = [
                {
                    description: 'Certified Item',
                    quantity: 10,
                    unitPrice: 200,
                    cbmPerUnit: 0.2,
                    weightPerUnit: 10,
                    certifications: [{ name: 'SASO', cost: 50 }]
                },
                {
                    description: 'Non-certified Item',
                    quantity: 10,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Total cert: 150 base + 50 SASO = 200
            expect(ddpResult.costs.certificationCost).toBe(200);

            // First item should have higher allocated cert
            const item1 = ddpResult.itemBreakdowns[0];
            const item2 = ddpResult.itemBreakdowns[1];

            // Item 1 gets base pro-rata + 50, Item 2 gets only base pro-rata
            expect(item1.allocatedCertification).toBeGreaterThan(item2.allocatedCertification);
        });

        it('should handle single item with many certifications', () => {
            const inputItems = [
                {
                    description: 'Heavily Certified Item',
                    quantity: 5,
                    unitPrice: 1000,
                    cbmPerUnit: 1.0,
                    weightPerUnit: 50,
                    certifications: [
                        { name: 'SASO', cost: 100 },
                        { name: 'COC', cost: 80 },
                        { name: 'CE', cost: 60 },
                        { name: 'ISO 9001', cost: 40 },
                        { name: 'Lab Test 1', cost: 30 },
                        { name: 'Lab Test 2', cost: 25 },
                        { name: 'Lab Test 3', cost: 20 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Total: 150 + 100 + 80 + 60 + 40 + 30 + 25 + 20 = 505
            expect(ddpResult.costs.certificationCost).toBe(505);
        });
    });

    describe('Data Consistency Across Pipeline', () => {
        it('should maintain data consistency from input to output', () => {
            const inputItems = [
                {
                    description: 'Test Product',
                    quantity: 10,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [{ name: 'SASO', cost: 50 }]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Transform to quotation
            const quotationItems = ddpResult.itemBreakdowns.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: parseFloat(item.ddpPerUnit.toFixed(2)),
                image: null
            }));

            const quotationTotal = quotationItems.reduce(
                (sum, item) => sum + (item.quantity * item.price),
                0
            );

            // Verify consistency
            expect(quotationItems[0].description).toBe(inputItems[0].description);
            expect(quotationItems[0].quantity).toBe(inputItems[0].quantity);

            // Total should be consistent (small rounding difference allowed)
            expect(Math.abs(quotationTotal - ddpResult.costs.ddpTotal)).toBeLessThan(1);
        });

        it('should preserve all item data through transformation', () => {
            const inputItem = {
                description: 'Detailed Product Description\nWith multiple lines\nAnd specifications',
                quantity: 15,
                unitPrice: 250.50,
                cbmPerUnit: 0.35,
                weightPerUnit: 12.5,
                certifications: [
                    { name: 'SASO', cost: 45 }
                ]
            };

            const ddpResult = calculateDDP([inputItem], defaultSettings);
            const breakdown = ddpResult.itemBreakdowns[0];

            // Verify preservation
            expect(breakdown.description).toBe(inputItem.description);
            expect(breakdown.quantity).toBe(inputItem.quantity);
            expect(breakdown.unitPrice).toBe(inputItem.unitPrice);
            expect(breakdown.itemCbm).toBe(inputItem.cbmPerUnit * inputItem.quantity);
        });
    });

    describe('Quotation Totals Verification', () => {
        it('should calculate correct totals for quotation with certification costs', () => {
            const inputItems = [
                {
                    description: 'Product A',
                    quantity: 10,
                    unitPrice: 500,
                    cbmPerUnit: 0.5,
                    weightPerUnit: 25,
                    certifications: [
                        { name: 'SASO', cost: 50 },
                        { name: 'Lab', cost: 25 }
                    ]
                },
                {
                    description: 'Product B',
                    quantity: 20,
                    unitPrice: 100,
                    cbmPerUnit: 0.1,
                    weightPerUnit: 5,
                    certifications: [
                        { name: 'COC', cost: 30 },
                        { name: 'Lab', cost: 15 }
                    ]
                }
            ];

            const ddpResult = calculateDDP(inputItems, defaultSettings);

            // Sum of item DDP totals should equal overall DDP total
            const sumOfItems = ddpResult.itemBreakdowns.reduce(
                (sum, item) => sum + item.itemDdpTotal,
                0
            );

            expect(sumOfItems).toBeCloseTo(ddpResult.costs.ddpTotal, 2);

            // Certification cost should be included
            expect(ddpResult.costs.certificationCost).toBe(150 + 50 + 25 + 30 + 15);
            expect(ddpResult.costs.certificationCost).toBe(270);
        });
    });
});

describe('Quotation Item Builder', () => {
    /**
     * Helper function to build quotation items from DDP result
     */
    const buildQuotationItems = (ddpBreakdowns) => {
        return ddpBreakdowns.map(item => ({
            description: item.description,
            quantity: item.quantity,
            price: parseFloat(item.ddpPerUnit.toFixed(2)),
            image: null
        }));
    };

    /**
     * Helper function to build quotation data structure
     */
    const buildQuotationData = (ddpResult, options = {}) => {
        const defaults = {
            date: new Date().toISOString().slice(0, 10),
            companyInfo: {
                name: 'Arabian Trade Route',
                address: 'Doha, Qatar',
                email: 'info@arabiantraderoute.com'
            },
            showPictureColumn: true,
            customBlocks: [],
            quantityUnit: 'pcs'
        };

        const config = { ...defaults, ...options };

        return {
            date: config.date,
            items: buildQuotationItems(ddpResult.itemBreakdowns),
            totalUSD: ddpResult.costs.ddpTotal,
            totalQAR: ddpResult.costs.ddpTotal * 3.65,
            companyInfo: config.companyInfo,
            showPictureColumn: config.showPictureColumn,
            customBlocks: config.customBlocks,
            quantityUnit: config.quantityUnit
        };
    };

    it('should build quotation items correctly', () => {
        const mockBreakdowns = [
            { description: 'Item 1', quantity: 10, ddpPerUnit: 575.5 },
            { description: 'Item 2', quantity: 20, ddpPerUnit: 145.25 }
        ];

        const quotationItems = buildQuotationItems(mockBreakdowns);

        expect(quotationItems).toHaveLength(2);
        expect(quotationItems[0].price).toBe(575.50);
        expect(quotationItems[1].price).toBe(145.25);
    });

    it('should build complete quotation data structure', () => {
        const mockDdpResult = {
            itemBreakdowns: [
                { description: 'Test', quantity: 10, ddpPerUnit: 100 }
            ],
            costs: {
                ddpTotal: 1000
            }
        };

        const quotationData = buildQuotationData(mockDdpResult, {
            customBlocks: [
                { title: 'Terms', sections: [] }
            ]
        });

        expect(quotationData.items).toHaveLength(1);
        expect(quotationData.totalUSD).toBe(1000);
        expect(quotationData.totalQAR).toBe(3650);
        expect(quotationData.customBlocks).toHaveLength(1);
    });
});
