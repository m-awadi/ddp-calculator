import { useState, useMemo, useRef } from 'react';
import { calculateDDP } from './utils/calculations.js';
import { formatCurrency, formatNumber } from './utils/formatters.js';
import { DEFAULT_RATES } from './utils/constants.js';
import { downloadFormData, importFormDataFromFile, downloadTemplate } from './utils/importExport';
import Card from './components/Card';
import Input from './components/Input';
import ItemRow from './components/ItemRow';
import ResultsPanel from './components/ResultsPanel';
import SmartImportModal from './components/SmartImportModal';

function App() {
    // Refs
    const fileInputRef = useRef(null);

    // State
    const [items, setItems] = useState([
        { description: '', quantity: 1, unitPrice: 0, unitType: '', cbmPerUnit: 0.01, weightPerUnit: 0, cbmInputMode: 'perUnit', certifications: [] }
    ]);

    const [settings, setSettings] = useState({
        containerType: 'auto',
        profitMargin: DEFAULT_RATES.profitMargin, // default to standard 15%
        profitMarginMode: 'percentage',
        commissionRate: DEFAULT_RATES.commissionRate, // default to 6%
        commissionMode: 'percentage',
        pricingMode: 'EXW', // EXW or FOB
    });

    const [overrides, setOverrides] = useState({
        seaFreightOverride: null,
        domesticChinaPerCbmOverride: null,
    });

    const [customsPreview, setCustomsPreview] = useState({
        enabled: false,
        invoiceCostOverride: null,
        shippingCostOverride: null,
    });

    const [reportName, setReportName] = useState('');

    // Item management
    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, unitType: '', cbmPerUnit: 0.01, weightPerUnit: 0, cbmInputMode: 'perUnit', certifications: [] }]);
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

    // Unified calculation hook to prevent re-render loops
    const { results, previewResults } = useMemo(() => {
        const validItems = items.filter(item => item.quantity > 0 && item.unitPrice > 0 && item.cbmPerUnit > 0);
        if (validItems.length === 0) {
            return { results: null, previewResults: null };
        }

        // 1. Calculate the main results
        const mainResults = calculateDDP(validItems, settings, overrides);

        // 2. Calculate preview results only if needed
        let preview = null;
        if (customsPreview.enabled && mainResults) {
            const actualInvoiceTotal = validItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const actualFreightTotal = mainResults.costs.domesticChinaShipping + mainResults.costs.seaFreight;

            const invoiceRatio = customsPreview.invoiceCostOverride ? customsPreview.invoiceCostOverride / actualInvoiceTotal : 1;

            const adjustedItems = validItems.map(item => ({
                ...item,
                unitPrice: item.unitPrice * invoiceRatio,
            }));

            const previewOverrides = {
                ...overrides,
                seaFreightOverride: customsPreview.shippingCostOverride || overrides.seaFreightOverride,
                domesticChinaShippingOverride: 0,
            };

            preview = calculateDDP(adjustedItems, settings, previewOverrides);
        }

        return { results: mainResults, previewResults: preview };
    }, [items, settings, overrides, customsPreview]);

    // Import/Export handlers
    const handleExport = () => {
        try {
            downloadFormData(items, settings, overrides, customsPreview, reportName);
            console.log('Form data exported successfully');
        } catch (error) {
            console.error('Error exporting form data:', error);
            alert('Error exporting form data. Please check the console for details.');
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await importFormDataFromFile(file);
            setItems(data.items);
            setSettings(data.settings);
            setOverrides(data.overrides);
            setCustomsPreview(data.customsPreview);
            setReportName(data.reportName || '');
            console.log('Form data imported successfully');
        } catch (error) {
            console.error('Error importing form data:', error);
            alert(`Error importing form data: ${error.message}`);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

    const handleSmartImportData = (data) => {
        if (data.items) setItems(data.items);
        if (data.settings) setSettings(data.settings);
        if (data.overrides) setOverrides(data.overrides);
        if (data.customsPreview) setCustomsPreview(data.customsPreview);
        if (data.reportName) setReportName(data.reportName);
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {/* Import/Export Buttons */}
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => downloadTemplate()}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(251, 191, 36, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: '0.2s',
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(251, 191, 36, 0.3)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(251, 191, 36, 0.2)'}
                            title="Download template with sample data and documentation"
                        >
                            <span>📋</span>
                            <span>Template</span>
                        </button>
                        <button
                            onClick={handleExport}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: '0.2s',
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            <span>↓</span>
                            <span>Export</span>
                        </button>
                        <button
                            onClick={triggerImport}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: '0.2s',
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            <span>↑</span>
                            <span>Import</span>
                        </button>
                        <button
                            onClick={() => setIsSmartImportOpen(true)}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(139, 92, 246, 0.3)', // Purple tint for AI
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: '0.2s',
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(139, 92, 246, 0.4)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(139, 92, 246, 0.3)'}
                        >
                            <span>✨</span>
                            <span>Smart Import</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </div>

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

                <SmartImportModal
                    isOpen={isSmartImportOpen}
                    onClose={() => setIsSmartImportOpen(false)}
                    onImport={handleSmartImportData}
                />

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
                                    pricingMode={settings.pricingMode}
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

                            {/* Pricing Mode */}
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
                                    Pricing Mode
                                </label>
                                <select
                                    value={settings.pricingMode}
                                    onChange={e => setSettings({ ...settings, pricingMode: e.target.value })}
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
                                    <option value="EXW">EXW (Ex Works)</option>
                                    <option value="FOB">FOB (Free On Board)</option>
                                </select>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    {settings.pricingMode === 'EXW'
                                        ? 'Buyer pays domestic China shipping'
                                        : 'Domestic shipping included in price'}
                                </p>
                            </div>

                            {/* Report Name */}
                            <div>
                                <Input
                                    label="Report Name (Optional)"
                                    value={reportName}
                                    onChange={v => setReportName(v)}
                                    placeholder="Supplier or customer name"
                                    hint="Appears on PDF report for identification"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Customs Preview */}
                    <Card title="📋 Customs Preview (Reduced Declaration)" accent="var(--accent-rose)">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <input
                                type="checkbox"
                                checked={customsPreview.enabled}
                                onChange={e => setCustomsPreview({ ...customsPreview, enabled: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                Enable Customs Preview Mode
                            </label>
                        </div>
                        {customsPreview.enabled && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                <Input
                                    label="Declared Invoice Total"
                                    type="number"
                                    value={customsPreview.invoiceCostOverride || ''}
                                    onChange={v => setCustomsPreview({ ...customsPreview, invoiceCostOverride: parseFloat(v) || null })}
                                    prefix="$"
                                    hint="Reduced invoice value for customs declaration"
                                />
                                <Input
                                    label="Declared Shipping Total"
                                    type="number"
                                    value={customsPreview.shippingCostOverride || ''}
                                    onChange={v => setCustomsPreview({ ...customsPreview, shippingCostOverride: parseFloat(v) || null })}
                                    prefix="$"
                                    hint="Reduced shipping cost for customs declaration"
                                />
                            </div>
                        )}
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
                            previewResults={previewResults}
                            customsPreviewEnabled={customsPreview.enabled}
                            reportName={reportName}
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
