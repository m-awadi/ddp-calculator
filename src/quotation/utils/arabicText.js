/**
 * Utility for handling Arabic text in PDFs
 * jsPDF has limited Arabic support, so we use this helper
 */

import { detectTextDirection as detectDir, containsArabic as checkArabic, containsLatin } from './bidiUtils';

/**
 * Preserve Arabic text for PDF rendering
 * In practice, jsPDF has limitations with Arabic, but we try our best
 * For better results, use the HTML print method
 *
 * For mixed text (Arabic + English), we wrap with Unicode bidi isolates
 * to help maintain proper reading order
 */
export const preserveArabicText = (text) => {
    if (!text) return text;

    // If text contains both Arabic and Latin characters, it's mixed
    // We use First Strong Isolate (FSI) to auto-detect direction
    if (checkArabic(text) && containsLatin(text)) {
        // U+2068 = First Strong Isolate (FSI)
        // U+2069 = Pop Directional Isolate (PDI)
        return '\u2068' + text + '\u2069';
    }

    return text;
};

/**
 * Check if text contains Arabic characters
 */
export const containsArabic = (text) => {
    return checkArabic(text);
};

/**
 * Detect text direction based on first strong character
 * @param {string} text - The text to analyze
 * @returns {'rtl' | 'ltr'} - The detected direction
 */
export const detectTextDirection = (text) => {
    return detectDir(text);
};

/**
 * Reverse text for RTL display (basic implementation)
 * Note: This is a simplified approach. For production, use proper RTL libraries
 * @deprecated Use preserveArabicText with bidi isolates instead
 */
export const reverseForRTL = (text) => {
    if (!checkArabic(text)) return text;
    return text.split('').reverse().join('');
};

/**
 * Process text for jsPDF with proper bidi handling
 * @param {string} text - The text to process
 * @returns {string} - Processed text with bidi markers
 */
export const processTextForPDF = (text) => {
    if (!text) return text;

    const direction = detectDir(text);

    // For RTL text that contains LTR segments, wrap the whole thing
    if (direction === 'rtl' && containsLatin(text)) {
        // Right-to-Left Isolate + text + Pop Directional Isolate
        return '\u2067' + text + '\u2069';
    }

    // For LTR text that contains RTL segments
    if (direction === 'ltr' && checkArabic(text)) {
        // Left-to-Right Isolate + text + Pop Directional Isolate
        return '\u2066' + text + '\u2069';
    }

    return text;
};
