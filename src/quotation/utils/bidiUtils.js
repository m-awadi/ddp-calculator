/**
 * Bidirectional Text Utilities
 * Handles mixed Arabic/English text properly using Unicode Bidi algorithm
 */

/**
 * Detect text direction based on first strong character
 * @param {string} text - The text to analyze
 * @returns {'rtl' | 'ltr'} - The detected direction
 */
export const detectTextDirection = (text) => {
    if (!text) return 'ltr';

    // RTL Unicode ranges: Arabic, Hebrew, Syriac, Thaana, etc.
    const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    // LTR Unicode ranges: Latin, Greek, Cyrillic, etc.
    const ltrRegex = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u024F\u0370-\u03FF\u0400-\u04FF]/;

    for (const char of text) {
        if (rtlRegex.test(char)) return 'rtl';
        if (ltrRegex.test(char)) return 'ltr';
    }
    return 'ltr';
};

/**
 * Check if text contains Arabic characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains Arabic
 */
export const containsArabic = (text) => {
    if (!text) return false;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
};

/**
 * Check if text contains Latin characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains Latin
 */
export const containsLatin = (text) => {
    if (!text) return false;
    const latinRegex = /[A-Za-z]/;
    return latinRegex.test(text);
};

/**
 * Check if text is mixed (contains both Arabic and Latin)
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains both Arabic and Latin
 */
export const isMixedText = (text) => {
    return containsArabic(text) && containsLatin(text);
};

/**
 * Get inline style object for bidirectional text input
 * @param {string} text - The current text value
 * @returns {Object} - React inline style object
 */
export const getBidiInputStyle = (text) => {
    const direction = detectTextDirection(text);
    return {
        direction: direction,
        textAlign: direction === 'rtl' ? 'right' : 'left',
        unicodeBidi: 'plaintext'
    };
};

/**
 * Get CSS class name for bidirectional text
 * @param {string} text - The text to check
 * @returns {string} - CSS class name
 */
export const getBidiClassName = (text) => {
    const direction = detectTextDirection(text);
    return direction === 'rtl' ? 'bidi-rtl' : 'bidi-ltr';
};

/**
 * Wrap text with Unicode bidi control characters for HTML
 * Uses First Strong Isolate (FSI) which automatically detects direction
 * @param {string} text - The text to wrap
 * @returns {string} - Text with bidi control characters
 */
export const wrapWithBidiIsolate = (text) => {
    if (!text) return text;
    // U+2068 = First Strong Isolate (FSI) - auto-detects direction
    // U+2069 = Pop Directional Isolate (PDI)
    return '\u2068' + text + '\u2069';
};

/**
 * Wrap text with explicit RTL isolate for HTML
 * @param {string} text - The text to wrap
 * @returns {string} - Text with RTL isolate control characters
 */
export const wrapWithRtlIsolate = (text) => {
    if (!text) return text;
    // U+2067 = Right-to-Left Isolate (RLI)
    // U+2069 = Pop Directional Isolate (PDI)
    return '\u2067' + text + '\u2069';
};

/**
 * Wrap text with explicit LTR isolate for HTML
 * @param {string} text - The text to wrap
 * @returns {string} - Text with LTR isolate control characters
 */
export const wrapWithLtrIsolate = (text) => {
    if (!text) return text;
    // U+2066 = Left-to-Right Isolate (LRI)
    // U+2069 = Pop Directional Isolate (PDI)
    return '\u2066' + text + '\u2069';
};

/**
 * Get HTML dir attribute value for text
 * @param {string} text - The text to analyze
 * @returns {string} - 'rtl', 'ltr', or 'auto'
 */
export const getHtmlDirAttribute = (text) => {
    if (isMixedText(text)) {
        // For mixed text, use 'auto' which applies FSI behavior
        return 'auto';
    }
    return detectTextDirection(text);
};

/**
 * Create a bidi-safe HTML span element
 * @param {string} text - The text content
 * @param {string} [className] - Optional CSS class
 * @returns {string} - HTML span with proper bidi attributes
 */
export const createBidiSpan = (text, className = '') => {
    if (!text) return '';
    const dir = getHtmlDirAttribute(text);
    const classAttr = className ? ` class="${className}"` : '';
    // Using <bdi> element which provides automatic bidi isolation
    return `<bdi dir="${dir}"${classAttr}>${escapeHtml(text)}</bdi>`;
};

/**
 * Escape HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} - Escaped HTML
 */
export const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Process text for HTML output with proper bidi handling
 * Converts newlines to <br> and wraps in bidi-aware element
 * @param {string} text - The text to process
 * @returns {string} - HTML-safe text with bidi support
 */
export const processTextForHtml = (text) => {
    if (!text) return '';
    const dir = getHtmlDirAttribute(text);
    const escaped = escapeHtml(text).replace(/\n/g, '<br>');
    return `<span dir="${dir}" style="unicode-bidi: isolate;">${escaped}</span>`;
};

/**
 * CSS styles for bidi text support (can be injected into HTML)
 */
export const BIDI_CSS = `
/* Bidirectional text support */
.bidi-text {
    unicode-bidi: plaintext;
}

.bidi-rtl {
    direction: rtl;
    text-align: right;
    unicode-bidi: isolate;
}

.bidi-ltr {
    direction: ltr;
    text-align: left;
    unicode-bidi: isolate;
}

/* For mixed content containers */
.bidi-container {
    unicode-bidi: isolate;
}

/* Input fields with automatic direction */
input.bidi-auto,
textarea.bidi-auto {
    unicode-bidi: plaintext;
}

input.bidi-auto:dir(rtl),
textarea.bidi-auto:dir(rtl) {
    text-align: right;
}

input.bidi-auto:dir(ltr),
textarea.bidi-auto:dir(ltr) {
    text-align: left;
}
`;

export default {
    detectTextDirection,
    containsArabic,
    containsLatin,
    isMixedText,
    getBidiInputStyle,
    getBidiClassName,
    wrapWithBidiIsolate,
    wrapWithRtlIsolate,
    wrapWithLtrIsolate,
    getHtmlDirAttribute,
    createBidiSpan,
    escapeHtml,
    processTextForHtml,
    BIDI_CSS
};
