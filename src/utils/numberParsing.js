export const parseNumberInput = (value) => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    const trimmed = String(value).trim();
    if (!trimmed) return 0;

    let normalized = trimmed.replace(/\s/g, '');
    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
        const lastComma = normalized.lastIndexOf(',');
        const lastDot = normalized.lastIndexOf('.');
        if (lastComma > lastDot) {
            normalized = normalized.replace(/\./g, '');
            normalized = normalized.replace(',', '.');
        } else {
            normalized = normalized.replace(/,/g, '');
        }
    } else if (hasComma && !hasDot) {
        const parts = normalized.split(',');
        if (parts.length > 2) {
            normalized = parts.join('');
        } else {
            const [intPart, fracPart] = parts;
            const isZeroInt = intPart === '0';
            if (fracPart && fracPart.length === 3 && !isZeroInt) {
                normalized = `${intPart}${fracPart}`;
            } else {
                normalized = `${intPart}.${fracPart || ''}`;
            }
        }
    }

    normalized = normalized.replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};
