import { formatCurrency } from '../utils/formatters';

const CostRow = ({ label, amount, currency = 'USD', highlight, indent, bold, previewAmount = null, showPreview = false }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        paddingLeft: indent ? '20px' : '0',
        borderBottom: '1px solid var(--border)',
    }}>
        <span style={{
            color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: bold ? '15px' : '14px',
            fontWeight: bold ? '600' : '400',
        }}>
            {label}
        </span>
        <span style={{
            color: highlight ? 'var(--accent-emerald)' : 'var(--text-primary)',
            fontSize: bold ? '16px' : '14px',
            fontWeight: bold ? '700' : '500',
        }} className="mono">
            {showPreview && previewAmount !== null ? (
                <span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>
                        {formatCurrency(previewAmount, currency)}
                    </span>
                    {' '}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        ({formatCurrency(amount, currency)})
                    </span>
                </span>
            ) : (
                formatCurrency(amount, currency)
            )}
        </span>
    </div>
);

export default CostRow;
