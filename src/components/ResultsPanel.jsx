import { useState } from 'react';
import { downloadPDFReport } from '../utils/reportGenerator';

const ResultsPanel = ({ results, items, settings, reportName = '' }) => {
    const [customsPreviewEnabled, setCustomsPreviewEnabled] = useState(false);
    const [previewResults, setPreviewResults] = useState(null);

    const handleDownloadReport = async () => {
        try {
            console.log('Generating PDF report...');
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `DDP-Report-${timestamp}.pdf`;
            await downloadPDFReport(
                results,
                items,
                settings,
                filename,
                customsPreviewEnabled ? previewResults : null,
                reportName
            );
            console.log('PDF report generated successfully!');
        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert('Error generating PDF report. Please check the console for details.');
        }
    };

    const formatCurrency = (amount, currency = 'USD') => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return currency === 'QAR' ? 'QAR 0.00' : '$0.00';
        }
        if (currency === 'QAR') {
            return `QAR ${amount.toFixed(2)}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    return (
        <div style={{
            marginTop: '24px',
            padding: '24px',
            background: '#1a2234',
            borderRadius: '12px',
            border: '1px solid #2a3548'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    margin: 0
                }}>
                    DDP Cost Results
                </h2>
                <button
                    onClick={handleDownloadReport}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    📄 Download PDF Report
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <SummaryCard
                    label="Total CIF"
                    value={formatCurrency(results.totalCIF)}
                    subValue={formatCurrency(results.totalCIFQAR, 'QAR')}
                    color="#3b82f6"
                />
                <SummaryCard
                    label="Customs Duties"
                    value={formatCurrency(results.customsDuties)}
                    subValue={formatCurrency(results.customsDutiesQAR, 'QAR')}
                    color="#f59e0b"
                />
                <SummaryCard
                    label="Local Delivery"
                    value={formatCurrency(results.localDelivery)}
                    subValue={formatCurrency(results.localDeliveryQAR, 'QAR')}
                    color="#8b5cf6"
                />
                <SummaryCard
                    label="Total DDP"
                    value={formatCurrency(results.ddpTotal)}
                    subValue={formatCurrency(results.ddpTotalQAR, 'QAR')}
                    color="#10b981"
                />
            </div>

            {/* Item Breakdown Table */}
            <div style={{ overflowX: 'auto' }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    marginBottom: '12px'
                }}>
                    Item Breakdown
                </h3>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                }}>
                    <thead>
                        <tr style={{ background: '#0d1321' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8' }}>ID</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8' }}>Description</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#94a3b8' }}>Qty</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#94a3b8' }}>Unit Price</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#94a3b8' }}>CIF Total</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#94a3b8' }}>Customs</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#94a3b8' }}>DDP Total</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', color: '#10b981' }}>DDP/Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.itemBreakdowns.map((item, index) => (
                            <tr key={index} style={{
                                borderBottom: '1px solid #2a3548',
                                background: index % 2 === 0 ? '#111827' : 'transparent'
                            }}>
                                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#f1f5f9' }}>
                                    {index + 1}
                                </td>
                                <td style={{ padding: '12px 8px', color: '#f1f5f9' }}>
                                    {item.description || `Item ${index + 1}`}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f1f5f9' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f1f5f9' }}>
                                    {formatCurrency(item.unitPrice)}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f1f5f9' }}>
                                    {formatCurrency(item.cifTotal)}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f59e0b' }}>
                                    {formatCurrency(item.customsDuty)}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#f1f5f9' }}>
                                    {formatCurrency(item.ddpTotal)}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                                    {formatCurrency(item.ddpPerUnit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, subValue, color }) => {
    return (
        <div style={{
            padding: '16px',
            background: '#111827',
            borderRadius: '8px',
            border: '1px solid #2a3548'
        }}>
            <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '8px'
            }}>
                {label}
            </div>
            <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: color,
                marginBottom: '4px'
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '11px',
                color: '#64748b'
            }}>
                {subValue}
            </div>
        </div>
    );
};

export default ResultsPanel;
