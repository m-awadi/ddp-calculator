import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

describe('formatters', () => {
    describe('formatCurrency', () => {
        it('should format USD currency correctly', () => {
            const result = formatCurrency(1234.56, 'USD');
            expect(result).toContain('1,234.56');
            expect(result).toContain('$');
        });

        it('should format QAR currency correctly', () => {
            const result = formatCurrency(4506.14, 'QAR');
            expect(result).toContain('4,506.14');
            expect(result).toContain('QAR');
        });

        it('should default to USD when no currency specified', () => {
            const result = formatCurrency(100);
            expect(result).toContain('100.00');
            expect(result).toContain('$');
        });

        it('should handle zero correctly', () => {
            const result = formatCurrency(0);
            expect(result).toContain('0.00');
        });

        it('should handle negative numbers', () => {
            const result = formatCurrency(-50.25, 'USD');
            expect(result).toContain('50.25');
        });

        it('should round to 2 decimal places', () => {
            const result = formatCurrency(10.999, 'USD');
            expect(result).toContain('11.00');
        });
    });

    describe('formatNumber', () => {
        it('should format number with default 2 decimals', () => {
            expect(formatNumber(1234.56)).toBe('1,234.56');
        });

        it('should format number with custom decimals', () => {
            expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
        });

        it('should format number with no decimals', () => {
            expect(formatNumber(1234, 0)).toBe('1,234');
        });

        it('should handle zero correctly', () => {
            expect(formatNumber(0)).toBe('0.00');
        });

        it('should add thousand separators', () => {
            expect(formatNumber(1234567.89)).toBe('1,234,567.89');
        });

        it('should pad with zeros', () => {
            expect(formatNumber(10, 4)).toBe('10.0000');
        });
    });
});
