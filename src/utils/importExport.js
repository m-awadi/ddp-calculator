/**
 * Generate a template with sample data and documentation
 * @returns {string} JSON template string
 */
export const generateTemplate = () => {
    const template = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        _documentation: {
            description: 'DDP Calculator Data Template',
            usage: 'Fill in the items array with your products, adjust settings, and import this file',
            pricingModes: {
                EXW: 'Ex Works - Buyer pays domestic China shipping',
                FOB: 'Free On Board - Domestic shipping included in price',
                CIF: 'Cost, Insurance & Freight - Price includes sea freight and insurance'
            },
            containerTypes: ['auto', '20GP', '40GP', '40HC', 'LCL'],
            fields: {
                items: {
                    description: 'Product name or description',
                    quantity: 'Number of units',
                    unitType: 'Unit type (e.g., pcs, roll, box) - optional',
                    unitPrice: 'Price per unit in USD (EXW, FOB, or CIF depending on pricing mode)',
                    cbmPerUnit: 'Volume per unit in cubic meters',
                    weightPerUnit: 'Weight per unit in kilograms',
                    cbmInputMode: 'perUnit or total',
                    weightInputMode: 'perUnit or total',
                    certifications: 'Array of {name: string, cost: number} for product certifications',
                    fixedCosts: 'Array of {name: string, cost: number} for one-time costs (tooling, setup, samples)'
                },
                settings: {
                    pricingMode: 'EXW, FOB, or CIF',
                    containerType: 'auto, 20GP, 40GP, 40HC, or LCL',
                    profitMargin: 'Profit margin value',
                    profitMarginMode: 'percentage or fixed',
                    commissionRate: 'Commission rate value',
                    commissionMode: 'percentage or fixed'
                },
                reportName: 'Optional project/customer name for report identification',
                manufacturerName: 'Optional manufacturer/supplier name for PDF header'
            }
        },
        reportName: 'ABC Trading Company',
        manufacturerName: 'Guangzhou Manufacturing Co., Ltd.',
        items: [
            {
                description: 'Sample Product A',
                quantity: 100,
                unitType: 'pcs',
                unitPrice: 12.50,
                cbmPerUnit: 0.15,
                weightPerUnit: 5,
                cbmInputMode: 'perUnit',
                weightInputMode: 'perUnit',
                certifications: [
                    { name: 'CE Certification', cost: 150 },
                    { name: 'FDA Approval', cost: 200 }
                ],
                fixedCosts: [
                    { name: 'Tooling', cost: 500 },
                    { name: 'Sample Production', cost: 100 }
                ]
            },
            {
                description: 'Sample Product B',
                quantity: 200,
                unitType: 'roll',
                unitPrice: 8.75,
                cbmPerUnit: 0.08,
                weightPerUnit: 3,
                cbmInputMode: 'perUnit',
                weightInputMode: 'perUnit',
                certifications: [],
                fixedCosts: []
            }
        ],
        settings: {
            pricingMode: 'EXW',
            containerType: 'auto',
            profitMargin: 0.15,
            profitMarginMode: 'percentage',
            commissionRate: 0.06,
            commissionMode: 'percentage'
        },
        overrides: {
            seaFreightOverride: null,
            domesticChinaShippingOverride: null,
            customsDutyRate: null
        },
        customsPreview: {
            enabled: false,
            invoiceCostOverride: null,
            shippingCostOverride: null
        }
    };

    return JSON.stringify(template, null, 2);
};

/**
 * Download template file
 * @param {string} filename - Optional filename
 */
export const downloadTemplate = (filename = 'DDP-Calculator-Template.json') => {
    const jsonString = generateTemplate();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Export all form data to a JSON file
 * @param {Array} items - The items array
 * @param {Object} settings - The settings object
 * @param {Object} overrides - The overrides object
 * @param {Object} customsPreview - The customs preview settings
 * @param {string} reportName - Optional report name
 * @param {string} manufacturerName - Optional manufacturer/supplier name
 * @returns {string} JSON string of all data
 */
export const exportFormData = (items, settings, overrides, customsPreview, reportName = '', manufacturerName = '') => {
    const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        reportName: reportName,
        manufacturerName: manufacturerName,
        items: items,
        settings: settings,
        overrides: overrides,
        customsPreview: customsPreview
    };

    return JSON.stringify(data, null, 2);
};

/**
 * Download form data as a JSON file
 * @param {Array} items - The items array
 * @param {Object} settings - The settings object
 * @param {Object} overrides - The overrides object
 * @param {Object} customsPreview - The customs preview settings
 * @param {string} reportName - Optional report name
 * @param {string} manufacturerName - Optional manufacturer/supplier name
 * @param {string} filename - Optional filename
 */
export const downloadFormData = (items, settings, overrides, customsPreview, reportName = '', manufacturerName = '', filename = null) => {
    const jsonString = exportFormData(items, settings, overrides, customsPreview, reportName, manufacturerName);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultFilename = `DDP-Calculator-Data-${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Validate imported data structure
 * @param {Object} data - The imported data object
 * @returns {Object} Validation result with { valid: boolean, error: string }
 */
export const validateImportData = (data) => {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data format' };
    }

    if (!Array.isArray(data.items)) {
        return { valid: false, error: 'Items data is missing or invalid' };
    }

    if (!data.settings || typeof data.settings !== 'object') {
        return { valid: false, error: 'Settings data is missing or invalid' };
    }

    // Validate items structure
    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        // Support both old (exwPrice) and new (unitPrice) formats
        const hasPrice = typeof item.unitPrice !== 'undefined' || typeof item.exwPrice !== 'undefined';
        if (typeof item.quantity === 'undefined' || !hasPrice || typeof item.cbmPerUnit === 'undefined') {
            return { valid: false, error: `Item ${i + 1} is missing required fields` };
        }
        // Convert old format to new format
        if (typeof item.exwPrice !== 'undefined' && typeof item.unitPrice === 'undefined') {
            item.unitPrice = item.exwPrice;
            delete item.exwPrice;
        }
    }

    return { valid: true };
};

/**
 * Import form data from JSON string
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} Parsed data object or null if invalid
 */
export const importFormData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        const validation = validateImportData(data);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const pricingModeRaw = data.settings?.pricingMode || 'EXW';
        const pricingMode = typeof pricingModeRaw === 'string'
            ? pricingModeRaw.toUpperCase()
            : 'EXW';
        const normalizedPricingMode = ['EXW', 'FOB', 'CIF'].includes(pricingMode) ? pricingMode : 'EXW';

        return {
            items: data.items || [],
            settings: {
                ...(data.settings || {}),
                pricingMode: normalizedPricingMode
            },
            overrides: data.overrides || {},
            customsPreview: data.customsPreview || { enabled: false, invoiceCostOverride: null, shippingCostOverride: null },
            reportName: data.reportName || '',
            manufacturerName: data.manufacturerName || ''
        };
    } catch (error) {
        console.error('Error importing form data:', error);
        throw error;
    }
};

/**
 * Read file and import form data
 * @param {File} file - The file object to read
 * @returns {Promise<Object>} Promise that resolves with the imported data
 */
export const importFormDataFromFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        if (!file.name.endsWith('.json')) {
            reject(new Error('Please select a JSON file'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = importFormData(e.target.result);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsText(file);
    });
};
