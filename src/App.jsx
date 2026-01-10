import { useState, useMemo } from 'react';
import { calculateDDP } from './utils/calculations.js';
import { formatCurrency, formatNumber } from './utils/formatters.js';
import { DEFAULT_RATES } from './utils/constants.js';
import Card from './components/Card';
import Input from './components/Input';
import ItemRow from './components/ItemRow';
import ResultsPanel from './components/ResultsPanel';

function App() {
    // State
    const [items, setItems] = useState([
        { description: '', quantity: 1, exwPrice: 0, cbmPerUnit: 0.01, weightPerUnit: 0, cbmInputMode: 'perUnit', certifications: [] }
    ]);

    const [settings, setSettings] = useState({
        containerType: 'auto',
        profitMargin: 0,
        profitMarginMode: 'percentage',
        commissionRate: 0,
        commissionMode: 'percentage',
    });

    const [overrides, setOverrides] = useState({
        seaFreightOverride: null,
        domesticChinaPerCbmOverride: null,
    });

    // Item management
    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, exwPrice: 0, cbmPerUnit: 0.01, weightPerUnit: 0, cbmInputMode: 'perUnit', certifications: [] }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    // Calculate results
    const results = useMemo(() => {
        const validItems = items.filter(item => item.quantity > 0 && item.exwPrice > 0 && item.cbmPerUnit > 0);
        if (validItems.length === 0) return null;
        return calculateDDP(validItems, settings, overrides);
    }, [items, settings, overrides]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    padding: '2.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)',
                }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                        🚢 DDP Calculator
                    </h1>
                    <p style={{ fontSize: '1.1rem', opacity: 0.95 }}>
                        Professional China-Qatar Shipping Cost Calculator
                    </p>
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.85 }}>
                        1 USD = {DEFAULT_RATES.usdToQar} QAR
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Items Section */}
                    <Card title="📦 Items" accent="var(--accent-blue)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map((item, index) => (
                                <ItemRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>
                        <button
                            onClick={addItem}
                            style={{
                                marginTop: '16px',
                                padding: '12px 24px',
                                background: 'var(--accent-blue)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: '0.2s',
                            }}
                            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                        >
                            + Add Item
                        </button>
                    </Card>

                    {/* Shipment Settings */}
                    <Card title="⚙️ Shipment Settings" accent="var(--accent-cyan)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {/* Container Type */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Container Type
                                </label>
                                <select
                                    value={settings.containerType}
                                    onChange={e => setSettings({ ...settings, containerType: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="auto">Auto-select (Recommended)</option>
                                    <option value="20GP">20' Standard (33 CBM)</option>
                                    <option value="40GP">40' Standard (67 CBM)</option>
                                    <option value="40HC">40' High Cube (76 CBM)</option>
                                </select>
                            </div>

                            {/* Profit Margin */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Profit Margin
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, profitMarginMode: 'percentage', profitMargin: 0 })}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '12px',
                                            background: settings.profitMarginMode === 'percentage' ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: settings.profitMarginMode === 'percentage' ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Percentage
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, profitMarginMode: 'fixed', profitMargin: 0 })}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '12px',
                                            background: settings.profitMarginMode === 'fixed' ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: settings.profitMarginMode === 'fixed' ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Fixed USD
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    value={settings.profitMarginMode === 'percentage' ? settings.profitMargin * 100 : settings.profitMargin}
                                    onChange={v => setSettings({
                                        ...settings,
                                        profitMargin: settings.profitMarginMode === 'percentage' ? parseFloat(v) / 100 : parseFloat(v)
                                    })}
                                    prefix={settings.profitMarginMode === 'percentage' ? null : '$'}
                                    suffix={settings.profitMarginMode === 'percentage' ? '%' : null}
                                    step={settings.profitMarginMode === 'percentage' ? '0.1' : '1'}
                                />
                            </div>

                            {/* Commission */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Commission
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, commissionMode: 'percentage', commissionRate: 0 })}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '12px',
                                            background: settings.commissionMode === 'percentage' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: settings.commissionMode === 'percentage' ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Percentage
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, commissionMode: 'fixed', commissionRate: 0 })}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '12px',
                                            background: settings.commissionMode === 'fixed' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: settings.commissionMode === 'fixed' ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Fixed USD
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    value={settings.commissionMode === 'percentage' ? settings.commissionRate * 100 : settings.commissionRate}
                                    onChange={v => setSettings({
                                        ...settings,
                                        commissionRate: settings.commissionMode === 'percentage' ? parseFloat(v) / 100 : parseFloat(v)
                                    })}
                                    prefix={settings.commissionMode === 'percentage' ? null : '$'}
                                    suffix={settings.commissionMode === 'percentage' ? '%' : null}
                                    step={settings.commissionMode === 'percentage' ? '0.1' : '1'}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Rate Overrides */}
                    <Card title="🔧 Rate Overrides (Optional)" accent="var(--accent-amber)" collapsible defaultOpen={false}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            <Input
                                label="Sea Freight Total"
                                type="number"
                                value={overrides.seaFreightOverride || ''}
                                onChange={v => setOverrides({ ...overrides, seaFreightOverride: v ? parseFloat(v) : null })}
                                prefix="$"
                                hint="Override calculated sea freight cost"
                            />
                            <Input
                                label="Domestic China Shipping"
                                type="number"
                                value={overrides.domesticChinaPerCbmOverride || ''}
                                onChange={v => setOverrides({ ...overrides, domesticChinaPerCbmOverride: v ? parseFloat(v) : null })}
                                prefix="$"
                                suffix="per CBM"
                                hint={`Default: $${DEFAULT_RATES.domesticChinaPerCbm}/CBM`}
                            />
                        </div>
                    </Card>

                    {/* Results */}
                    {results && (
                        <ResultsPanel
                            results={results}
                            items={items}
                            settings={settings}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '3rem',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    borderTop: '1px solid var(--border)',
                }}>
                    <p>Built with ❤️ for Arabian Trade Route</p>
                    <p style={{ marginTop: '0.5rem' }}>
                        Powered by React + Vite | All calculations based on official CMA CGM & Qatar MOFA rates
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
