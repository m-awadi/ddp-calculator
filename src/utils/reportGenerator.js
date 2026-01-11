import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from './formatters';

export const generatePDFReport = async (results, items, settings, previewResults = null, reportName = '') => {
    if (!results) return null;

    const { summary, costs, itemBreakdowns, rates } = results;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // PAGE 1 - EXECUTIVE SUMMARY
    // Header section with gradient-like effect
    doc.setFillColor(44, 62, 80); // Dark navy blue
    doc.rect(0, 0, pageWidth, 65, 'F');
    
    // Main title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DDP COST CALCULATION REPORT', pageWidth / 2, 25, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Arabian Trade Route', pageWidth / 2, 40, { align: 'center' });
    doc.text('China → Qatar (Hamad Port)', pageWidth / 2, 52, { align: 'center' });

    yPos = 75;

    // Company name with green highlight
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 204, 113); // Green
    doc.text(reportName || 'ARTIVIO DESIGN INTERIOR', pageWidth / 2, yPos, { align: 'center' });

    yPos = 95;

    // Generation info with subtle background
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, yPos - 5, contentWidth, 20, 'F');
    doc.setTextColor(108, 117, 125);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}`, margin + 5, yPos + 3);
    doc.text('Exchange Rate: 1 USD = 3.65 QAR', margin + 5, yPos + 11);
    yPos += 25;

    // Executive Summary section
    doc.setFillColor(46, 204, 113); // Professional green
    doc.roundedRect(margin, yPos, contentWidth, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', margin + 8, yPos + 8);

    yPos += 18;
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(10);

    // Summary table with better formatting
    const summaryData = [
        ['Total Items:', summary.totalItems.toString(), 'Total Volume:', `${formatNumber(summary.totalCbm, 2)} CBM`],
        ['Total Quantity:', `${formatNumber(summary.totalQuantity, 0)} units`, 'Total Weight:', '0.00 kg'],
        ['Container(s):', summary.containers.join(', '), 'Utilization:', `${formatNumber(summary.containerUtilization, 1)}%`]
    ];

    // Add subtle background for summary data
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, yPos, contentWidth, 24, 'F');
    
    summaryData.forEach(([label1, value1, label2, value2], i) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        doc.text(label1, margin + 8, yPos + 5 + (i * 7));
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 58, 64);
        doc.text(value1, margin + 85, yPos + 5 + (i * 7));
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        doc.text(label2, margin + 200, yPos + 5 + (i * 7));
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 58, 64);
        doc.text(value2, margin + 285, yPos + 5 + (i * 7));
    });

    yPos += 30;

    // Cost summary boxes with shadow effect
    const boxHeight = 22;
    const boxWidth = contentWidth / 2 - 8;
    
    // EXW Cost Box with subtle shadow
    doc.setFillColor(220, 220, 220);
    doc.rect(margin + 2, yPos + 2, boxWidth, boxHeight, 'F'); // Shadow
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, yPos, boxWidth, boxHeight, 'F');
    doc.setLineWidth(0.5);
    doc.setDrawColor(206, 212, 218);
    doc.rect(margin, yPos, boxWidth, boxHeight, 'S');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 117, 125);
    doc.text('EXW Total Cost:', margin + 8, yPos + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(52, 58, 64);
    doc.text(formatCurrency(costs.totalExwCost), margin + 8, yPos + 17);

    // DDP Cost Box with green styling
    const ddpBoxX = margin + contentWidth / 2 + 8;
    doc.setFillColor(200, 230, 201); // Light green shadow
    doc.rect(ddpBoxX + 2, yPos + 2, boxWidth, boxHeight, 'F'); // Shadow
    doc.setFillColor(46, 204, 113);
    doc.rect(ddpBoxX, yPos, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('DDP Total Cost:', ddpBoxX + 8, yPos + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(formatCurrency(costs.ddpTotal), ddpBoxX + 8, yPos + 17);

    // Cost increase with better styling
    const costIncrease = costs.ddpTotal - costs.totalExwCost;
    const increasePercentage = (costIncrease / costs.totalExwCost) * 100;
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.setFont('helvetica', 'italic');
    doc.text(`Cost Increase: ${formatCurrency(costIncrease)} (${formatNumber(increasePercentage, 1)}%)`, ddpBoxX + 8, yPos + 28);

    yPos += 40;

    // Shipment Items section
    doc.setFillColor(52, 152, 219); // Professional blue
    doc.roundedRect(margin, yPos, contentWidth, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPMENT ITEMS', margin + 8, yPos + 8);

    yPos += 18;

    // Items table - matching target format exactly
    const tableColumns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Item', dataKey: 'item' },
        { header: 'Qty', dataKey: 'qty' },
        { header: 'Unit', dataKey: 'unit' },
        { header: 'CBM', dataKey: 'cbm' },
        { header: 'FOB Total', dataKey: 'fobTotal' },
        { header: '+Freight', dataKey: 'freight' },
        { header: '+Clearance', dataKey: 'clearance' },
        { header: 'DDP Total', dataKey: 'ddpTotal' },
        { header: 'DDP Total (QAR)', dataKey: 'ddpQar' },
        { header: 'DDP/Unit', dataKey: 'ddpUnit' },
        { header: 'DDP/Unit (QAR)', dataKey: 'ddpUnitQar' }
    ];

    const tableRows = items.map((item, index) => {
        const breakdown = itemBreakdowns[index] || {};
        const unitPrice = item.unitPrice ?? item.exwPrice ?? 0;
        const total = unitPrice * item.quantity;
        
        return {
            id: (index + 1).toString(),
            item: item.item || item.description || `Item ${index + 1}`,
            qty: item.quantity.toString(),
            unit: 'set',
            cbm: formatNumber(breakdown.itemCbm || 0, 1),
            fobTotal: formatCurrency(total),
            freight: formatCurrency(breakdown.allocatedFreight || 0),
            clearance: formatCurrency(breakdown.allocatedQatarCharges || 0),
            ddpTotal: formatCurrency(breakdown.itemDdpTotal || 0),
            ddpQar: `QAR ${formatNumber((breakdown.itemDdpTotal || 0) * rates.usdToQar, 2)}`,
            ddpUnit: formatCurrency(breakdown.ddpPerUnit || 0),
            ddpUnitQar: `QAR ${formatNumber((breakdown.ddpPerUnit || 0) * rates.usdToQar, 2)}`
        };
    });

    // Add total row
    tableRows.push({
        id: '',
        item: 'TOTAL',
        qty: '',
        unit: '',
        cbm: '',
        fobTotal: '',
        freight: '',
        clearance: '',
        ddpTotal: formatCurrency(costs.ddpTotal),
        ddpQar: `QAR ${formatNumber(costs.ddpTotal * rates.usdToQar, 2)}`,
        ddpUnit: '',
        ddpUnitQar: ''
    });

    autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: 'linebreak',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [52, 152, 219], // Professional blue
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        bodyStyles: {
            textColor: [52, 58, 64]
        },
        columnStyles: {
            id: { halign: 'center', cellWidth: 10 },
            item: { fontStyle: 'bold', cellWidth: 40 },
            qty: { halign: 'center', cellWidth: 12 },
            unit: { halign: 'center', cellWidth: 12 },
            cbm: { halign: 'right', cellWidth: 15 },
            fobTotal: { halign: 'right', cellWidth: 20 },
            freight: { halign: 'right', cellWidth: 20 },
            clearance: { halign: 'right', cellWidth: 22 },
            ddpTotal: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
            ddpQar: { halign: 'right', textColor: [139, 92, 246], cellWidth: 25 },
            ddpUnit: { halign: 'right', cellWidth: 20 },
            ddpUnitQar: { halign: 'right', textColor: [139, 92, 246], cellWidth: 25 }
        },
        didParseCell: function(data) {
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fillColor = [240, 240, 240];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page for calculation settings
    if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
    }

    // Calculation Settings
    doc.setFillColor(155, 89, 182); // Professional purple
    doc.roundedRect(margin, yPos, contentWidth, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CALCULATION SETTINGS', margin + 8, yPos + 7);

    yPos += 15;
    
    // Add subtle background for settings
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, yPos, contentWidth, 22, 'F');
    
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Calculate actual percentages used in calculations
    const actualProfitMarginPercent = costs.landedCostBeforeMargin > 0 
        ? (costs.profitMargin / costs.landedCostBeforeMargin) * 100 
        : 0;
    const actualCommissionPercent = (costs.landedCostBeforeMargin + costs.profitMargin) > 0
        ? (costs.commission / (costs.landedCostBeforeMargin + costs.profitMargin)) * 100
        : 0;

    const settingsData = [
        ['Container Selection:', 'Auto (Optimized)'],
        ['Profit Margin:', `${formatNumber(actualProfitMarginPercent, 1)}% (${settings.profitMarginMode || 'percentage'})`],
        ['Commission:', `${formatNumber(actualCommissionPercent, 1)}% (${settings.commissionMode || 'percentage'})`]
    ];

    settingsData.forEach(([label, value], i) => {
        doc.setTextColor(108, 117, 125);
        doc.text(label, margin + 8, yPos + 5 + (i * 6));
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 58, 64);
        doc.text(value, margin + 130, yPos + 5 + (i * 6));
        doc.setFont('helvetica', 'normal');
    });

    // PAGE 2 - DETAILED BREAKDOWN
    doc.addPage();
    yPos = margin;

    // Page 2 Header with professional styling
    doc.setFillColor(230, 126, 34); // Professional orange
    doc.roundedRect(margin, yPos, contentWidth, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED COST BREAKDOWN', margin + 8, yPos + 8);

    yPos += 20;

    // 1. China Costs with styled section
    doc.setFillColor(236, 240, 241);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. CHINA COSTS (USD)', margin + 5, yPos + 5);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 58, 64);
    doc.text('EXW Product Cost', margin + 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(costs.totalExwCost), margin + contentWidth - 15, yPos, { align: 'right' });
    yPos += 8;

    if (settings.pricingMode === 'EXW') {
        doc.setFont('helvetica', 'normal');
        doc.text('Domestic China Shipping', margin + 15, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(costs.domesticChinaShipping || 0), margin + contentWidth - 15, yPos, { align: 'right' });
        yPos += 8;
    }

    yPos += 8;

    // 2. International Shipping with styled section
    doc.setFillColor(236, 240, 241);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. INTERNATIONAL SHIPPING (USD)', margin + 5, yPos + 5);
    yPos += 12;

    const shippingCosts = [
        ['Sea Freight', formatCurrency(costs.seaFreight)],
        ['Insurance (0.5% of CIF)', formatCurrency(costs.insurance)],
        ['Certification', formatCurrency(costs.certificationCost)],
        ['CIF Value', formatCurrency(costs.cifValue)]
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 58, 64);
    shippingCosts.forEach(([label, value]) => {
        doc.text(label, margin + 15, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(value, margin + contentWidth - 15, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 7;
    });

    yPos += 8;

    // 3. Qatar Clearance Costs with styled section
    doc.setFillColor(236, 240, 241);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. QATAR CLEARANCE COSTS (QAR)', margin + 5, yPos + 5);
    yPos += 12;

    // Single source of truth for Qatar charge line items
    const qatarChargeItems = [
        // Government & Customs section
        { section: 'Government & Customs', items: [
            ['Customs Duty (5%)', costs.qatarCharges.customsDuty],
            ['Mwani Charges', costs.qatarCharges.mwaniCharges]
        ]},
        
        // CMA CGM Shipping Line section  
        { section: 'CMA CGM Shipping Line Fees', items: [
            ['Delivery Order', costs.qatarCharges.deliveryOrderFees],
            ['Terminal Handling (THC)', costs.qatarCharges.terminalHandling],
            ['Container Return', costs.qatarCharges.containerReturn],
            ['Container Maintenance', costs.qatarCharges.containerMaintenance],
            ['Terminal Inspection', costs.qatarCharges.terminalInspection],
            ['Inspection Charge', costs.qatarCharges.inspectionCharge]
        ]},
        
        // MOFA Attestation section
        { section: 'MOFA Attestation (Tiered)', items: [
            ['Commercial Invoice', costs.qatarCharges.documentAttestation - 150],
            ['Certificate of Origin', 150]
        ]},
        
        // Clearance & Delivery section (single canonical clearance charge)
        { section: 'Clearance & Delivery', items: [
            ['Clearance Charges', costs.qatarCharges.clearanceCharges],
            ['Local Transport', costs.qatarCharges.localTransport]
        ]}
    ];
    
    // Validate and render sections
    let calculatedTotal = 0;
    qatarChargeItems.forEach(({ section, items }) => {
        // Section header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(108, 117, 125);
        doc.text(`${section}:`, margin + 15, yPos);
        yPos += 8;
        
        // Section items
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 58, 64);
        items.forEach(([label, value]) => {
            // Validate each item
            if (typeof value !== 'number' || isNaN(value)) {
                throw new Error(`Invalid Qatar charge item: ${label} = ${value}`);
            }
            calculatedTotal += value;
            
            doc.text(label, margin + 25, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(`QAR ${formatNumber(value, 2)}`, margin + contentWidth - 15, yPos, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            yPos += section === 'MOFA Attestation (Tiered)' ? 6 : 7;
        });
        
        yPos += 5;
    });
    
    // Validation: ensure displayed total matches calculated total
    if (Math.abs(calculatedTotal - costs.totalQatarChargesQar) > 0.01) {
        throw new Error(`Qatar charges mismatch: displayed=${calculatedTotal}, calculated=${costs.totalQatarChargesQar}`);
    }

    // Total Qatar Charges with emphasis
    doc.setFillColor(248, 249, 250);
    doc.rect(margin + 10, yPos - 2, contentWidth - 20, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 58, 64);
    doc.text('Total Qatar Charges:', margin + 15, yPos + 3);
    doc.text(`QAR ${formatNumber(costs.totalQatarChargesQar, 2)}`, margin + contentWidth - 15, yPos + 3, { align: 'right' });
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 117, 125);
    doc.text('(Converted to USD):', margin + 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 58, 64);
    doc.text(formatCurrency(costs.totalQatarChargesUsd), margin + contentWidth - 15, yPos, { align: 'right' });

    yPos += 15;

    // 4. Final Costs with styled section
    doc.setFillColor(236, 240, 241);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(52, 58, 64);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. FINAL COSTS (USD)', margin + 5, yPos + 5);
    yPos += 12;

    const finalCosts = [
        ['Landed Cost (before margin)', formatCurrency(costs.ddpTotal - costs.profitMargin - costs.commission)],
        ['Profit Margin', formatCurrency(costs.profitMargin)],
        ['Commission', formatCurrency(costs.commission)]
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 58, 64);
    finalCosts.forEach(([label, value]) => {
        doc.text(label, margin + 15, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(value, margin + contentWidth - 15, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 7;
    });

    yPos += 8;

    // Total DDP Price with professional highlight and shadow
    const totalBoxHeight = 18;
    
    // Shadow effect
    doc.setFillColor(200, 230, 201);
    doc.rect(margin + 2, yPos + 2, contentWidth, totalBoxHeight, 'F');
    
    // Main box
    doc.setFillColor(46, 204, 113);
    doc.rect(margin, yPos, contentWidth, totalBoxHeight, 'F');
    
    // Border
    doc.setLineWidth(1);
    doc.setDrawColor(39, 174, 96);
    doc.rect(margin, yPos, contentWidth, totalBoxHeight, 'S');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DDP PRICE:', margin + 12, yPos + 12);
    doc.setFontSize(16);
    doc.text(formatCurrency(costs.ddpTotal), margin + contentWidth - 12, yPos + 12, { align: 'right' });

    // Check if we need space for notes, if not add new page
    if (yPos > pageHeight - 90) {
        doc.addPage();
        yPos = margin;
    } else {
        yPos += 15;
    }

    // Add notes
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const notes = [
        'Notes:',
        '• Rates based on CMA CGM tariff (October 2023)',
        '• MOFA attestation fees are tiered based on invoice value',
        '• All costs are estimated and subject to change',
        '• This is an internal calculation report for planning purposes'
    ];

    notes.forEach((note, i) => {
        if (i === 0) {
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setFont('helvetica', 'normal');
        }
        doc.text(note, margin, yPos + (i * 4));
    });

    // Page number at bottom
    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Page ${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    return doc;
};

export const downloadPDFReport = async (results, items, settings, filename = 'ddp-report.pdf', previewResults = null, reportName = '') => {
    const doc = await generatePDFReport(results, items, settings, previewResults, reportName);
    if (doc) {
        doc.save(filename);
    }
};
