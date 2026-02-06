import { useState } from 'react';
import QuotationItemRow from './components/QuotationItemRow';
import { generateQuotationPDF } from './utils/quotationPDF';
import { generateQuotationHTML } from './utils/quotationHTML';
import {
    DEFAULT_COMPANY_INFO,
    DEFAULT_CUSTOM_BLOCKS,
    QUOTATION_COLORS
} from './utils/defaultTerms';

/**
 * @typedef {Object} InitialQuotationItem
 * @property {string} [description]
 * @property {number} [quantity]
 * @property {string} [unitType]
 * @property {number} [ddpPerUnit]
 * @property {number} [price]
 */

/**
 * @param {{
 *   initialItems?: InitialQuotationItem[];
 *   onClose?: () => void;
 * }} props
 */
const QuotationApp = ({ initialItems = [], onClose }) => {
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
    const [showPictureColumn, setShowPictureColumn] = useState(true);
    const [showCertificationColumn, setShowCertificationColumn] = useState(true);
    const [showQAR, setShowQAR] = useState(false);
    const [qarExchangeRate, setQarExchangeRate] = useState(3.65);
    const [quantityUnit, setQuantityUnit] = useState('pcs');
    const [items, setItems] = useState(
        initialItems.length > 0
            ? initialItems.map(item => ({
                description: item.description || '',
                quantity: item.quantity || 0,
                // Support small fractional prices (e.g., 0.084) - use up to 4 decimal places
                price: item.ddpPerUnit != null ? parseFloat(Number(item.ddpPerUnit).toFixed(4)) : (item.price != null ? parseFloat(Number(item.price).toFixed(4)) : 0),
                image: null,
                images: [],
                // Carry over certification and one-time costs from DDP calculator
                certificationCost: item.certificationCost || 0,
                labTestCost: item.labTestCost || 0,
                certificationType: item.certificationType || '',
                oneTimeCost: item.oneTimeCost || 0,
                oneTimeCostDescription: item.oneTimeCostDescription || ''
            }))
            : [{ description: '', quantity: 0, price: 0, image: null, images: [], certificationCost: 0, labTestCost: 0, certificationType: '', oneTimeCost: 0, oneTimeCostDescription: '' }]
    );

    const [companyInfo, setCompanyInfo] = useState({ ...DEFAULT_COMPANY_INFO });

    // Custom blocks - flexible sections initialized with default terms
    const [customBlocks, setCustomBlocks] = useState(() => {
        // Ensure all blocks and sections have IDs for reliable reordering
        const blocks = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_BLOCKS));
        return blocks.map((block, i) => ({
            ...block,
            id: block.id || `block-${Date.now()}-${i}`,
            sections: block.sections.map((section, j) => ({
                ...section,
                id: section.id || `section-${Date.now()}-${i}-${j}`,
                image: section.image || null
            }))
        }));
    });

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 0, price: 0, image: null, images: [], certificationCost: 0, labTestCost: 0, certificationType: '', oneTimeCost: 0, oneTimeCostDescription: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const totalUSD = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalQAR = totalUSD * 3.65; // Keep for backward compatibility

    // Calculate total certification, lab test, and one-time costs across all items
    const totalCertificationCost = items.reduce((sum, item) => sum + (parseFloat(item.certificationCost) || 0), 0);
    const totalLabTestCost = items.reduce((sum, item) => sum + (parseFloat(item.labTestCost) || 0), 0);
    const totalOneTimeCost = items.reduce((sum, item) => sum + (parseFloat(item.oneTimeCost) || 0), 0);
    const totalCertLabCost = totalCertificationCost + totalLabTestCost;
    const totalAddonsCost = totalCertLabCost + totalOneTimeCost;

    // Custom blocks management
    const addCustomBlock = () => {
        setCustomBlocks([...customBlocks, {
            id: Date.now(),
            title: '',
            sections: [{ id: Date.now() + 1, title: '', items: [''] }]
        }]);
    };

    const removeCustomBlock = (blockIndex) => {
        setCustomBlocks(customBlocks.filter((_, i) => i !== blockIndex));
    };

    const updateBlockTitle = (blockIndex, title) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex].title = title;
        setCustomBlocks(newBlocks);
    };

    const addSection = (blockIndex) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex].sections.push({ id: Date.now(), title: '', items: [''], image: null });
        setCustomBlocks(newBlocks);
    };

    const removeSection = (blockIndex, sectionIndex) => {
        const newBlocks = [...customBlocks];
        if (newBlocks[blockIndex].sections.length > 1) {
            newBlocks[blockIndex].sections = newBlocks[blockIndex].sections.filter((_, i) => i !== sectionIndex);
            setCustomBlocks(newBlocks);
        }
    };

    const updateSectionTitle = (blockIndex, sectionIndex, title) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex].sections[sectionIndex].title = title;
        setCustomBlocks(newBlocks);
    };

    const addBlockItem = (blockIndex, sectionIndex) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex].sections[sectionIndex].items.push('');
        setCustomBlocks(newBlocks);
    };

    const removeBlockItem = (blockIndex, sectionIndex, itemIndex) => {
        const newBlocks = [...customBlocks];
        if (newBlocks[blockIndex].sections[sectionIndex].items.length > 1) {
            newBlocks[blockIndex].sections[sectionIndex].items = newBlocks[blockIndex].sections[sectionIndex].items.filter((_, i) => i !== itemIndex);
            setCustomBlocks(newBlocks);
        }
    };

    const updateBlockItem = (blockIndex, sectionIndex, itemIndex, value) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex].sections[sectionIndex].items[itemIndex] = value;
        setCustomBlocks(newBlocks);
    };

    const moveCustomBlock = (index, direction) => {
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === customBlocks.length - 1)) return;

        const newBlocks = [...customBlocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        setCustomBlocks(newBlocks);
    };

    const moveSection = (blockIndex, sectionIndex, direction) => {
        const newBlocks = [...customBlocks];
        // Shallow copy block and sections to avoid direct mutation
        newBlocks[blockIndex] = { ...newBlocks[blockIndex], sections: [...newBlocks[blockIndex].sections] };

        const sections = newBlocks[blockIndex].sections;
        if ((direction === 'up' && sectionIndex === 0) ||
            (direction === 'down' && sectionIndex === sections.length - 1)) return;

        const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
        [sections[sectionIndex], sections[targetIndex]] = [sections[targetIndex], sections[sectionIndex]];
        setCustomBlocks(newBlocks);
    };

    const moveBlockItem = (blockIndex, sectionIndex, itemIndex, direction) => {
        const newBlocks = [...customBlocks];
        // Deep copy nested structure
        newBlocks[blockIndex] = { ...newBlocks[blockIndex] };
        newBlocks[blockIndex].sections = [...newBlocks[blockIndex].sections];
        newBlocks[blockIndex].sections[sectionIndex] = {
            ...newBlocks[blockIndex].sections[sectionIndex],
            items: [...newBlocks[blockIndex].sections[sectionIndex].items]
        };

        const items = newBlocks[blockIndex].sections[sectionIndex].items;
        if ((direction === 'up' && itemIndex === 0) ||
            (direction === 'down' && itemIndex === items.length - 1)) return;

        const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
        setCustomBlocks(newBlocks);

    };

    const handleSectionImageUpload = (blockIndex, sectionIndex, file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to reasonable size (max 600px)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxSize = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const resizedImage = canvas.toDataURL('image/jpeg', 0.85);

                const newBlocks = [...customBlocks];
                newBlocks[blockIndex] = { ...newBlocks[blockIndex] };
                newBlocks[blockIndex].sections = [...newBlocks[blockIndex].sections];
                newBlocks[blockIndex].sections[sectionIndex] = {
                    ...newBlocks[blockIndex].sections[sectionIndex],
                    image: resizedImage
                };
                setCustomBlocks(newBlocks);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const removeSectionImage = (blockIndex, sectionIndex) => {
        const newBlocks = [...customBlocks];
        newBlocks[blockIndex] = { ...newBlocks[blockIndex] };
        newBlocks[blockIndex].sections = [...newBlocks[blockIndex].sections];
        newBlocks[blockIndex].sections[sectionIndex] = {
            ...newBlocks[blockIndex].sections[sectionIndex],
            image: null
        };
        setCustomBlocks(newBlocks);
    };

    const handleGeneratePDF = async () => {
        try {
            await generateQuotationPDF({
                date: quotationDate,
                items,
                totalQAR,
                totalUSD,
                companyInfo,
                showPictureColumn,
                showCertificationColumn,
                customBlocks,
                quantityUnit,
                totalCertificationCost,
                totalLabTestCost,
                totalCertLabCost,
                totalOneTimeCost,
                totalAddonsCost,
                showQAR,
                qarExchangeRate
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please check the console for details.');
        }
    };

    const handlePrintToPDF = () => {
        try {
            generateQuotationHTML({
                date: quotationDate,
                items,
                totalQAR,
                totalUSD,
                companyInfo,
                showPictureColumn,
                showCertificationColumn,
                customBlocks,
                quantityUnit,
                totalCertificationCost,
                totalLabTestCost,
                totalCertLabCost,
                totalOneTimeCost,
                totalAddonsCost,
                showQAR,
                qarExchangeRate
            });
        } catch (error) {
            console.error('Error generating print preview:', error);
            alert('Error generating print preview. Please check the console for details.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: QUOTATION_COLORS.background,
            padding: '24px'
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                background: QUOTATION_COLORS.white,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {/* Top Bar */}
                <div style={{
                    background: QUOTATION_COLORS.primary,
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: QUOTATION_COLORS.white,
                        margin: 0
                    }}>
                        Quotation Builder
                    </h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handlePrintToPDF}
                            style={{
                                padding: '10px 20px',
                                background: QUOTATION_COLORS.primary,
                                color: QUOTATION_COLORS.white,
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                            title="Perfect Arabic support - Print to PDF using browser"
                        >
                            🖨️ Print to PDF (Recommended)
                        </button>
                        <button
                            onClick={handleGeneratePDF}
                            style={{
                                padding: '10px 20px',
                                background: QUOTATION_COLORS.secondary,
                                color: QUOTATION_COLORS.white,
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: 0.7
                            }}
                            title="Direct PDF download - Limited Arabic support"
                        >
                            📄 Direct PDF
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px',
                                    background: QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.primary,
                                    border: `2px solid ${QUOTATION_COLORS.white}`,
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Back to DDP
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Company Info */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: QUOTATION_COLORS.textDark }}>
                            Company Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input
                                type="text"
                                value={companyInfo.name}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                placeholder="Company Name"
                                style={{
                                    padding: '10px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                            <input
                                type="date"
                                value={quotationDate}
                                onChange={(e) => setQuotationDate(e.target.value)}
                                style={{
                                    padding: '10px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                            <textarea
                                value={companyInfo.address}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                placeholder="Address"
                                rows="3"
                                style={{
                                    padding: '10px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    gridColumn: '1 / -1',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                            <input
                                type="email"
                                value={companyInfo.email}
                                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                placeholder="Email"
                                style={{
                                    padding: '10px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: QUOTATION_COLORS.textDark }}>
                                Quotation Items
                            </h3>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: QUOTATION_COLORS.textDark }}>
                                    <span>Qty Unit:</span>
                                    <input
                                        type="text"
                                        value={quantityUnit}
                                        onChange={(e) => setQuantityUnit(e.target.value)}
                                        placeholder="pcs"
                                        style={{
                                            width: '80px',
                                            padding: '6px 8px',
                                            border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                            color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                        }}
                                    />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: QUOTATION_COLORS.textDark, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showPictureColumn}
                                        onChange={(e) => setShowPictureColumn(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Show Picture Column
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: QUOTATION_COLORS.textDark, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showCertificationColumn}
                                        onChange={(e) => setShowCertificationColumn(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Show Extra Costs
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: QUOTATION_COLORS.textDark, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showQAR}
                                        onChange={(e) => setShowQAR(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Show QAR Prices
                                </label>
                                {showQAR && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: QUOTATION_COLORS.textDark }}>
                                        <span>Rate:</span>
                                        <input
                                            type="number"
                                            value={qarExchangeRate}
                                            onChange={(e) => setQarExchangeRate(parseFloat(e.target.value) || 3.65)}
                                            step="0.01"
                                            min="0.01"
                                            style={{
                                                width: '70px',
                                                padding: '6px 8px',
                                                border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                                color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: QUOTATION_COLORS.primary }}>
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>Item</th>
                                    {showPictureColumn && <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Picture</th>}
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Description</th>
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Qty ({quantityUnit})</th>
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Price (USD)</th>
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Total (USD)</th>
                                    {showCertificationColumn && <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}>Extra</th>}
                                    <th style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '13px', fontWeight: '600' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <QuotationItemRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onUpdate={updateItem}
                                        onRemove={removeItem}
                                        showPictureColumn={showPictureColumn}
                                        showCertificationColumn={showCertificationColumn}
                                    />
                                ))}
                                {/* Total Row */}
                                <tr style={{ background: QUOTATION_COLORS.primary }}>
                                    <td colSpan={showPictureColumn ? "5" : "4"} style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                                        {totalAddonsCost > 0 ? 'Product Total' : 'Total'}
                                    </td>
                                    <td style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                                        ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {showQAR && (
                                            <div style={{ fontSize: '11px', opacity: 0.9 }}>
                                                ({(totalUSD * qarExchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR)
                                            </div>
                                        )}
                                    </td>
                                    {showCertificationColumn && (
                                        <td style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                                            ${totalAddonsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            {showQAR && totalAddonsCost > 0 && (
                                                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                                                    ({(totalAddonsCost * qarExchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR)
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    <td></td>
                                </tr>
                                {/* Grand Total Row (ALWAYS shown when there are add-on costs) */}
                                {totalAddonsCost > 0 && (
                                    <tr style={{ background: QUOTATION_COLORS.secondary }}>
                                        <td colSpan={showPictureColumn ? (showCertificationColumn ? "6" : "5") : (showCertificationColumn ? "5" : "4")} style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                                            Grand Total (Products + Add-ons)
                                        </td>
                                        <td colSpan={showCertificationColumn ? "2" : "1"} style={{ padding: '12px 8px', color: QUOTATION_COLORS.white, fontSize: '14px', fontWeight: '700', textAlign: 'right' }}>
                                            ${(totalUSD + totalAddonsCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            {showQAR && (
                                                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                                                    ({((totalUSD + totalAddonsCost) * qarExchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR)
                                                </div>
                                            )}
                                        </td>
                                        <td></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button
                            onClick={addItem}
                            style={{
                                marginTop: '12px',
                                padding: '10px 20px',
                                background: `${QUOTATION_COLORS.primary}20`,
                                color: QUOTATION_COLORS.primary,
                                border: `1px dashed ${QUOTATION_COLORS.primary}`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Custom Blocks (Now including Terms & Bank Details) */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: QUOTATION_COLORS.textDark }}>
                                Terms & Conditions / Custom Sections
                            </h3>
                            <button
                                onClick={addCustomBlock}
                                style={{
                                    padding: '8px 16px',
                                    background: `${QUOTATION_COLORS.primary}`,
                                    color: QUOTATION_COLORS.white,
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Custom Block
                            </button>
                        </div>

                        {customBlocks.map((block, blockIdx) => (
                            <div key={block.id} style={{
                                marginBottom: '20px',
                                padding: '16px',
                                border: `2px solid ${QUOTATION_COLORS.primary}40`,
                                borderRadius: '8px',
                                background: `${QUOTATION_COLORS.primary}05`
                            }}>
                                {/* Block Title */}
                                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={block.title}
                                        onChange={(e) => updateBlockTitle(blockIdx, e.target.value)}
                                        placeholder="Block Title (e.g., معلومات خاصة بالعرض:)"
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            border: `2px solid ${QUOTATION_COLORS.primary}`,
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: QUOTATION_COLORS.primary,
                                            backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white
                                        }}
                                    />
                                    <button
                                        onClick={() => moveCustomBlock(blockIdx, 'up')}
                                        disabled={blockIdx === 0}
                                        title="Move Block Up"
                                        style={{
                                            padding: '8px 12px',
                                            background: 'transparent',
                                            border: '1px solid #9CA3AF40',
                                            borderRadius: '6px',
                                            color: '#4B5563',
                                            cursor: blockIdx === 0 ? 'default' : 'pointer',
                                            fontSize: '14px',
                                            opacity: blockIdx === 0 ? 0.3 : 1
                                        }}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveCustomBlock(blockIdx, 'down')}
                                        disabled={blockIdx === customBlocks.length - 1}
                                        title="Move Block Down"
                                        style={{
                                            padding: '8px 12px',
                                            background: 'transparent',
                                            border: '1px solid #9CA3AF40',
                                            borderRadius: '6px',
                                            color: '#4B5563',
                                            cursor: blockIdx === customBlocks.length - 1 ? 'default' : 'pointer',
                                            fontSize: '14px',
                                            opacity: blockIdx === customBlocks.length - 1 ? 0.3 : 1
                                        }}
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => removeCustomBlock(blockIdx)}
                                        style={{
                                            padding: '8px 12px',
                                            background: '#EF444420',
                                            border: '1px solid #EF444440',
                                            borderRadius: '6px',
                                            color: '#EF4444',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Delete Block
                                    </button>
                                </div>

                                {/* Sections */}
                                {block.sections.map((section, sectionIdx) => (
                                    <div key={section.id} style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        background: QUOTATION_COLORS.white,
                                        borderRadius: '6px',
                                        border: `1px solid ${QUOTATION_COLORS.textMuted}40`
                                    }}>
                                        {/* Section Title */}
                                        <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>●</span>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(blockIdx, sectionIdx, e.target.value)}
                                                placeholder="Section Title (e.g., التسليم:)"
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                                }}
                                            />
                                            <button
                                                onClick={() => moveSection(blockIdx, sectionIdx, 'up')}
                                                disabled={sectionIdx === 0}
                                                title="Move Section Up"
                                                style={{
                                                    padding: '6px 10px',
                                                    background: 'transparent',
                                                    border: '1px solid #9CA3AF40',
                                                    borderRadius: '6px',
                                                    color: '#4B5563',
                                                    cursor: sectionIdx === 0 ? 'default' : 'pointer',
                                                    fontSize: '12px',
                                                    opacity: sectionIdx === 0 ? 0.3 : 1
                                                }}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveSection(blockIdx, sectionIdx, 'down')}
                                                disabled={sectionIdx === block.sections.length - 1}
                                                title="Move Section Down"
                                                style={{
                                                    padding: '6px 10px',
                                                    background: 'transparent',
                                                    border: '1px solid #9CA3AF40',
                                                    borderRadius: '6px',
                                                    color: '#4B5563',
                                                    cursor: sectionIdx === block.sections.length - 1 ? 'default' : 'pointer',
                                                    fontSize: '12px',
                                                    opacity: sectionIdx === block.sections.length - 1 ? 0.3 : 1
                                                }}
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => removeSection(blockIdx, sectionIdx)}
                                                style={{
                                                    padding: '6px 10px',
                                                    background: '#EF444420',
                                                    border: '1px solid #EF444440',
                                                    borderRadius: '6px',
                                                    color: '#EF4444',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Sub-items */}
                                        {section.items.map((item, itemIdx) => (
                                            <div key={itemIdx} style={{ marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '24px' }}>
                                                <span style={{ fontSize: '12px', color: QUOTATION_COLORS.textMuted }}>○</span>
                                                <textarea
                                                    value={item}
                                                    onChange={(e) => updateBlockItem(blockIdx, sectionIdx, itemIdx, e.target.value)}
                                                    placeholder="Sub-item text..."
                                                    rows="2"
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px',
                                                        border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontFamily: 'inherit',
                                                        resize: 'vertical',
                                                        backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                                        color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                                    }}
                                                />
                                                <button
                                                    onClick={() => moveBlockItem(blockIdx, sectionIdx, itemIdx, 'up')}
                                                    disabled={itemIdx === 0}
                                                    title="Move Item Up"
                                                    style={{
                                                        padding: '2px 6px',
                                                        background: 'transparent',
                                                        border: '1px solid #9CA3AF40',
                                                        borderRadius: '4px',
                                                        color: '#4B5563',
                                                        cursor: itemIdx === 0 ? 'default' : 'pointer',
                                                        fontSize: '11px',
                                                        opacity: itemIdx === 0 ? 0.3 : 1
                                                    }}
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveBlockItem(blockIdx, sectionIdx, itemIdx, 'down')}
                                                    disabled={itemIdx === section.items.length - 1}
                                                    title="Move Item Down"
                                                    style={{
                                                        padding: '2px 6px',
                                                        background: 'transparent',
                                                        border: '1px solid #9CA3AF40',
                                                        borderRadius: '4px',
                                                        color: '#4B5563',
                                                        cursor: itemIdx === section.items.length - 1 ? 'default' : 'pointer',
                                                        fontSize: '11px',
                                                        opacity: itemIdx === section.items.length - 1 ? 0.3 : 1
                                                    }}
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeBlockItem(blockIdx, sectionIdx, itemIdx)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: '#EF444420',
                                                        border: '1px solid #EF444440',
                                                        borderRadius: '4px',
                                                        color: '#EF4444',
                                                        cursor: 'pointer',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addBlockItem(blockIdx, sectionIdx)}
                                            style={{
                                                marginLeft: '24px',
                                                marginTop: '6px',
                                                padding: '6px 12px',
                                                background: `${QUOTATION_COLORS.primary}20`,
                                                color: QUOTATION_COLORS.primary,
                                                border: `1px dashed ${QUOTATION_COLORS.primary}`,
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Add Sub-item
                                        </button>

                                        {/* Section Image */}
                                        <div style={{
                                            marginTop: '12px',
                                            marginLeft: '24px',
                                            padding: '8px',
                                            border: `1px dashed ${QUOTATION_COLORS.textMuted}40`,
                                            borderRadius: '6px',
                                            background: `${QUOTATION_COLORS.background}`
                                        }}>
                                            {section.image ? (
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <img
                                                        src={section.image}
                                                        alt="Section image"
                                                        style={{
                                                            maxWidth: '200px',
                                                            maxHeight: '150px',
                                                            objectFit: 'contain',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${QUOTATION_COLORS.textMuted}40`
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => removeSectionImage(blockIdx, sectionIdx)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            background: '#EF4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        x
                                                    </button>
                                                </div>
                                            ) : (
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    color: QUOTATION_COLORS.textMuted
                                                }}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleSectionImageUpload(blockIdx, sectionIdx, file);
                                                            e.target.value = '';
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        background: `${QUOTATION_COLORS.primary}20`,
                                                        color: QUOTATION_COLORS.primary,
                                                        border: `1px dashed ${QUOTATION_COLORS.primary}`,
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}>
                                                        + Add Image
                                                    </span>
                                                    <span>Optional image for this section</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addSection(blockIdx)}
                                    style={{
                                        padding: '8px 16px',
                                        background: `${QUOTATION_COLORS.primary}20`,
                                        color: QUOTATION_COLORS.primary,
                                        border: `1px dashed ${QUOTATION_COLORS.primary}`,
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Add Section (● Bullet)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationApp;
