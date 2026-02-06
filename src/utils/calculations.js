import { CONTAINER_SPECS, DEFAULT_RATES, MOFA_FEE_TIERS, CERTIFICATE_OF_ORIGIN_FEE } from './constants.js';
import { parseNumberInput } from './numberParsing.js';

/**
 * Calculate MOFA attestation fees based on tiered structure
 * @param {number} invoiceValueQar - Invoice value in QAR
 * @returns {number} Total MOFA attestation fee in QAR
 */
export const calculateMofaFee = (invoiceValueQar) => {
    let attestationFee = 0;

    for (const tier of MOFA_FEE_TIERS) {
        if (invoiceValueQar <= tier.max) {
            attestationFee = tier.fee !== null ? tier.fee : invoiceValueQar * tier.percentage;
            break;
        }
    }

    return CERTIFICATE_OF_ORIGIN_FEE + attestationFee;
};

/**
 * Select optimal containers for given CBM
 * @param {number} totalCbm - Total cubic meters
 * @returns {string[]} Array of container types
 */
export const selectContainers = (totalCbm) => {
    const containers = [];

    // Very small shipments use LCL
    if (totalCbm <= 15) {
        return ['LCL'];
    }

    // Single-container shortcuts to avoid unnecessary LCL splits
    if (totalCbm <= CONTAINER_SPECS['20GP'].cbm) {
        return ['20GP'];
    }
    // If just above 20GP but still well within 40GP, prefer a single 40GP
    const fortyGpMax = CONTAINER_SPECS['40GP'].cbm;
    if (totalCbm <= fortyGpMax && totalCbm <= CONTAINER_SPECS['20GP'].cbm * 1.2) {
        return ['40GP'];
    }

    // Fallback to greedy packing for larger volumes
    let remainingCbm = totalCbm;
    while (remainingCbm > 0) {
        if (remainingCbm >= CONTAINER_SPECS['40HC'].cbm) {
            containers.push('40HC');
            remainingCbm -= CONTAINER_SPECS['40HC'].cbm;
        } else if (remainingCbm >= CONTAINER_SPECS['40GP'].cbm) {
            containers.push('40GP');
            remainingCbm -= CONTAINER_SPECS['40GP'].cbm;
        } else if (remainingCbm >= CONTAINER_SPECS['20GP'].cbm) {
            containers.push('20GP');
            remainingCbm -= CONTAINER_SPECS['20GP'].cbm;
        } else {
            // Remaining fits in a partial container
            if (remainingCbm > CONTAINER_SPECS['40GP'].cbm / 2) {
                containers.push('40HC'); // Use 40HC for remaining if > half of 40GP
            } else if (remainingCbm > CONTAINER_SPECS['20GP'].cbm / 2) {
                containers.push('20GP'); // Use 20GP for small remaining
            } else {
                containers.push('LCL'); // Less than Container Load
            }
            remainingCbm = 0;
        }
    }

    return containers;
};

/**
 * Calculate sea freight cost based on containers
 * @param {string[]} containers - Array of container types
 * @param {object} rates - Rate configuration
 * @returns {number} Total sea freight cost in USD
 */
export const calculateSeaFreight = (containers, rates) => {
    let total = 0;
    containers.forEach(type => {
        if (type !== 'LCL') {
            total += rates.seaFreight[type] || 3200;
        } else {
            total += 800; // LCL base rate
        }
    });
    return total;
};

/**
 * Calculate Qatar clearance fees
 * @param {string[]} containers - Array of container types
 * @param {number} cifValueQar - CIF value in QAR
 * @param {number} invoiceValueQar - Invoice value in QAR
 * @param {object} rates - Rate configuration
 * @returns {object} Qatar charges breakdown
 */
export const calculateQatarFees = (containers, cifValueQar, invoiceValueQar, rates) => {
    const customsDuty = cifValueQar * rates.qatarClearance.customsDutyRate;

    // Calculate container-based fees (all in QAR)
    let deliveryOrderFees = 0;
    let terminalHandling = 0;
    let containerReturn = 0;
    let containerMaintenance = 0;

    containers.forEach(type => {
        if (type !== 'LCL') {
            deliveryOrderFees += rates.qatarClearance.deliveryOrder[type] || 1000;
            terminalHandling += rates.qatarClearance.terminalHandling[type] || 1000;
            containerReturn += rates.qatarClearance.containerReturn[type] || 300;
            containerMaintenance += rates.qatarClearance.containerMaintenance[type] || 40.04;
        } else {
            // LCL fees (approximate)
            deliveryOrderFees += 200;
            terminalHandling += 300;
            containerReturn += 50;
            containerMaintenance += 10;
        }
    });

    // Calculate MOFA attestation fees
    const mofaAttestation = calculateMofaFee(invoiceValueQar);

    // Build Qatar charges with single canonical clearance charge
    const qatarCharges = {
        // Government & Customs charges
        customsDuty,
        mwaniCharges: rates.qatarClearance.mwaniCharges,
        
        // CMA CGM Shipping Line charges
        deliveryOrderFees,
        terminalHandling,
        containerReturn,
        containerMaintenance,
        terminalInspection: rates.qatarClearance.terminalInspection,
        inspectionCharge: rates.qatarClearance.inspectionCharge,
        
        // MOFA attestation
        documentAttestation: mofaAttestation,
        
        // Single canonical clearance charge (no duplicates)
        clearanceCharges: rates.qatarClearance.clearanceAgentFees,
        
        // Local transport
        localTransport: rates.localTransport,
    };
    
    // Validation: ensure no NaN or invalid values
    Object.entries(qatarCharges).forEach(([key, value]) => {
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
            throw new Error(`Invalid Qatar charge: ${key} = ${value}`);
        }
    });
    
    return qatarCharges;
};

// Memoization cache to prevent re-render loops
let lastInput = null;
let lastResult = null;

// Simple deep comparison function for memoization
const deepCompare = (obj1, obj2) => {
    try {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    } catch (e) {
        console.error("Deep compare failed:", e);
        return false;
    }
};

const performDDPCalculation = (inputItems, settings, overrides) => {
    if (!inputItems.length) return null;

    // Use a deep copy of items to prevent state mutation, which is a common cause of loops
    // Also normalize numeric fields using parseNumberInput to handle international formats
    const items = JSON.parse(JSON.stringify(inputItems)).map((item) => ({
        ...item,
        quantity: parseNumberInput(item.quantity),
        unitPrice: parseNumberInput(item.unitPrice ?? item.exwPrice),
        exwPrice: parseNumberInput(item.unitPrice ?? item.exwPrice),
        cbmPerUnit: parseNumberInput(item.cbmPerUnit),
        weightPerUnit: parseNumberInput(item.weightPerUnit),
        certifications: Array.isArray(item.certifications) ? item.certifications : [],
    }));

    const rates = { ...DEFAULT_RATES, ...overrides };
    const profitMarginSetting = settings.profitMargin ?? DEFAULT_RATES.profitMargin;
    const commissionRateSetting = settings.commissionRate ?? DEFAULT_RATES.commissionRate;

    // Calculate totals using reduce for reliability
    const totalExwCost = items.reduce((sum, item) => {
        const unitPrice = item.unitPrice ?? item.exwPrice ?? 0;
        return sum + (unitPrice * item.quantity);
    }, 0);

    let totalCbm = 0;
    let totalWeight = 0;
    let totalCertificationCost = 0;
    let totalFixedCost = 0;

    items.forEach(item => {
        totalCbm += (item.cbmPerUnit || 0) * item.quantity;
        totalWeight += (item.weightPerUnit || 0) * item.quantity;
        if (item.certifications && Array.isArray(item.certifications)) {
            item.certifications.forEach(cert => {
                totalCertificationCost += parseNumberInput(cert.cost);
            });
        }
        // Fixed costs (one-time costs not multiplied by quantity)
        if (item.fixedCosts && Array.isArray(item.fixedCosts)) {
            item.fixedCosts.forEach(cost => {
                totalFixedCost += parseNumberInput(cost.cost);
            });
        }
    });

    // Select containers
    let containers = selectContainers(totalCbm);

    // Override with selected container if specified
    if (settings.containerType && settings.containerType !== 'auto') {
        containers = [settings.containerType];
    }

    const pricingMode = settings.pricingMode || 'EXW';

    // Calculate sea freight (CIF includes freight/insurance in price)
    let seaFreightTotal = pricingMode === 'CIF' ? 0 : calculateSeaFreight(containers, rates);

    // Override if specified
    if (pricingMode !== 'CIF' && overrides.seaFreightOverride) {
        seaFreightTotal = overrides.seaFreightOverride;
    }

    // Domestic China shipping (only for EXW, FOB/CIF include it in the price)
    let domesticChinaShipping = 0;
    if (pricingMode === 'EXW' || !settings.pricingMode) {
        const perCbmOverride = overrides.domesticChinaPerCbmOverride ?? overrides.domesticChinaPerCbm;
        if (overrides.domesticChinaShippingOverride !== null && overrides.domesticChinaShippingOverride !== undefined) {
            domesticChinaShipping = overrides.domesticChinaShippingOverride;
        } else if (perCbmOverride !== null && perCbmOverride !== undefined) {
            domesticChinaShipping = totalCbm * perCbmOverride;
        } else {
            domesticChinaShipping = totalCbm * rates.domesticChinaPerCbm;
        }
    }

    const freightSubtotal = seaFreightTotal + domesticChinaShipping;

    // Calculate CIF value and insurance
    let cifValueBeforeInsurance = totalExwCost + freightSubtotal;
    let insurance = cifValueBeforeInsurance * rates.insuranceRate;
    let cifValue = cifValueBeforeInsurance + insurance;
    if (pricingMode === 'CIF') {
        cifValueBeforeInsurance = totalExwCost;
        insurance = 0;
        cifValue = totalExwCost;
    }

    // Calculate Qatar charges
    const cifValueQar = cifValue * rates.usdToQar;
    const invoiceValueQar = totalExwCost * rates.usdToQar;
    const qatarCharges = calculateQatarFees(containers, cifValueQar, invoiceValueQar, rates);
    
    const totalQatarChargesQar = Object.values(qatarCharges).reduce((total, value) => {
        const numValue = Number(value) || 0; // Convert to number, default to 0 if NaN
        return total + numValue;
    }, 0);
    
    const totalQatarChargesUsd = totalQatarChargesQar / rates.usdToQar;

    // Certification cost (base + per-item certifications)
    const certificationCost = rates.certificationCost + totalCertificationCost;

    // Fixed costs (one-time costs not multiplied by quantity)
    const fixedCostTotal = totalFixedCost;

    // Total landed cost (before margin and commission)
    const landedCostBeforeMargin = totalExwCost + freightSubtotal + totalQatarChargesUsd + certificationCost + fixedCostTotal + insurance;

    // Calculate profit margin and commission totals
    let profitMargin = 0;
    let commission = 0;

    if (settings.profitMarginMode === 'percentage') {
        profitMargin = landedCostBeforeMargin * profitMarginSetting;
    } else {
        profitMargin = profitMarginSetting; // Fixed USD amount
    }

    const costWithMargin = landedCostBeforeMargin + profitMargin;

    if (settings.commissionMode === 'percentage') {
        commission = costWithMargin * commissionRateSetting;
    } else {
        commission = commissionRateSetting; // Fixed USD amount
    }

    const ddpTotal = costWithMargin + commission;

    // Per-item breakdown
    const itemBreakdowns = items.map(item => {
        const unitPrice = item.unitPrice ?? item.exwPrice ?? 0; // single source of truth for price
        const itemTotal = unitPrice * item.quantity;
        const valueRatio = totalExwCost > 0 ? itemTotal / totalExwCost : 0;
        const itemCbm = item.cbmPerUnit * item.quantity;
        const cbmRatio = totalCbm > 0 ? itemCbm / totalCbm : 0;

        // Calculate item-specific certification cost
        const itemCertificationCost = (item.certifications || []).reduce((sum, cert) => sum + parseNumberInput(cert.cost), 0);

        // Calculate item-specific fixed costs (one-time, not multiplied by quantity)
        const itemFixedCost = (item.fixedCosts || []).reduce((sum, cost) => sum + parseNumberInput(cost.cost), 0);

        // Allocate costs (pro-rate base certification, but add item-specific certs and fixed costs directly)
        const allocatedFreight = freightSubtotal * cbmRatio;
        const allocatedQatarCharges = totalQatarChargesUsd * valueRatio;
        const allocatedBaseCertification = rates.certificationCost * valueRatio;
        const allocatedInsurance = insurance * valueRatio;

        const itemLandedCost = itemTotal + allocatedFreight + allocatedQatarCharges +
                               allocatedBaseCertification + itemCertificationCost + itemFixedCost + allocatedInsurance;

        // Calculate profit margin (percentage or fixed USD)
        const itemMargin = settings.profitMarginMode === 'percentage'
            ? itemLandedCost * profitMarginSetting
            : profitMarginSetting * valueRatio;

        const itemWithMargin = itemLandedCost + itemMargin;

        // Calculate commission (percentage or fixed USD)
        const itemCommission = settings.commissionMode === 'percentage'
            ? itemWithMargin * commissionRateSetting
            : commissionRateSetting * valueRatio;

        const itemDdpTotal = itemWithMargin + itemCommission;
        const ddpPerUnit = item.quantity > 0 ? itemDdpTotal / item.quantity : 0;

        return {
            ...item,
            unitPrice,
            exwPrice: unitPrice, // keep for backward compatibility in consumers
            itemCbm,
            valueRatio,
            cbmRatio,
            allocatedFreight,
            allocatedQatarCharges,
            allocatedCertification: allocatedBaseCertification + itemCertificationCost,
            allocatedFixedCost: itemFixedCost,
            allocatedInsurance,
            itemLandedCost,
            itemMargin,
            itemCommission,
            itemDdpTotal,
            ddpPerUnit,
        };
    });

    // Calculate container utilization percentage
    let totalCapacity = 0;
    let fullContainerCapacity = 0;

    containers.forEach(type => {
        if (type !== 'LCL') {
            const capacity = CONTAINER_SPECS[type]?.cbm || 76;
            totalCapacity += capacity;
            fullContainerCapacity += capacity;
        }
    });

    // If LCL is present, add only the remaining CBM (not full shipment)
    if (containers.includes('LCL')) {
        const lclCbm = totalCbm - fullContainerCapacity;
        totalCapacity += lclCbm > 0 ? lclCbm : 0;
    }

    const containerUtilization = totalCapacity > 0 ? (totalCbm / totalCapacity) * 100 : 0;

    return {
        summary: {
            totalItems: items.length,
            totalQuantity: items.reduce((a, b) => a + b.quantity, 0),
            totalCbm,
            totalWeight,
            containers,
            totalExwCost,
            containerCount: containers.length,
            containerUtilization,
        },
        costs: {
            totalExwCost, // base product cost using normalized unit price
            seaFreight: seaFreightTotal,
            domesticChinaShipping,
            freightSubtotal,
            insurance,
            cifValue,
            cifValueBeforeInsurance,
            cifValueQar,
            qatarCharges,
            totalQatarChargesQar,
            totalQatarChargesUsd,
            certificationCost,
            fixedCostTotal,
            landedCostBeforeMargin,
            profitMargin,
            commission,
            ddpTotal,
        },
        itemBreakdowns,
        rates,
    };
};

/**
 * Main DDP calculation function, wrapped with memoization to prevent re-render loops.
 * @param {Array} inputItems - Array of item objects
 * @param {object} settings - Settings object (containerType, profitMargin, etc.)
 * @param {object} overrides - Rate overrides
 * @returns {object|null} Complete DDP calculation results
 */
export const calculateDDP = (inputItems, settings, overrides = {}) => {
    // Include version in input key to force recalculation if code version changes
    // Removed CALC_VERSION as debug is complete, but keeping structure for future safety
    const currentInput = { inputItems, settings, overrides };

    // If input is the same as the last call, return the cached result.
    // This is the key to breaking the infinite re-render loop.
    if (deepCompare(currentInput, lastInput)) {
        return lastResult;
    }

    // If input is different, perform the full calculation.
    const result = performDDPCalculation(inputItems, settings, overrides);

    // Cache a deep copy to avoid mutation-based staleness.
    lastInput = JSON.parse(JSON.stringify(currentInput));
    lastResult = result;

    return result;
};
