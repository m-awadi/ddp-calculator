import { useState } from 'react';

const Card = ({ title, children, accent, collapsible = false, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${accent || 'var(--border)'}`,
            borderRadius: '12px',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease-out',
        }}>
            <div
                onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
                style={{
                    padding: '16px 20px',
                    borderBottom: isOpen ? `1px solid var(--border)` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: collapsible ? 'pointer' : 'default',
                    userSelect: 'none',
                }}
            >
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: accent || 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {title}
                </h3>
                {collapsible && (
                    <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                        ▼
                    </span>
                )}
            </div>
            {isOpen && (
                <div style={{
                    padding: '20px',
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default Card;
