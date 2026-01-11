/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (USD, QAR, etc.)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
    // Handle invalid inputs
    if (amount === null || amount === undefined || isNaN(amount)) {
        return currency === 'USD' ? '$0.00' : `${currency} 0.00`;
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(amount);
};

/**
 * Format a number with specified decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 2) => {
    // Handle invalid inputs
    if (num === null || num === undefined || isNaN(num)) {
        return '0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};
