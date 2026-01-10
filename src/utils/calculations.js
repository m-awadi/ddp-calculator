import { CONTAINER_SPECS, DEFAULT_RATES, MOFA_FEE_TIERS, CERTIFICATE_OF_ORIGIN_FEE } from './constants.js';

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
    let remainingCbm = totalCbm;

    // Try to fit into full containers
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

    return {
        customsDuty,
        mwaniCharges: rates.qatarClearance.mwaniCharges,
        deliveryOrderFees,
        terminalHandling,
        containerReturn,
        containerMaintenance,
        terminalInspection: rates.qatarClearance.terminalInspection,
        inspectionCharge: rates.qatarClearance.inspectionCharge,
        clearanceAgentFees: rates.qatarClearance.clearanceAgentFees,
        documentAttestation: mofaAttestation,
        localTransport: rates.localTransport,
    };
};

/**
 * Main DDP calculation function
 * @param {Array} items - Array of item objects
 * @param {object} settings - Settings object (containerType, profitMargin, etc.)
 * @param {object} overrides - Rate overrides
 * @returns {object|null} Complete DDP calculation results
 */
export const calculateDDP = (items, settings, overrides = {}) => {
    if (!items.length) return null;

    const rates = { ...DEFAULT_RATES, ...overrides };

    // Calculate totals
    let totalCbm = 0;
    let totalWeight = 0;
    let totalExwCost = 0;
    let totalCertificationCost = 0;

    items.forEach(item => {
        const itemCbm = item.cbmPerUnit * item.quantity;
        const itemWeight = (item.weightPerUnit || 0) * item.quantity;
        totalCbm += itemCbm;
        totalWeight += itemWeight;
        totalExwCost += item.unitPrice * item.quantity;

        // Add certification costs for this item
        if (item.certifications && Array.isArray(item.certifications)) {
            item.certifications.forEach(cert => {
                totalCertificationCost += parseFloat(cert.cost) || 0;
            });
        }
    });

    // Select containers
    let containers = selectContainers(totalCbm);

    // Override with selected container if specified
    if (settings.containerType && settings.containerType !== 'auto') {
        containers = [settings.containerType];
    }

    // Calculate sea freight
    let seaFreightTotal = calculateSeaFreight(containers, rates);

    // Override if specified
    if (overrides.seaFreightOverride) {
        seaFreightTotal = overrides.seaFreightOverride;
    }

    // Domestic China shipping (only for EXW, FOB includes it in the price)
    let domesticChinaShipping = 0;
    if (settings.pricingMode === 'EXW' || !settings.pricingMode) {
        if (overrides.domesticChinaShippingOverride !== null && overrides.domesticChinaShippingOverride !== undefined) {
            domesticChinaShipping = overrides.domesticChinaShippingOverride;
        } else {
            const domesticChinaRate = overrides.domesticChinaPerCbmOverride || rates.domesticChinaPerCbm;
            domesticChinaShipping = totalCbm * domesticChinaRate;
        }
    }

    // Calculate freight subtotal
    const freightSubtotal = seaFreightTotal + domesticChinaShipping;

    // CIF Value (Cost + Insurance + Freight)
    const cifValue = totalExwCost + freightSubtotal;
    const insurance = cifValue * rates.insuranceRate;
    const cifWithInsurance = cifValue + insurance;

    // Convert to QAR for Qatar charges
    const cifValueQar = cifWithInsurance * rates.usdToQar;
    const invoiceValueQar = totalExwCost * rates.usdToQar;

    // Qatar customs and clearance (all in QAR)
    const qatarCharges = calculateQatarFees(containers, cifValueQar, invoiceValueQar, rates);
    const totalQatarChargesQar = Object.values(qatarCharges).reduce((a, b) => a + b, 0);
    const totalQatarChargesUsd = totalQatarChargesQar / rates.usdToQar;

    // Certification cost (base + per-item certifications)
    const certificationCost = rates.certificationCost + totalCertificationCost;

    // Total landed cost (before margin and commission)
    const landedCostBeforeMargin = totalExwCost + freightSubtotal + totalQatarChargesUsd + certificationCost + insurance;

    // Calculate profit margin and commission totals
    let profitMargin = 0;
    let commission = 0;

    if (settings.profitMarginMode === 'percentage') {
        profitMargin = landedCostBeforeMargin * settings.profitMargin;
    } else {
        profitMargin = settings.profitMargin; // Fixed USD amount
    }

    const costWithMargin = landedCostBeforeMargin + profitMargin;

    if (settings.commissionMode === 'percentage') {
        commission = costWithMargin * settings.commissionRate;
    } else {
        commission = settings.commissionRate; // Fixed USD amount
    }

    const ddpTotal = costWithMargin + commission;

    // Per-item breakdown
    const itemBreakdowns = items.map(item => {
        const itemTotal = item.unitPrice * item.quantity;
        const valueRatio = itemTotal / totalExwCost;
        const itemCbm = item.cbmPerUnit * item.quantity;
        const cbmRatio = itemCbm / totalCbm;

        // Calculate item-specific certification cost
        const itemCertificationCost = (item.certifications || []).reduce((sum, cert) => sum + (parseFloat(cert.cost) || 0), 0);

        // Allocate costs (pro-rate base certification, but add item-specific certs directly)
        const allocatedFreight = freightSubtotal * cbmRatio;
        const allocatedQatarCharges = totalQatarChargesUsd * valueRatio;
        const allocatedBaseCertification = rates.certificationCost * valueRatio;
        const allocatedInsurance = insurance * valueRatio;

        const itemLandedCost = itemTotal + allocatedFreight + allocatedQatarCharges +
                               allocatedBaseCertification + itemCertificationCost + allocatedInsurance;

        // Calculate profit margin (percentage or fixed USD)
        const itemMargin = settings.profitMarginMode === 'percentage'
            ? itemLandedCost * settings.profitMargin
            : settings.profitMargin * valueRatio;

        const itemWithMargin = itemLandedCost + itemMargin;

        // Calculate commission (percentage or fixed USD)
        const itemCommission = settings.commissionMode === 'percentage'
            ? itemWithMargin * settings.commissionRate
            : settings.commissionRate * valueRatio;

        const itemDdpTotal = itemWithMargin + itemCommission;
        const ddpPerUnit = itemDdpTotal / item.quantity;

        return {
            ...item,
            itemCbm,
            valueRatio,
            cbmRatio,
            allocatedFreight,
            allocatedQatarCharges,
            allocatedCertification: allocatedBaseCertification + itemCertificationCost,
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
        totalCapacity += lclCbm;
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
            totalExwCost,
            seaFreight: seaFreightTotal,
            domesticChinaShipping,
            freightSubtotal,
            insurance,
            cifValue,
            cifWithInsurance,
            cifValueQar,
            qatarCharges,
            totalQatarChargesQar,
            totalQatarChargesUsd,
            certificationCost,
            landedCostBeforeMargin,
            profitMargin,
            commission,
            ddpTotal,
        },
        itemBreakdowns,
        rates,
    };
};
