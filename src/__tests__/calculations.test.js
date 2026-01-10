import { describe, it, expect } from 'vitest';
import {
    calculateMofaFee,
    selectContainers,
    calculateSeaFreight,
    calculateQatarFees,
    calculateDDP,
} from '../utils/calculations.js';
import { DEFAULT_RATES } from '../utils/constants.js';

describe('calculations', () => {
    describe('calculateMofaFee', () => {
        it('should return QAR 650 (500 + 150) for invoice <= 15,000', () => {
            expect(calculateMofaFee(10000)).toBe(650);
            expect(calculateMofaFee(15000)).toBe(650);
        });

        it('should return QAR 1,150 (1000 + 150) for invoice 15,001-100,000', () => {
            expect(calculateMofaFee(15001)).toBe(1150);
            expect(calculateMofaFee(50000)).toBe(1150);
            expect(calculateMofaFee(100000)).toBe(1150);
        });

        it('should return QAR 2,650 (2500 + 150) for invoice 100,001-250,000', () => {
            expect(calculateMofaFee(100001)).toBe(2650);
            expect(calculateMofaFee(200000)).toBe(2650);
            expect(calculateMofaFee(250000)).toBe(2650);
        });

        it('should return QAR 5,150 (5000 + 150) for invoice 250,001-1M', () => {
            expect(calculateMofaFee(250001)).toBe(5150);
            expect(calculateMofaFee(500000)).toBe(5150);
            expect(calculateMofaFee(1000000)).toBe(5150);
        });

        it('should calculate 0.6% + 150 for invoice > 1M', () => {
            const result = calculateMofaFee(2000000);
            expect(result).toBeCloseTo(150 + 2000000 * 0.006, 2);
        });

        it('should handle edge case at tier boundaries', () => {
            expect(calculateMofaFee(14999)).toBe(650);
            expect(calculateMofaFee(15000)).toBe(650);
            expect(calculateMofaFee(15001)).toBe(1150);
        });
    });

    describe('selectContainers', () => {
        it('should select LCL for very small volumes', () => {
            const result = selectContainers(5);
            expect(result).toEqual(['LCL']);
        });

        it('should select 20GP for volumes around 33 CBM', () => {
            const result = selectContainers(33);
            expect(result).toEqual(['20GP']);
        });

        it('should select 40GP for volumes around 67 CBM', () => {
            const result = selectContainers(67);
            expect(result).toEqual(['40GP']);
        });

        it('should select 40HC for volumes around 76 CBM', () => {
            const result = selectContainers(76);
            expect(result).toEqual(['40HC']);
        });

        it('should select multiple containers for large volumes', () => {
            const result = selectContainers(150);
            expect(result.length).toBeGreaterThan(1);
            expect(result).toContain('40HC');
        });

        it('should select 40HC + 20GP for 100 CBM', () => {
            const result = selectContainers(100);
            expect(result).toEqual(['40HC', '20GP']);
        });

        it('should handle partial container correctly', () => {
            const result = selectContainers(80);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('calculateSeaFreight', () => {
        it('should calculate freight for single 20GP', () => {
            const result = calculateSeaFreight(['20GP'], DEFAULT_RATES);
            expect(result).toBe(1800);
        });

        it('should calculate freight for single 40GP', () => {
            const result = calculateSeaFreight(['40GP'], DEFAULT_RATES);
            expect(result).toBe(3200);
        });

        it('should calculate freight for single 40HC', () => {
            const result = calculateSeaFreight(['40HC'], DEFAULT_RATES);
            expect(result).toBe(3400);
        });

        it('should calculate freight for multiple containers', () => {
            const result = calculateSeaFreight(['40HC', '20GP'], DEFAULT_RATES);
            expect(result).toBe(3400 + 1800);
        });

        it('should handle LCL with base rate', () => {
            const result = calculateSeaFreight(['LCL'], DEFAULT_RATES);
            expect(result).toBe(800);
        });

        it('should handle mixed container types', () => {
            const result = calculateSeaFreight(['40HC', '40GP', '20GP'], DEFAULT_RATES);
            expect(result).toBe(3400 + 3200 + 1800);
        });
    });

    describe('calculateQatarFees', () => {
        const containers = ['40HC'];
        const cifValueQar = 100000;
        const invoiceValueQar = 50000;

        it('should calculate customs duty correctly', () => {
            const result = calculateQatarFees(containers, cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result.customsDuty).toBeCloseTo(5000, 2); // 5% of 100,000
        });

        it('should include all fee components', () => {
            const result = calculateQatarFees(containers, cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result).toHaveProperty('customsDuty');
            expect(result).toHaveProperty('mwaniCharges');
            expect(result).toHaveProperty('deliveryOrderFees');
            expect(result).toHaveProperty('terminalHandling');
            expect(result).toHaveProperty('containerReturn');
            expect(result).toHaveProperty('containerMaintenance');
            expect(result).toHaveProperty('terminalInspection');
            expect(result).toHaveProperty('inspectionCharge');
            expect(result).toHaveProperty('clearanceAgentFees');
            expect(result).toHaveProperty('documentAttestation');
            expect(result).toHaveProperty('localTransport');
        });

        it('should calculate delivery order fees based on container type', () => {
            const result = calculateQatarFees(['40HC'], cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result.deliveryOrderFees).toBe(1100);
        });

        it('should calculate terminal handling based on container type', () => {
            const result = calculateQatarFees(['40HC'], cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result.terminalHandling).toBe(1100);
        });

        it('should calculate container return based on container type', () => {
            const result = calculateQatarFees(['40HC'], cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result.containerReturn).toBe(380);
        });

        it('should use MOFA tiered attestation fees', () => {
            const result = calculateQatarFees(containers, cifValueQar, 10000, DEFAULT_RATES);
            expect(result.documentAttestation).toBe(650); // 500 + 150
        });

        it('should handle multiple containers', () => {
            const result = calculateQatarFees(['40HC', '20GP'], cifValueQar, invoiceValueQar, DEFAULT_RATES);
            expect(result.deliveryOrderFees).toBe(1100 + 650);
            expect(result.terminalHandling).toBe(1100 + 650);
        });
    });

    describe('calculateDDP - Integration Tests', () => {
        const sampleItems = [
            { description: 'Item 1', quantity: 100, exwPrice: 10, cbmPerUnit: 0.05, weightPerUnit: 1 }
        ];

        const sampleSettings = {
            containerType: 'auto',
            profitMargin: 0.15,
            profitMarginMode: 'percentage',
            commissionRate: 0.06,
            commissionMode: 'percentage',
        };

        it('should return null for empty items array', () => {
            const result = calculateDDP([], sampleSettings);
            expect(result).toBeNull();
        });

        it('should calculate basic DDP correctly', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('costs');
            expect(result).toHaveProperty('itemBreakdowns');
        });

        it('should calculate summary correctly', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.summary.totalItems).toBe(1);
            expect(result.summary.totalQuantity).toBe(100);
            expect(result.summary.totalCbm).toBeCloseTo(5, 2);
            expect(result.summary.totalExwCost).toBe(1000);
        });

        it('should select correct container type', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.summary.containers).toContain('LCL');
        });

        it('should calculate CIF correctly', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.costs.cifValue).toBeGreaterThan(result.costs.totalExwCost);
        });

        it('should apply profit margin as percentage', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.costs.profitMargin).toBeCloseTo(result.costs.landedCostBeforeMargin * 0.15, 2);
        });

        it('should apply profit margin as fixed amount', () => {
            const fixedSettings = {
                ...sampleSettings,
                profitMarginMode: 'fixed',
                profitMargin: 100,
            };
            const result = calculateDDP(sampleItems, fixedSettings);
            expect(result.costs.profitMargin).toBe(100);
        });

        it('should apply commission as percentage', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            const expectedCommission = (result.costs.landedCostBeforeMargin + result.costs.profitMargin) * 0.06;
            expect(result.costs.commission).toBeCloseTo(expectedCommission, 2);
        });

        it('should apply commission as fixed amount', () => {
            const fixedSettings = {
                ...sampleSettings,
                commissionMode: 'fixed',
                commissionRate: 50,
            };
            const result = calculateDDP(sampleItems, fixedSettings);
            expect(result.costs.commission).toBe(50);
        });

        it('should respect container type override', () => {
            const overrideSettings = { ...sampleSettings, containerType: '40HC' };
            const result = calculateDDP(sampleItems, overrideSettings);
            expect(result.summary.containers).toEqual(['40HC']);
        });

        it('should respect sea freight override', () => {
            const result = calculateDDP(sampleItems, sampleSettings, { seaFreightOverride: 5000 });
            expect(result.costs.seaFreight).toBe(5000);
        });

        it('should respect domestic China shipping override', () => {
            const result = calculateDDP(sampleItems, sampleSettings, { domesticChinaPerCbmOverride: 20 });
            const expectedDomestic = result.summary.totalCbm * 20;
            expect(result.costs.domesticChinaShipping).toBeCloseTo(expectedDomestic, 2);
        });

        it('should generate item breakdowns', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.itemBreakdowns).toHaveLength(1);
            expect(result.itemBreakdowns[0]).toHaveProperty('ddpPerUnit');
        });

        it('should calculate DDP per unit correctly', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            const breakdown = result.itemBreakdowns[0];
            expect(breakdown.ddpPerUnit).toBeCloseTo(breakdown.itemDdpTotal / breakdown.quantity, 2);
        });

        it('should handle multiple items', () => {
            const multiItems = [
                { description: 'Item 1', quantity: 50, exwPrice: 10, cbmPerUnit: 0.05, weightPerUnit: 1 },
                { description: 'Item 2', quantity: 30, exwPrice: 20, cbmPerUnit: 0.1, weightPerUnit: 2 },
            ];
            const result = calculateDDP(multiItems, sampleSettings);
            expect(result.summary.totalItems).toBe(2);
            expect(result.summary.totalQuantity).toBe(80);
            expect(result.itemBreakdowns).toHaveLength(2);
        });

        it('should allocate costs proportionally across items', () => {
            const multiItems = [
                { description: 'Item 1', quantity: 50, exwPrice: 10, cbmPerUnit: 0.05, weightPerUnit: 1 },
                { description: 'Item 2', quantity: 30, exwPrice: 20, cbmPerUnit: 0.1, weightPerUnit: 2 },
            ];
            const result = calculateDDP(multiItems, sampleSettings);
            const totalAllocated = result.itemBreakdowns.reduce((sum, item) => sum + item.itemDdpTotal, 0);
            expect(totalAllocated).toBeCloseTo(result.costs.ddpTotal, 2);
        });

        it('should use exchange rate 3.65 for QAR conversion', () => {
            const result = calculateDDP(sampleItems, sampleSettings);
            expect(result.costs.cifValueQar).toBeCloseTo(result.costs.cifWithInsurance * 3.65, 2);
        });
    });
});
