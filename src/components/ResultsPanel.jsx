import Card from './Card';
import CostRow from './CostRow';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { generatePDFReport } from '../utils/modernReportGenerator';

const ResultsPanel = ({ results, items, settings, previewResults = null, customsPreviewEnabled = false, reportName = '' }) => {
    if (!results) return null;

    const { summary, costs, itemBreakdowns, rates } = results;
    const pricingMode = settings?.pricingMode || 'EXW';
    const priceLabel = pricingMode === 'FOB' ? 'FOB' : 'EXW';

    const handleDownloadReport = async () => {
        try {
            console.log('Generating modern PDF report...');
            const doc = await generatePDFReport(results, items, settings, previewResults, reportName);
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `DDP-Report-Modern-${timestamp}.pdf`;
            doc.save(filename);
            console.log('Modern PDF report generated successfully!');
        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert('Error generating PDF report. Please check the console for details.');
        }
    };

    const handleGenerateQuotation = () => {
        const quotationItems = itemBreakdowns.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitType: item.unitType,
            ddpPerUnit: item.ddpPerUnit
        }));
        sessionStorage.setItem('quotationItems', JSON.stringify(quotationItems));
        // Use relative path to stay within the same directory/route
        // Robustly determine the correct path for quotation.html
        // This handles cases where the user might be at /ddp-calculator (no slash)
        // caused by missing server redirects or caching issues.
        let currentPath = window.location.pathname;

        // Remove 'index.html' if present
        if (currentPath.endsWith('index.html')) {
            currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        }

        // Ensure trailing slash
        if (!currentPath.endsWith('/')) {
            currentPath += '/';
        }

        // Open quotation.html relative to the computed directory base
        window.open(`${currentPath}quotation.html`, '_blank');
    };

    return (
        <>
            {/* Shipment Summary */}
            <Card title="📊 Shipment Summary" accent="var(--accent-purple)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Items</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{summary.totalItems}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Quantity</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatNumber(summary.totalQuantity, 0)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total CBM</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-blue)' }}>{formatNumber(summary.totalCbm, 2)} m³</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Container(s)</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-cyan)' }}>{summary.containers.join(', ')}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Utilization</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: summary.containerUtilization > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                            {formatNumber(summary.containerUtilization, 1)}%
                        </p>
                    </div>
                </div>
            </Card>

            {/* Customs Preview Comparison */}
            {customsPreviewEnabled && previewResults && (
                <Card title="📋 Customs Preview Comparison" accent="var(--accent-rose)">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Actual DDP</p>
                            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(costs.ddpTotal)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Preview DDP</p>
                            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-emerald)' }}>{formatCurrency(previewResults.costs.ddpTotal)}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Difference</p>
                            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-emerald)' }}>-{formatCurrency(costs.ddpTotal - previewResults.costs.ddpTotal)}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Cost Breakdown */}
            <Card title="💰 Cost Breakdown" accent="var(--accent-blue)">
                {customsPreviewEnabled && previewResults && (
                    <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--accent-rose)10', border: '1px solid var(--accent-rose)30', borderRadius: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>
                            ⚠️ Showing Preview Values (Reduced Declaration)
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Actual values shown in parentheses
                        </p>
                    </div>
                )}

                <CostRow
                    label={`${priceLabel} Product Cost`}
                    amount={costs.totalExwCost}
                    previewAmount={previewResults?.costs.totalExwCost}
                    showPreview={customsPreviewEnabled && previewResults}
                />

                {pricingMode === 'EXW' && (
                    <CostRow
                        label="Domestic China Shipping"
                        amount={costs.domesticChinaShipping}
                        previewAmount={previewResults?.costs.domesticChinaShipping}
                        showPreview={customsPreviewEnabled && previewResults}
                        indent
                    />
                )}

                <CostRow
                    label="Sea Freight"
                    amount={costs.seaFreight}
                    previewAmount={previewResults?.costs.seaFreight}
                    showPreview={customsPreviewEnabled && previewResults}
                    indent
                />

                <CostRow
                    label="Insurance"
                    amount={costs.insurance}
                    previewAmount={previewResults?.costs.insurance}
                    showPreview={customsPreviewEnabled && previewResults}
                    indent
                />

                <CostRow
                    label="CIF Value"
                    amount={costs.cifValue}
                    previewAmount={previewResults?.costs.cifValue}
                    showPreview={customsPreviewEnabled && previewResults}
                />

                <CostRow
                    label="Customs Duty (5%)"
                    amount={costs.qatarCharges.customsDuty}
                    previewAmount={previewResults?.costs.qatarCharges.customsDuty}
                    showPreview={customsPreviewEnabled && previewResults}
                    indent
                />

                <CostRow
                    label="Qatar Clearance Fees"
                    amount={costs.qatarCharges.clearanceCharges / rates.usdToQar}
                    previewAmount={previewResults ? previewResults.costs.qatarCharges.clearanceCharges / rates.usdToQar : null}
                    showPreview={customsPreviewEnabled && previewResults}
                    indent
                />

                <CostRow
                    label="Certification Cost"
                    amount={costs.certificationCost}
                    previewAmount={previewResults?.costs.certificationCost}
                    showPreview={customsPreviewEnabled && previewResults}
                />

                <CostRow
                    label="Landed Cost"
                    amount={costs.landedCostBeforeMargin}
                    previewAmount={previewResults?.costs.landedCostBeforeMargin}
                    showPreview={customsPreviewEnabled && previewResults}
                    bold
                />

                <CostRow
                    label="Profit Margin"
                    amount={costs.profitMargin}
                    previewAmount={previewResults?.costs.profitMargin}
                    showPreview={customsPreviewEnabled && previewResults}
                />

                <CostRow
                    label="Commission"
                    amount={costs.commission}
                    previewAmount={previewResults?.costs.commission}
                    showPreview={customsPreviewEnabled && previewResults}
                />

                <CostRow
                    label="Total DDP Cost"
                    amount={costs.ddpTotal}
                    previewAmount={previewResults?.costs.ddpTotal}
                    showPreview={customsPreviewEnabled && previewResults}
                    highlight
                    bold
                />

                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={handleDownloadReport}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
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
                        📄 Modern PDF Report
                    </button>
                    <button
                        onClick={handleGenerateQuotation}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
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
                        📝 Generate Quotation
                    </button>
                </div>
            </Card>

            {/* Per-Item DDP Costs */}
            <Card title="📦 Per-Item DDP Costs" accent="var(--accent-emerald)">
                {customsPreviewEnabled && previewResults && (
                    <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--accent-rose)10', border: '1px solid var(--accent-rose)30', borderRadius: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>
                            ⚠️ Showing Preview Values (Reduced Declaration)
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Actual values shown in parentheses
                        </p>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Item</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>Qty</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>CBM</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>{priceLabel} Total</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>+Freight</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>+Clearance</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>DDP Total</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>DDP Total<br />(QAR)</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>DDP/Unit</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>DDP/Unit<br />(QAR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemBreakdowns.map((item, i) => {
                                const previewItem = customsPreviewEnabled && previewResults ? previewResults.itemBreakdowns[i] : null;
                                const showPreview = customsPreviewEnabled && previewItem;
                                const basePrice = item.unitPrice ?? item.exwPrice ?? 0;
                                const previewPrice = previewItem ? (previewItem.unitPrice ?? previewItem.exwPrice ?? 0) : 0;

                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>
                                            {item.description || `Item ${i + 1}`}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-primary)' }} className="mono">
                                            {formatNumber(item.quantity, 0)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-primary)' }} className="mono">
                                            {formatNumber(item.itemCbm, 2)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-primary)' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                                        {formatCurrency(previewPrice * previewItem.quantity)}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                        ({formatCurrency(basePrice * item.quantity)})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(basePrice * item.quantity)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-primary)' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                                        {formatCurrency(previewItem.allocatedFreight)}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                        ({formatCurrency(item.allocatedFreight)})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.allocatedFreight)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-primary)' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                                        {formatCurrency(previewItem.allocatedQatarCharges)}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                        ({formatCurrency(item.allocatedQatarCharges)})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.allocatedQatarCharges)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent-emerald)', fontWeight: '700' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-emerald)' }}>
                                                        {formatCurrency(previewItem.itemDdpTotal)}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                        ({formatCurrency(item.itemDdpTotal)})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.itemDdpTotal)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent-purple)', fontWeight: '700' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-purple)' }}>
                                                        {formatCurrency(previewItem.itemDdpTotal * rates.usdToQar, 'QAR')}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                        ({formatCurrency(item.itemDdpTotal * rates.usdToQar, 'QAR')})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.itemDdpTotal * rates.usdToQar, 'QAR')}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent-emerald)', fontWeight: '700' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-emerald)' }}>
                                                        {formatCurrency(previewItem.ddpPerUnit)}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                        ({formatCurrency(item.ddpPerUnit)})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.ddpPerUnit)}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent-purple)', fontWeight: '700' }} className="mono">
                                            {showPreview && (
                                                <>
                                                    <span style={{ color: 'var(--accent-purple)' }}>
                                                        {formatCurrency(previewItem.ddpPerUnit * rates.usdToQar, 'QAR')}
                                                    </span>
                                                    <br />
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                        ({formatCurrency(item.ddpPerUnit * rates.usdToQar, 'QAR')})
                                                    </span>
                                                </>
                                            )}
                                            {!showPreview && formatCurrency(item.ddpPerUnit * rates.usdToQar, 'QAR')}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Total Row */}
                            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                <td colSpan="6" style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    TOTAL
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-emerald)' }} className="mono">
                                    {customsPreviewEnabled && previewResults ? (
                                        <>
                                            <span style={{ color: 'var(--accent-emerald)' }}>
                                                {formatCurrency(previewResults.costs.ddpTotal)}
                                            </span>
                                            <br />
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                ({formatCurrency(costs.ddpTotal)})
                                            </span>
                                        </>
                                    ) : (
                                        formatCurrency(costs.ddpTotal)
                                    )}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-purple)' }} className="mono">
                                    {customsPreviewEnabled && previewResults ? (
                                        <>
                                            <span style={{ color: 'var(--accent-purple)' }}>
                                                {formatCurrency(previewResults.costs.ddpTotal * rates.usdToQar, 'QAR')}
                                            </span>
                                            <br />
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                ({formatCurrency(costs.ddpTotal * rates.usdToQar, 'QAR')})
                                            </span>
                                        </>
                                    ) : (
                                        formatCurrency(costs.ddpTotal * rates.usdToQar, 'QAR')
                                    )}
                                </td>
                                <td colSpan="2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

export default ResultsPanel;
