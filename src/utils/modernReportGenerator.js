import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from './formatters';

// Modern theme configuration with brand colors
const THEME = {
    colors: {
        darkGradient: [27, 43, 56], // Navy Blue for header
        brandGreen: [214, 90, 31], // Burnt Orange (primary)
        sectionGreen: [236, 114, 45], // Light Burnt Orange
        sectionBlue: [106, 123, 140], // Cool Gray
        sectionPurple: [214, 90, 31], // Burnt Orange
        sectionOrange: [236, 114, 45], // Light Burnt Orange
        textDark: [27, 43, 56], // Navy Blue
        textMuted: [106, 123, 140], // Cool Gray
        cardBg: [245, 245, 245], // Light Gray
        tableBorder: [106, 123, 140], // Cool Gray
        qatarPurple: [214, 90, 31] // Burnt Orange for QAR amounts
    },
    layout: {
        pageWidth: 210, // A4 width in mm
        pageHeight: 297, // A4 height in mm
        margins: { top: 12, right: 10, bottom: 14, left: 10 }, // Tighter margins for table
        heroHeight: 45, // Reduced header height
        pillHeight: 10,
        pillRadius: 4,
        cardPadding: 8,
        spacing: 6 // More consistent spacing
    },
    fonts: {
        title: 24, // Slightly smaller title
        subtitle: 10,
        projectName: 16,
        sectionHeader: 12,
        body: 9,
        tableHeader: 8.5, // Smaller table headers
        small: 8
    }
};

class ModernPDFBuilder {
    constructor() {
        this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
        this.y = THEME.layout.margins.top;
        this.contentWidth = THEME.layout.pageWidth - THEME.layout.margins.left - THEME.layout.margins.right;
        this.leftMargin = THEME.layout.margins.left;
    }

    // Helper methods
    setColor(colorArray) {
        this.doc.setTextColor(...colorArray);
        return this;
    }

    setFillColor(colorArray) {
        this.doc.setFillColor(...colorArray);
        return this;
    }

    setFont(family, style, size) {
        this.doc.setFont(family, style);
        if (size) this.doc.setFontSize(size);
        return this;
    }

    needPageBreak(requiredHeight) {
        return this.y + requiredHeight > THEME.layout.pageHeight - THEME.layout.margins.bottom;
    }

    addPage() {
        this.doc.addPage();
        this.y = THEME.layout.margins.top;
        return this;
    }

    // Modern visual elements - centered layout like target
    drawStructuredHeader(title, subtitle1, subtitle2, projectName, generatedDate, exchangeRate, manufacturerName = '') {
        // Dark header band
        this.setFillColor(THEME.colors.darkGradient);
        this.doc.rect(0, 0, THEME.layout.pageWidth, THEME.layout.heroHeight, 'F');

        // Centered layout like target template
        const centerX = THEME.layout.pageWidth / 2;
        let headerY = 15;

        // Main title - centered
        this.setColor([255, 255, 255])
            .setFont('helvetica', 'bold', THEME.fonts.title);
        this.doc.text(title, centerX, headerY, { align: 'center' });

        // Company subtitle - centered (use manufacturer name if provided, otherwise Arabian Trade Route)
        headerY += 10;
        this.setFont('helvetica', 'normal', THEME.fonts.subtitle);
        this.doc.text(manufacturerName || 'Arabian Trade Route', centerX, headerY, { align: 'center' });

        // Route info - centered
        headerY += 6;
        this.doc.text(`${subtitle1} → ${subtitle2}`, centerX, headerY, { align: 'center' });

        // Project name - centered in brand green
        headerY += 8;
        this.setColor(THEME.colors.brandGreen)
            .setFont('helvetica', 'bold', THEME.fonts.projectName);
        this.doc.text(projectName || 'ARTIVIO DESIGN INTERIOR', centerX, headerY, { align: 'center' });

        this.y = THEME.layout.heroHeight + 6;

        // Metadata - left aligned below header
        this.setColor(THEME.colors.textMuted)
            .setFont('helvetica', 'normal', THEME.fonts.small);

        this.doc.text(generatedDate, this.leftMargin, this.y);
        this.doc.text(exchangeRate, this.leftMargin, this.y + 4);
        this.y += 12;

        return this;
    }

    drawSectionPill(title, colorArray) {
        // Rounded pill background
        this.setFillColor(colorArray);
        this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, THEME.layout.pillHeight,
            THEME.layout.pillRadius, THEME.layout.pillRadius, 'F');

        // White section title
        this.setColor([255, 255, 255])
            .setFont('helvetica', 'bold', THEME.fonts.sectionHeader);
        this.doc.text(title, this.leftMargin + 8, this.y + 7);

        this.y += THEME.layout.pillHeight + 6; // Consistent spacing after pill
        return this;
    }

    drawCard(content, highlight = null) {
        const cardHeight = 25;

        // Light grey card background with shadow
        this.setFillColor([235, 235, 235]);
        this.doc.roundedRect(this.leftMargin + 1, this.y + 1, this.contentWidth, cardHeight, 3, 3, 'F');

        this.setFillColor(THEME.colors.cardBg);
        this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, cardHeight, 3, 3, 'F');

        let cardY = this.y + 8;
        this.setColor(THEME.colors.textDark)
            .setFont('helvetica', 'bold', THEME.fonts.body);

        content.forEach(([label, value], index) => {
            this.doc.text(label, this.leftMargin + 8, cardY);

            if (highlight && highlight.includes(index)) {
                this.setColor(THEME.colors.brandGreen)
                    .setFont('helvetica', 'bold', THEME.fonts.body + 1);
            } else {
                this.setColor(THEME.colors.textDark)
                    .setFont('helvetica', 'bold', THEME.fonts.body);
            }

            this.doc.text(value, this.leftMargin + this.contentWidth - 8, cardY, { align: 'right' });
            cardY += 6;
        });

        this.y += cardHeight + 8;
        return this;
    }

    drawTargetSummary(summary, costs, settings) {
        // Summary stats section (like target template)
        const statsHeight = 20;

        const pricingMode = settings?.pricingMode || 'EXW';
        const priceLabel = pricingMode === 'FOB' ? 'FOB' : pricingMode === 'CIF' ? 'CIF' : 'EXW';

        // Green background for stats
        this.setFillColor([240, 248, 255]);
        this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, statsHeight, 2, 2, 'F');

        let statsY = this.y + 6;
        this.setColor(THEME.colors.textDark)
            .setFont('helvetica', 'normal', THEME.fonts.body);

        // Left column stats
        const leftCol = this.leftMargin + 8;
        const rightCol = this.leftMargin + (this.contentWidth / 2) + 8;

        // Items and Volume
        this.setFont('helvetica', 'bold', THEME.fonts.body);
        this.doc.text('Total Items:', leftCol, statsY);
        this.doc.text('Total Volume:', rightCol, statsY);

        this.setFont('helvetica', 'normal', THEME.fonts.body);
        this.doc.text(summary.totalItems.toString(), leftCol + 35, statsY);
        this.doc.text(`${formatNumber(summary.totalCbm, 2)} CBM`, rightCol + 35, statsY);

        // Quantity and Weight
        statsY += 6;
        this.setFont('helvetica', 'bold', THEME.fonts.body);
        this.doc.text('Total Quantity:', leftCol, statsY);
        this.doc.text('Total Weight:', rightCol, statsY);

        this.setFont('helvetica', 'normal', THEME.fonts.body);
        this.doc.text(`${formatNumber(summary.totalQuantity, 0)} units`, leftCol + 35, statsY);
        this.doc.text(`${formatNumber(summary.totalWeight || 0, 2)} kg`, rightCol + 35, statsY);

        // Container and Utilization
        statsY += 6;
        this.setFont('helvetica', 'bold', THEME.fonts.body);
        this.doc.text('Container(s):', leftCol, statsY);
        this.doc.text('Utilization:', rightCol, statsY);

        this.setFont('helvetica', 'normal', THEME.fonts.body);
        this.doc.text(summary.containers.join(', '), leftCol + 35, statsY);
        this.doc.text(`${formatNumber(summary.containerUtilization, 2)}%`, rightCol + 35, statsY);

        this.y += statsHeight + 8;

        // Cost section (separate like target)
        const costHeight = 18;
        this.setFillColor([248, 249, 250]);
        this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, costHeight, 2, 2, 'F');

        let costY = this.y + 6;

        // EXW and DDP costs side by side
        this.setColor(THEME.colors.textDark)
            .setFont('helvetica', 'bold', 11);

        this.doc.text(`${priceLabel} Total Cost:`, leftCol, costY);
        this.doc.text(formatCurrency(costs.totalExwCost), leftCol + 40, costY);

        this.setFont('helvetica', 'bold', 12);
        this.setColor(THEME.colors.brandGreen);
        this.doc.text('DDP Total Cost:', rightCol, costY);
        this.doc.text(formatCurrency(costs.ddpTotal), rightCol + 40, costY);

        // Cost increase note
        costY += 8;
        const costIncrease = costs.ddpTotal - costs.totalExwCost;
        const increasePercentage = (costIncrease / costs.totalExwCost) * 100;

        this.setColor(THEME.colors.textMuted)
            .setFont('helvetica', 'normal', THEME.fonts.small);
        this.doc.text(`Cost Increase: ${formatCurrency(costIncrease)} (+${formatNumber(increasePercentage, 2)}%)`,
            this.leftMargin + this.contentWidth - 6, costY, { align: 'right' });

        this.y += costHeight + 8;

        return this;
    }

    drawOptimizedTable(tableData, options = {}) {
        const tableY = this.y;

        autoTable(this.doc, {
            startY: tableY,
            margin: { left: this.leftMargin, right: THEME.layout.margins.right },
            head: [tableData.headers],
            body: tableData.rows,
            foot: tableData.footer ? [tableData.footer] : undefined,

            // Optimized table styling
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: THEME.fonts.tableHeader,
                cellPadding: 1.5,
                overflow: 'linebreak', // Allow text wrapping by default
                valign: 'middle',
                lineColor: THEME.colors.tableBorder,
                lineWidth: 0.2,
                minCellHeight: 12 // Increased height for two-line cells
            },

            headStyles: {
                fillColor: THEME.colors.sectionBlue,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: THEME.fonts.tableHeader,
                halign: 'center',
                overflow: 'hidden' // Critical: prevent header wrapping
            },

            bodyStyles: {
                textColor: THEME.colors.textDark,
                fontSize: THEME.fonts.tableHeader - 0.5
            },

            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },

            footStyles: {
                fillColor: [240, 245, 248],
                fontStyle: 'bold',
                textColor: THEME.colors.textDark,
                fontSize: THEME.fonts.tableHeader
            },

            // Pagination settings
            showHead: 'everyPage',
            rowPageBreak: 'avoid',

            // Fixed column styling for merged currency columns
            columnStyles: {
                0: { cellWidth: 8, halign: 'center', overflow: 'visible' }, // ID
                1: { cellWidth: 43, overflow: 'linebreak' }, // Item (slightly reduced)
                2: { cellWidth: 10, halign: 'center', overflow: 'visible' }, // Qty
                3: { cellWidth: 10, halign: 'center', overflow: 'visible' }, // Unit
                4: { cellWidth: 12, halign: 'right', overflow: 'visible' }, // CBM
                5: { cellWidth: 18, halign: 'right', overflow: 'visible' }, // EXW/FOB Total (single line)
                6: { cellWidth: 18, halign: 'right', overflow: 'visible' }, // Freight (single line)
                7: { cellWidth: 18, halign: 'right', overflow: 'visible' }, // Clearance (single line)
                8: { cellWidth: 32, halign: 'right', overflow: 'linebreak', fontStyle: 'bold', textColor: THEME.colors.textDark, minCellHeight: 14 }, // DDP Total (USD/QAR) - needs 2 lines, increased width
                9: { cellWidth: 27, halign: 'right', overflow: 'linebreak', fontStyle: 'bold', textColor: THEME.colors.textDark, minCellHeight: 14 }, // DDP/Unit (USD/QAR) - needs 2 lines, increased width
                ...options.columnStyles
            },

            didDrawPage: (data) => {
                // Page number in footer only
                this.setColor(THEME.colors.textMuted)
                    .setFont('helvetica', 'normal', THEME.fonts.small);
                this.doc.text(`Page ${data.pageNumber}`,
                    THEME.layout.pageWidth / 2,
                    THEME.layout.pageHeight - 6,
                    { align: 'center' });

                // Add continuation label on subsequent pages
                if (data.pageNumber > 1) {
                    this.setColor(THEME.colors.textDark)
                        .setFont('helvetica', 'italic', THEME.fonts.body);
                    this.doc.text('Shipment Items (continued)', this.leftMargin, 18);
                }
            }
        });

        this.y = this.doc.lastAutoTable.finalY + 8; // Consistent 8mm spacing
        return this;
    }

    drawTotalBanner(totalText, totalValue) {
        const bannerHeight = 16;

        // Green banner with shadow effect
        this.setFillColor([200, 230, 201]);
        this.doc.rect(this.leftMargin + 2, this.y + 2, this.contentWidth, bannerHeight, 'F');

        this.setFillColor(THEME.colors.brandGreen);
        this.doc.roundedRect(this.leftMargin, this.y, this.contentWidth, bannerHeight, 4, 4, 'F');

        // White text
        this.setColor([255, 255, 255])
            .setFont('helvetica', 'bold', 14);
        this.doc.text(totalText, this.leftMargin + 8, this.y + 10);

        this.setFont('helvetica', 'bold', 16);
        this.doc.text(totalValue, this.leftMargin + this.contentWidth - 8, this.y + 10, { align: 'right' });

        this.y += bannerHeight + 8;
        return this;
    }
}

export const generatePDFReport = async (results, items, settings, previewResults = null, reportName = '', manufacturerName = '') => {
    if (!results) return null;

    const { summary, costs, itemBreakdowns, rates } = results;
    const builder = new ModernPDFBuilder();

    try {
        // Current date formatting
        const currentDate = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        };
        const generatedDate = `Generated: ${currentDate.toLocaleDateString('en-US', options)}`;
        const exchangeRate = `Exchange Rate: 1 USD = ${formatNumber(rates.usdToQar, 2)} QAR`;

        // 1. Structured Header Block (centered like target)
        builder.drawStructuredHeader(
            'DDP COST CALCULATION REPORT',
            'China',
            'Qatar (Hamad Port)',
            reportName || 'ARTIVIO DESIGN INTERIOR',
            generatedDate,
            exchangeRate,
            manufacturerName
        );

        // 2. Executive Summary with target template layout
        builder.drawSectionPill('EXECUTIVE SUMMARY', THEME.colors.sectionGreen);
        builder.drawTargetSummary(summary, costs, settings);

        // 3. Shipment Items with optimized table
        builder.drawSectionPill('SHIPMENT ITEMS', THEME.colors.sectionBlue);

        const pricingMode = settings?.pricingMode || 'EXW';
        const priceLabel = pricingMode === 'FOB' ? 'FOB' : pricingMode === 'CIF' ? 'CIF' : 'EXW';

        // Merged headers to prevent table overflow
        const tableHeaders = ['ID', 'Item Description', 'Qty', 'Unit', 'CBM', `${priceLabel} Total`, 'Freight', 'Clearance', 'DDP Total\n(USD/QAR)', 'DDP/Unit\n(USD/QAR)'];

        const tableRows = itemBreakdowns.map((breakdown, index) => [
            (index + 1).toString(),
            breakdown.description || breakdown.name || 'Item',
            breakdown.quantity.toString(),
            breakdown.unitType || 'set',
            formatNumber(breakdown.itemCbm || 0, 2),
            formatCurrency(breakdown.unitPrice * breakdown.quantity),
            formatCurrency(breakdown.allocatedFreight || 0),
            formatCurrency(breakdown.allocatedQatarCharges || 0),
            `${formatCurrency(breakdown.itemDdpTotal || 0)}\n${formatNumber((breakdown.itemDdpTotal || 0) * rates.usdToQar, 2)} QAR`,
            `${formatCurrency(breakdown.ddpPerUnit || 0)}\n${formatNumber((breakdown.ddpPerUnit || 0) * rates.usdToQar, 2)} QAR`
        ]);

        const tableFooter = [
            'TOTAL',
            `${summary.totalItems} items`,
            summary.totalQuantity.toString(),
            '',
            formatNumber(summary.totalCbm, 2),
            formatCurrency(costs.totalExwCost),
            formatCurrency(costs.seaFreight + costs.domesticChinaShipping),
            formatCurrency(costs.totalQatarChargesUsd),
            `${formatCurrency(costs.ddpTotal)}\n${formatNumber(costs.ddpTotal * rates.usdToQar, 2)} QAR`,
            ''
        ];

        builder.drawOptimizedTable({
            headers: tableHeaders,
            rows: tableRows,
            footer: tableFooter
        });

        // 3b. Certifications & Fixed Costs breakdown (if any exist)
        const itemsWithCerts = itemBreakdowns.filter(item =>
            (item.certifications && item.certifications.length > 0) ||
            (item.fixedCosts && item.fixedCosts.length > 0)
        );

        if (itemsWithCerts.length > 0) {
            // Calculate a more accurate initial height estimate
            // This is just for the section pill - individual items will check before rendering
            const initialSectionHeight = 20; // Section pill height
            if (builder.needPageBreak(initialSectionHeight)) {
                builder.addPage();
            }

            builder.drawSectionPill('CERTIFICATIONS & FIXED COSTS', THEME.colors.sectionPurple);

            itemsWithCerts.forEach((item, idx) => {
                // Calculate estimated height for this item before rendering
                const itemDescription = `${item.description || `Item ${idx + 1}`}:`;
                const maxDescriptionWidth = builder.contentWidth - 16;

                // Set font to calculate text wrapping accurately
                builder.setFont('helvetica', 'bold', THEME.fonts.body);
                const descriptionLines = builder.doc.splitTextToSize(itemDescription, maxDescriptionWidth);

                // Estimate item height: description lines + certifications + fixed costs + spacing
                const certCount = (item.certifications || []).filter(c => c.name && c.cost > 0).length;
                const fixedCostCount = (item.fixedCosts || []).filter(c => c.name && c.cost > 0).length;
                const estimatedItemHeight = (descriptionLines.length * 5) + 2 + // Description
                    (certCount > 0 ? 5 + (certCount * 4) : 0) + // Certifications header + items
                    (fixedCostCount > 0 ? 5 + (fixedCostCount * 4) : 0) + // Fixed costs header + items
                    8; // Bottom spacing

                // Check if we need a page break before this item
                if (builder.needPageBreak(estimatedItemHeight)) {
                    builder.addPage();
                    // Re-draw section header on new page for continuity
                    builder.setColor(THEME.colors.textMuted)
                        .setFont('helvetica', 'italic', THEME.fonts.body);
                    builder.doc.text('Certifications & Fixed Costs (continued)', builder.leftMargin, builder.y);
                    builder.y += 8;
                }

                // Item header - render multi-line description properly
                builder.setFont('helvetica', 'bold', THEME.fonts.body)
                    .setColor(THEME.colors.textDark);

                // Render each line of the description
                descriptionLines.forEach((line, lineIdx) => {
                    builder.doc.text(line, builder.leftMargin + 8, builder.y);
                    builder.y += 5; // Line height for description text
                });
                builder.y += 2; // Small gap after description

                // Certifications
                if (item.certifications && item.certifications.length > 0) {
                    builder.setFont('helvetica', 'italic', THEME.fonts.small)
                        .setColor(THEME.colors.textMuted);
                    builder.doc.text('Certifications:', builder.leftMargin + 12, builder.y);
                    builder.y += 5;

                    builder.setFont('helvetica', 'normal', THEME.fonts.small)
                        .setColor(THEME.colors.textDark);
                    item.certifications.forEach(cert => {
                        if (cert.name && cert.cost > 0) {
                            builder.doc.text(`- ${cert.name}`, builder.leftMargin + 16, builder.y);
                            builder.doc.text(formatCurrency(cert.cost), builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
                            builder.y += 4;
                        }
                    });
                }

                // Fixed Costs
                if (item.fixedCosts && item.fixedCosts.length > 0) {
                    builder.setFont('helvetica', 'italic', THEME.fonts.small)
                        .setColor(THEME.colors.textMuted);
                    builder.doc.text('Fixed Costs (One-time):', builder.leftMargin + 12, builder.y);
                    builder.y += 5;

                    builder.setFont('helvetica', 'normal', THEME.fonts.small)
                        .setColor(THEME.colors.textDark);
                    item.fixedCosts.forEach(cost => {
                        if (cost.name && cost.cost > 0) {
                            builder.doc.text(`- ${cost.name}`, builder.leftMargin + 16, builder.y);
                            builder.doc.text(formatCurrency(cost.cost), builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
                            builder.y += 4;
                        }
                    });
                }

                builder.y += 4;
            });

            builder.y += 4;
        }

        // 4. Calculation Settings (keep on same page if space allows)
        const settingsHeight = 35;
        if (builder.needPageBreak(settingsHeight)) {
            builder.addPage();
        }

        // Add consistent spacing before section
        builder.y += 8;

        builder.drawSectionPill('CALCULATION SETTINGS', THEME.colors.sectionPurple);

        // Calculate actual percentages
        const actualProfitMarginPercent = costs.landedCostBeforeMargin > 0
            ? (costs.profitMargin / costs.landedCostBeforeMargin) * 100
            : 0;
        const actualCommissionPercent = (costs.landedCostBeforeMargin + costs.profitMargin) > 0
            ? (costs.commission / (costs.landedCostBeforeMargin + costs.profitMargin)) * 100
            : 0;

        const settingsRows = [
            ['Container Selection:', 'Auto (Optimized)'],
            ['Profit Margin:', `${formatNumber(actualProfitMarginPercent, 2)}% (${settings.profitMarginMode || 'percentage'})`],
            ['Commission:', `${formatNumber(actualCommissionPercent, 2)}% (${settings.commissionMode || 'percentage'})`]
        ];

        builder.setColor(THEME.colors.textDark)
            .setFont('helvetica', 'normal', THEME.fonts.body);

        settingsRows.forEach(([label, value], i) => {
            builder.setFont('helvetica', 'bold', THEME.fonts.body);
            builder.doc.text(label, builder.leftMargin + 8, builder.y + (i * 6));
            builder.setFont('helvetica', 'normal', THEME.fonts.body);
            builder.doc.text(value, builder.leftMargin + builder.contentWidth - 8, builder.y + (i * 6), { align: 'right' });
        });

        builder.y += settingsRows.length * 6 + 8; // Consistent spacing after section

        // PAGE 2 - DETAILED BREAKDOWN
        builder.addPage();

        builder.drawSectionPill('DETAILED COST BREAKDOWN', THEME.colors.sectionOrange);

        // 1. China Costs
        builder.setColor(THEME.colors.textDark)
            .setFont('helvetica', 'bold', 11);
        builder.doc.text('1. CHINA COSTS (USD)', builder.leftMargin, builder.y);
        builder.y += 8;

        builder.setFont('helvetica', 'normal', THEME.fonts.body);
        builder.doc.text(`${priceLabel} Product Cost`, builder.leftMargin + 10, builder.y);
        builder.setFont('helvetica', 'bold', THEME.fonts.body);
        builder.doc.text(formatCurrency(costs.totalExwCost), builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
        builder.y += 6;

        if (settings.pricingMode === 'EXW') {
            builder.setFont('helvetica', 'normal', THEME.fonts.body);
            builder.doc.text('Domestic China Shipping', builder.leftMargin + 10, builder.y);
            builder.setFont('helvetica', 'bold', THEME.fonts.body);
            builder.doc.text(formatCurrency(costs.domesticChinaShipping || 0), builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
            builder.y += 6;
        }
        builder.y += 8;

        // 2. International Shipping
        builder.setFont('helvetica', 'bold', 11);
        builder.doc.text('2. INTERNATIONAL SHIPPING (USD)', builder.leftMargin, builder.y);
        builder.y += 8;

        const shippingCosts = [
            ['Sea Freight', formatCurrency(costs.seaFreight)],
            ['Insurance (0.5% of CIF)', formatCurrency(costs.insurance)],
            ['Certification', formatCurrency(costs.certificationCost)],
            ...(costs.fixedCostTotal > 0 ? [['Fixed Costs (One-time)', formatCurrency(costs.fixedCostTotal)]] : []),
            ['CIF Value', formatCurrency(costs.cifValue)]
        ];

        builder.setFont('helvetica', 'normal', THEME.fonts.body);
        shippingCosts.forEach(([label, value]) => {
            builder.doc.text(label, builder.leftMargin + 10, builder.y);
            builder.setFont('helvetica', 'bold', THEME.fonts.body);
            builder.doc.text(value, builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
            builder.setFont('helvetica', 'normal', THEME.fonts.body);
            builder.y += 6;
        });
        builder.y += 8;

        // 3. Qatar Clearance Costs (using single source of truth structure)
        builder.setFont('helvetica', 'bold', 11);
        builder.doc.text('3. QATAR CLEARANCE COSTS (QAR)', builder.leftMargin, builder.y);
        builder.y += 8;

        // Single source of truth for Qatar charge line items with validation
        const qatarChargeItems = [
            {
                section: 'Government & Customs', items: [
                    ['Customs Duty (5%)', costs.qatarCharges.customsDuty],
                    ['Mwani Charges', costs.qatarCharges.mwaniCharges]
                ]
            },
            {
                section: 'CMA CGM Shipping Line Fees', items: [
                    ['Delivery Order', costs.qatarCharges.deliveryOrderFees],
                    ['Terminal Handling (THC)', costs.qatarCharges.terminalHandling],
                    ['Container Return', costs.qatarCharges.containerReturn],
                    ['Container Maintenance', costs.qatarCharges.containerMaintenance],
                    ['Terminal Inspection', costs.qatarCharges.terminalInspection],
                    ['Inspection Charge', costs.qatarCharges.inspectionCharge]
                ]
            },
            {
                section: 'MOFA Attestation (Tiered)', items: [
                    ['Commercial Invoice', costs.qatarCharges.documentAttestation - 150],
                    ['Certificate of Origin', 150]
                ]
            },
            {
                section: 'Clearance & Delivery', items: [
                    ['Clearance Charges', costs.qatarCharges.clearanceCharges],
                    ['Local Transport', costs.qatarCharges.localTransport]
                ]
            }
        ];

        // Validate and render sections
        let calculatedTotal = 0;
        qatarChargeItems.forEach(({ section, items }) => {
            // Section header
            builder.setFont('helvetica', 'italic', THEME.fonts.body)
                .setColor(THEME.colors.textMuted);
            builder.doc.text(`${section}:`, builder.leftMargin + 10, builder.y);
            builder.y += 6;

            // Section items
            builder.setFont('helvetica', 'normal', THEME.fonts.body)
                .setColor(THEME.colors.textDark);
            items.forEach(([label, value]) => {
                // Validate each item
                if (typeof value !== 'number' || isNaN(value)) {
                    throw new Error(`Invalid Qatar charge item: ${label} = ${value}`);
                }
                calculatedTotal += value;

                builder.doc.text(label, builder.leftMargin + 20, builder.y);
                builder.setFont('helvetica', 'bold', THEME.fonts.body);
                builder.doc.text(`QAR ${formatNumber(value, 2)}`, builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
                builder.setFont('helvetica', 'normal', THEME.fonts.body);
                builder.y += 5;
            });
            builder.y += 3;
        });

        // Validation: ensure displayed total matches calculated total
        if (Math.abs(calculatedTotal - costs.totalQatarChargesQar) > 0.01) {
            throw new Error(`Qatar charges mismatch: displayed=${calculatedTotal}, calculated=${costs.totalQatarChargesQar}`);
        }

        // Total Qatar Charges
        builder.setFillColor(THEME.colors.cardBg);
        builder.doc.rect(builder.leftMargin + 10, builder.y - 2, builder.contentWidth - 20, 10, 'F');
        builder.setFont('helvetica', 'bold', THEME.fonts.body)
            .setColor(THEME.colors.textDark);
        builder.doc.text('Total Qatar Charges:', builder.leftMargin + 15, builder.y + 3);
        builder.doc.text(`QAR ${formatNumber(costs.totalQatarChargesQar, 2)}`, builder.leftMargin + builder.contentWidth - 15, builder.y + 3, { align: 'right' });
        builder.y += 6;
        builder.setFont('helvetica', 'normal', THEME.fonts.body)
            .setColor(THEME.colors.textMuted);
        builder.doc.text('(Converted to USD):', builder.leftMargin + 15, builder.y);
        builder.setFont('helvetica', 'bold', THEME.fonts.body)
            .setColor(THEME.colors.textDark);
        builder.doc.text(formatCurrency(costs.totalQatarChargesUsd), builder.leftMargin + builder.contentWidth - 15, builder.y, { align: 'right' });
        builder.y += 15;

        // 4. Final Costs
        builder.setFont('helvetica', 'bold', 11);
        builder.doc.text('4. FINAL COSTS (USD)', builder.leftMargin, builder.y);
        builder.y += 8;

        const finalCosts = [
            ['Landed Cost (before margin)', formatCurrency(costs.ddpTotal - costs.profitMargin - costs.commission)],
            ['Profit Margin', formatCurrency(costs.profitMargin)],
            ['Commission', formatCurrency(costs.commission)]
        ];

        builder.setFont('helvetica', 'normal', THEME.fonts.body);
        finalCosts.forEach(([label, value]) => {
            builder.doc.text(label, builder.leftMargin + 10, builder.y);
            builder.setFont('helvetica', 'bold', THEME.fonts.body);
            builder.doc.text(value, builder.leftMargin + builder.contentWidth - 10, builder.y, { align: 'right' });
            builder.setFont('helvetica', 'normal', THEME.fonts.body);
            builder.y += 6;
        });
        builder.y += 10;

        // Total DDP Price banner
        builder.drawTotalBanner('TOTAL DDP PRICE:', formatCurrency(costs.ddpTotal));

        return builder.doc;

    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
};
