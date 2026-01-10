import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from './formatters';

// Helper to convert image URL to base64
const loadImageAsBase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading image:', error);
        return null;
    }
};

export const generatePDFReport = async (results, items, settings, previewResults = null, reportName = '') => {
    if (!results) return null;

    const { summary, costs, itemBreakdowns, rates } = results;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('🚢 DDP Cost Report', margin + 3, yPos + 9);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('China → Qatar Shipping Analysis', margin + 3, yPos + 17);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin + 3, yPos + 22);
    yPos += 30;

    // Report Name (if provided)
    if (reportName) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 211, 153); // Emerald color
        doc.text(reportName, pageWidth / 2, yPos, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset to black
        yPos += 12;
    }

    // Customs Preview Comparison (if applicable)
    if (previewResults) {
        doc.setFillColor(244, 63, 94); // Rose color
        doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('⚠ CUSTOMS PREVIEW COMPARISON', margin + 3, yPos + 5.5);

        yPos += 12;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Preview with Reduced Declaration for Customs Planning', margin + 5, yPos);
        yPos += 8;

        // Three column comparison
        const colWidth = contentWidth / 3;
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, contentWidth, 25, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Actual DDP', margin + colWidth * 0.5, yPos + 5, { align: 'center' });
        doc.text('Preview DDP', margin + colWidth * 1.5, yPos + 5, { align: 'center' });
        doc.text('Difference', margin + colWidth * 2.5, yPos + 5, { align: 'center' });

        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(formatCurrency(costs.ddpTotal), margin + colWidth * 0.5, yPos + 13, { align: 'center' });

        doc.setTextColor(16, 185, 129);
        doc.text(formatCurrency(previewResults.costs.ddpTotal), margin + colWidth * 1.5, yPos + 13, { align: 'center' });

        doc.setTextColor(16, 185, 129);
        const difference = costs.ddpTotal - previewResults.costs.ddpTotal;
        doc.text(`-${formatCurrency(difference)}`, margin + colWidth * 2.5, yPos + 13, { align: 'center' });

        yPos += 28;

        // Additional details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice Value: ${formatCurrency(costs.totalExwCost)} → ${formatCurrency(previewResults.costs.totalExwCost)}`, margin + 5, yPos);
        yPos += 4;
        const actualFreight = costs.domesticChinaShipping + costs.seaFreight;
        const previewFreight = previewResults.costs.domesticChinaShipping + previewResults.costs.seaFreight;
        doc.text(`Shipping Cost: ${formatCurrency(actualFreight)} → ${formatCurrency(previewFreight)}`, margin + 5, yPos);
        yPos += 8;
    }

    // Shipment Summary
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(margin, yPos, contentWidth, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Shipment Summary', margin + 3, yPos + 5);

    yPos += 11;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const summaryLeft = [
        `Total Items: ${summary.totalItems}`,
        `Total Quantity: ${formatNumber(summary.totalQuantity, 0)}`,
        `Total CBM: ${formatNumber(summary.totalCbm, 2)} m³`
    ];

    const summaryRight = [
        `Container(s): ${summary.containers.join(', ')}`,
        `Utilization: ${formatNumber(summary.containerUtilization, 1)}%`,
        `${settings.pricingMode === 'FOB' ? 'FOB' : 'EXW'} Total: ${formatCurrency(summary.totalExwCost)}`
    ];

    summaryLeft.forEach((text, i) => {
        doc.text(text, margin + 5, yPos + (i * 5));
    });

    summaryRight.forEach((text, i) => {
        doc.text(text, margin + contentWidth / 2, yPos + (i * 5));
    });

    yPos += 20;

    // Cost Breakdown
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPos, contentWidth, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 Cost Breakdown', margin + 3, yPos + 5);

    yPos += 11;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const costBreakdown = [
        [`${settings.pricingMode === 'FOB' ? 'FOB' : 'EXW'} Product Cost`, formatCurrency(costs.totalExwCost)],
        ['Sea Freight', formatCurrency(costs.seaFreight)],
        ['Insurance', formatCurrency(costs.insurance)],
        ['CIF Value', formatCurrency(costs.cifWithInsurance)],
        ['Customs Duty (5%)', formatCurrency(costs.qatarCharges.customsDuty / rates.usdToQar)],
        ['Qatar Clearance Fees', formatCurrency(costs.totalQatarChargesUsd - costs.qatarCharges.customsDuty / rates.usdToQar)],
        ['Certification Cost', formatCurrency(costs.certificationCost)],
        ['Profit Margin', formatCurrency(costs.profitMargin)],
        ['Commission', formatCurrency(costs.commission)]
    ];

    if (settings.pricingMode === 'EXW') {
        costBreakdown.splice(1, 0, ['Domestic China Shipping', formatCurrency(costs.domesticChinaShipping)]);
    }

    costBreakdown.forEach(([label, value], i) => {
        doc.text(label, margin + 5, yPos + (i * 4));
        doc.text(value, margin + contentWidth - 5, yPos + (i * 4), { align: 'right' });
    });

    yPos += (costBreakdown.length * 4) + 3;

    // Total DDP
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Total DDP Cost', margin + 5, yPos + 5);
    doc.text(formatCurrency(costs.ddpTotal), margin + contentWidth - 5, yPos + 5, { align: 'right' });

    yPos += 12;

    // Per-Item DDP Costs
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, yPos, contentWidth, 7, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 Per-Item DDP Costs', margin + 3, yPos + 5);

    yPos += 10;

    // Warning for preview mode
    if (previewResults) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(244, 63, 94);
        doc.text('⚠ Showing Preview Values (Reduced Declaration) - Actual values in parentheses', margin + 5, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);
    }

    // Items table with preview support
    const itemsTableData = itemBreakdowns.map((item, index) => {
        const previewItem = previewResults ? previewResults.itemBreakdowns[index] : null;

        if (previewItem) {
            return [
                (index + 1).toString(),  // ID column
                item.description || `Item ${index + 1}`,
                formatNumber(item.quantity, 0),
                item.unitType || 'pcs',
                formatNumber(item.itemCbm, 2),
                `${formatCurrency(previewItem.exwPrice * previewItem.quantity)}\n(${formatCurrency(item.exwPrice * item.quantity)})`,
                `${formatCurrency(previewItem.allocatedFreight)}\n(${formatCurrency(item.allocatedFreight)})`,
                `${formatCurrency(previewItem.allocatedQatarCharges)}\n(${formatCurrency(item.allocatedQatarCharges)})`,
                `${formatCurrency(previewItem.itemDdpTotal)}\n(${formatCurrency(item.itemDdpTotal)})`,
                `QAR ${formatNumber(previewItem.itemDdpTotal * rates.usdToQar, 2)}\n(QAR ${formatNumber(item.itemDdpTotal * rates.usdToQar, 2)})`,
                `${formatCurrency(previewItem.ddpPerUnit)}\n(${formatCurrency(item.ddpPerUnit)})`,
                `QAR ${formatNumber(previewItem.ddpPerUnit * rates.usdToQar, 2)}\n(QAR ${formatNumber(item.ddpPerUnit * rates.usdToQar, 2)})`
            ];
        }

        return [
            (index + 1).toString(),  // ID column
            item.description || `Item ${index + 1}`,
            formatNumber(item.quantity, 0),
            item.unitType || 'pcs',
            formatNumber(item.itemCbm, 2),
            formatCurrency(item.exwPrice * item.quantity),
            formatCurrency(item.allocatedFreight),
            formatCurrency(item.allocatedQatarCharges),
            formatCurrency(item.itemDdpTotal),
            `QAR ${formatNumber(item.itemDdpTotal * rates.usdToQar, 2)}`,
            formatCurrency(item.ddpPerUnit),
            `QAR ${formatNumber(item.ddpPerUnit * rates.usdToQar, 2)}`
        ];
    });

    // Add total row
    if (previewResults) {
        itemsTableData.push([
            { content: 'TOTAL', colSpan: 8, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            `${formatCurrency(previewResults.costs.ddpTotal)}\n(${formatCurrency(costs.ddpTotal)})`,
            `QAR ${formatNumber(previewResults.costs.ddpTotal * rates.usdToQar, 2)}\n(QAR ${formatNumber(costs.ddpTotal * rates.usdToQar, 2)})`,
            '', ''
        ]);
    } else {
        itemsTableData.push([
            { content: 'TOTAL', colSpan: 8, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            formatCurrency(costs.ddpTotal),
            `QAR ${formatNumber(costs.ddpTotal * rates.usdToQar, 2)}`,
            '', ''
        ]);
    }

    autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Item', 'Qty', 'Unit', 'CBM', `${settings.pricingMode === 'FOB' ? 'FOB' : 'EXW'} Total`, '+Freight', '+Clearance', 'DDP Total', 'DDP Total\n(QAR)', 'DDP/Unit', 'DDP/Unit\n(QAR)']],
        body: itemsTableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 6.5, fontStyle: 'bold' },
        styles: {
            fontSize: previewResults ? 5.5 : 6.5,
            cellPadding: 1.5,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 },    // ID
            1: { cellWidth: 32 },                      // Item (kept large)
            2: { halign: 'center', cellWidth: 8 },    // Qty
            3: { halign: 'center', cellWidth: 8 },    // Unit
            4: { halign: 'right', cellWidth: 10 },    // CBM
            5: { halign: 'right', cellWidth: 15 },    // EXW Total
            6: { halign: 'right', cellWidth: 15 },    // +Freight
            7: { halign: 'right', cellWidth: 15 },    // +Clearance
            8: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },    // DDP Total
            9: { halign: 'right', cellWidth: 16, fontStyle: 'bold', textColor: [139, 92, 246] },    // DDP Total (QAR)
            10: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },   // DDP/Unit
            11: { halign: 'right', cellWidth: 16, fontStyle: 'bold', textColor: [139, 92, 246] }    // DDP/Unit (QAR)
        },
        margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // Footer notes
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('Exchange Rate: 1 USD = 3.65 QAR | DDP (Delivered Duty Paid) includes all costs to Qatar', margin, yPos);
    yPos += 4;
    doc.text('Generated with Claude Code | All calculations based on official rates', margin, yPos);

    // Footer removed per user request
    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount);

    return doc;
};

export const downloadPDFReport = async (results, items, settings, filename = 'ddp-report.pdf', previewResults = null, reportName = '') => {
    const doc = await generatePDFReport(results, items, settings, previewResults, reportName);
    if (doc) {
        doc.save(filename);
    }
};
