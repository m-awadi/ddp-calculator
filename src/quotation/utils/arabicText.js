/**
 * Utility for handling Arabic text in PDFs
 * jsPDF has limited Arabic support, so we use this helper
 */

/**
 * Preserve Arabic text for PDF rendering
 * In practice, jsPDF has limitations with Arabic, but we try our best
 * For better results, use the HTML print method
 */
export const preserveArabicText = (text) => {
    // For now, just return the text as-is
    // The HTML print method handles Arabic properly
    // jsPDF direct generation has limited Arabic support
    return text;
};

/**
 * Check if text contains Arabic characters
 */
export const containsArabic = (text) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
};

/**
 * Reverse text for RTL display (basic implementation)
 * Note: This is a simplified approach. For production, use proper RTL libraries
 */
export const reverseForRTL = (text) => {
    if (!containsArabic(text)) return text;
    return text.split('').reverse().join('');
};
