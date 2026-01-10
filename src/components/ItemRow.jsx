import { useState } from 'react';
import Input from './Input';

const ItemRow = ({ item, index, onUpdate, onRemove, pricingMode = 'EXW' }) => {
    const [showCertifications, setShowCertifications] = useState(false);

    // Dynamic price label based on pricing mode
    const priceLabel = pricingMode === 'FOB' ? 'FOB Price' : 'EXW Price';

    // CBM input mode handling
    const cbmInputMode = item.cbmInputMode || 'perUnit';
    const cbmValue = cbmInputMode === 'perUnit' ? (item.cbmPerUnit || 0) : ((item.cbmPerUnit || 0) * item.quantity);

    const handleCbmChange = (value) => {
        const numValue = parseFloat(value) || 0;
        if (cbmInputMode === 'perUnit') {
            onUpdate(index, 'cbmPerUnit', numValue);
        } else {
            onUpdate(index, 'cbmPerUnit', item.quantity > 0 ? numValue / item.quantity : 0);
        }
    };

    // Weight input mode handling
    const weightInputMode = item.weightInputMode || 'perUnit';
    const weightValue = weightInputMode === 'perUnit' ? (item.weightPerUnit || 0) : ((item.weightPerUnit || 0) * item.quantity);

    const handleWeightChange = (value) => {
        const numValue = parseFloat(value) || 0;
        if (weightInputMode === 'perUnit') {
            onUpdate(index, 'weightPerUnit', numValue);
        } else {
            onUpdate(index, 'weightPerUnit', item.quantity > 0 ? numValue / item.quantity : 0);
        }
    };

    // Certification management
    const addCertification = () => {
        const certifications = item.certifications || [];
        onUpdate(index, 'certifications', [...certifications, { name: '', cost: 0 }]);
        setShowCertifications(true);
    };

    const removeCertification = (certIndex) => {
        const certifications = item.certifications || [];
        onUpdate(index, 'certifications', certifications.filter((_, i) => i !== certIndex));
    };

    const updateCertification = (certIndex, field, value) => {
        const certifications = [...(item.certifications || [])];
        certifications[certIndex][field] = value;
        onUpdate(index, 'certifications', certifications);
    };

    const totalCertificationCost = (item.certifications || []).reduce((sum, cert) => sum + (parseFloat(cert.cost) || 0), 0);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
            gap: '12px',
            padding: '16px',
            background: index % 2 === 0 ? 'var(--bg-card)' : 'transparent',
            borderRadius: '8px',
            alignItems: 'start',
        }}>
            {/* Description */}
            <div>
                {index === 0 && (
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Description
                    </label>
                )}
                <Input
                    label={null}
                    value={item.description}
                    onChange={v => onUpdate(index, 'description', v)}
                    placeholder="Product name"
                />
            </div>

            {/* Quantity */}
            <div>
                {index === 0 && (
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Quantity
                    </label>
                )}
                <Input
                    label={null}
                    type="number"
                    value={item.quantity}
                    onChange={v => onUpdate(index, 'quantity', parseInt(v) || 0)}
                    min="1"
                />
            </div>

            {/* EXW/FOB Price */}
            <div>
                {index === 0 && (
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {priceLabel}
                    </label>
                )}
                <Input
                    label={null}
                    type="number"
                    value={item.exwPrice}
                    onChange={v => onUpdate(index, 'exwPrice', parseFloat(v) || 0)}
                    prefix="$"
                    step="0.01"
                />
            </div>

            {/* CBM with toggle */}
            <div>
                {index === 0 && (
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Volume (CBM)
                    </label>
                )}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <button
                        onClick={() => onUpdate(index, 'cbmInputMode', 'perUnit')}
                        style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: cbmInputMode === 'perUnit' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: cbmInputMode === 'perUnit' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: '0.2s',
                        }}
                    >
                        /Unit
                    </button>
                    <button
                        onClick={() => onUpdate(index, 'cbmInputMode', 'total')}
                        style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: cbmInputMode === 'total' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: cbmInputMode === 'total' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: '0.2s',
                        }}
                    >
                        Total
                    </button>
                </div>
                <Input
                    label={null}
                    type="number"
                    value={cbmValue}
                    onChange={handleCbmChange}
                    suffix="m³"
                    step="0.001"
                />
            </div>

            {/* Weight with toggle */}
            <div>
                {index === 0 && (
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Weight
                    </label>
                )}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <button
                        onClick={() => onUpdate(index, 'weightInputMode', 'perUnit')}
                        style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: weightInputMode === 'perUnit' ? 'var(--accent-amber)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: weightInputMode === 'perUnit' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: '0.2s',
                        }}
                    >
                        /Unit
                    </button>
                    <button
                        onClick={() => onUpdate(index, 'weightInputMode', 'total')}
                        style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: weightInputMode === 'total' ? 'var(--accent-amber)' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: weightInputMode === 'total' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: '0.2s',
                        }}
                    >
                        Total
                    </button>
                </div>
                <Input
                    label={null}
                    type="number"
                    value={weightValue}
                    onChange={handleWeightChange}
                    suffix="kg"
                    step="0.1"
                />
            </div>

            {/* Remove button */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                {index === 0 && (
                    <div style={{ height: '28px' }} />
                )}
                <button
                    onClick={() => onRemove(index)}
                    style={{
                        padding: '10px 12px',
                        background: 'var(--accent-rose)20',
                        border: '1px solid var(--accent-rose)40',
                        borderRadius: '6px',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: '0.2s',
                        marginTop: index === 0 ? '6px' : '0',
                    }}
                    onMouseEnter={e => {
                        e.target.style.background = 'var(--accent-rose)';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                        e.target.style.background = 'var(--accent-rose)20';
                        e.target.style.color = 'var(--accent-rose)';
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Certifications Section - spans all columns */}
            <div style={{ gridColumn: '1 / -1', marginTop: '-8px', marginBottom: '8px' }}>
                <button
                    onClick={() => setShowCertifications(!showCertifications)}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: showCertifications ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: showCertifications ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: '0.2s',
                        marginRight: '8px',
                    }}
                >
                    {showCertifications ? '▼' : '▶'} Certifications & Lab Tests {totalCertificationCost > 0 ? `($${totalCertificationCost.toFixed(2)})` : ''}
                </button>

                {showCertifications && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                    }}>
                        {(item.certifications || []).map((cert, certIndex) => (
                            <div key={certIndex} style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr auto',
                                gap: '8px',
                                marginBottom: '8px',
                                alignItems: 'end',
                            }}>
                                <Input
                                    label={certIndex === 0 ? "Certificate/Test Name" : null}
                                    value={cert.name}
                                    onChange={v => updateCertification(certIndex, 'name', v)}
                                    placeholder="e.g., FDA, CE, Lab Test"
                                />
                                <Input
                                    label={certIndex === 0 ? "Cost (USD)" : null}
                                    type="number"
                                    value={cert.cost}
                                    onChange={v => updateCertification(certIndex, 'cost', parseFloat(v) || 0)}
                                    prefix="$"
                                    step="0.01"
                                />
                                <button
                                    onClick={() => removeCertification(certIndex)}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'var(--accent-rose)20',
                                        border: '1px solid var(--accent-rose)40',
                                        borderRadius: '6px',
                                        color: 'var(--accent-rose)',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginBottom: certIndex === 0 ? '16px' : '0',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={addCertification}
                            style={{
                                padding: '8px 16px',
                                fontSize: '12px',
                                background: 'var(--accent-cyan)20',
                                border: '1px solid var(--accent-cyan)40',
                                borderRadius: '6px',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                transition: '0.2s',
                                marginTop: (item.certifications || []).length > 0 ? '4px' : '0',
                            }}
                        >
                            + Add Certificate/Test
                        </button>

                        {totalCertificationCost > 0 && (
                            <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--border)',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                            }}>
                                Total Certification Cost: ${totalCertificationCost.toFixed(2)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemRow;
