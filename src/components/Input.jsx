const Input = ({ label, type = 'text', value, onChange, prefix, suffix, hint, step, placeholder, min }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {prefix && (
                    <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '14px',
                        pointerEvents: 'none',
                    }}>
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    step={step}
                    min={min}
                    style={{
                        width: '100%',
                        padding: prefix ? '10px 12px 10px 32px' : suffix ? '10px 32px 10px 12px' : '10px 12px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: type === 'number' ? '"Space Mono", monospace' : 'inherit',
                        outline: 'none',
                        transition: '0.2s',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--border-focus)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                {suffix && (
                    <span style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        pointerEvents: 'none',
                    }}>
                        {suffix}
                    </span>
                )}
            </div>
            {hint && (
                <span style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '-2px',
                }}>
                    {hint}
                </span>
            )}
        </div>
    );
};

export default Input;
