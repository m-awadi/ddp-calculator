// Container specifications
export const CONTAINER_SPECS = {
    '20GP': { cbm: 33, maxWeight: 28000, name: "20' Standard" },
    '40GP': { cbm: 67, maxWeight: 28000, name: "40' Standard" },
    '40HC': { cbm: 76, maxWeight: 28000, name: "40' High Cube" },
};

// Default rates and configuration
export const DEFAULT_RATES = {
    // Sea freight rates from China to Qatar (USD)
    seaFreight: {
        '20GP': 1800,
        '40GP': 3200,
        '40HC': 3400,
    },
    // Qatar clearance costs (QAR) - CMA CGM Tariff Structure
    qatarClearance: {
        customsDutyRate: 0.05, // 5% standard
        mwaniCharges: 160,
        deliveryOrder: {
            '20GP': 650,
            '40GP': 1000,
            '40HC': 1100,
        },
        terminalHandling: {
            '20GP': 650,
            '40GP': 1000,
            '40HC': 1100,
        },
        containerReturn: {
            '20GP': 150,
            '40GP': 300,
            '40HC': 380,
        },
        containerMaintenance: {
            '20GP': 20.02,
            '40GP': 40.04,
            '40HC': 40.04,
        },
        terminalInspection: 35,
        inspectionCharge: 50,
        clearanceAgentFees: 250,
        documentAttestation: 100, // This will be overridden by MOFA calculation
    },
    // Local transportation in Qatar (QAR)
    localTransport: 800,
    // Domestic China shipping (USD per CBM)
    domesticChinaPerCbm: 15,
    // Insurance rate (% of CIF)
    insuranceRate: 0.005,
    // Certification cost per shipment (USD)
    certificationCost: 150,
    // USD to QAR exchange rate
    usdToQar: 3.65,
    // Default profit margin
    profitMargin: 0.15,
    // Default commission rate
    commissionRate: 0.06,
};

// MOFA attestation fee tiers (QAR)
export const MOFA_FEE_TIERS = [
    { max: 15000, fee: 500 },
    { max: 100000, fee: 1000 },
    { max: 250000, fee: 2500 },
    { max: 1000000, fee: 5000 },
    { max: Infinity, fee: null, percentage: 0.006 }, // 0.6% for above 1M
];

// Certificate of Origin fixed fee (QAR)
export const CERTIFICATE_OF_ORIGIN_FEE = 150;
