import { QUOTATION_COLORS } from './defaultTerms';
import { detectTextDirection, escapeHtml, BIDI_CSS } from './bidiUtils';

/**
 * Generate HTML version of quotation for perfect Arabic support
 * User can print this to PDF using browser's Print dialog
 */
export const generateQuotationHTML = (data) => {
    const {
        date,
        items,
        totalQAR,
        totalUSD,
        companyInfo,
        showPictureColumn = true,
        showCertificationColumn = false,
        extraColumnLabel = 'Extra',
        customBlocks = [],
        quantityUnit = 'pcs',
        totalCertificationCost = 0,
        totalLabTestCost = 0,
        totalCertLabCost = 0,
        totalOneTimeCost = 0,
        totalAddonsCost = 0,
        showQAR = false,
        qarExchangeRate = 3.65,
        quotationTitle = 'DDP Quotation'
    } = data;

    // Helper function to format currency with optional QAR
    const formatCurrency = (usdAmount) => {
        const usdFormatted = '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (showQAR) {
            const qarAmount = usdAmount * qarExchangeRate;
            return `${usdFormatted}<br><span class="qar-amount">(${qarAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR)</span>`;
        }
        return usdFormatted;
    };

    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyInfo.name} - Quotation - ${formattedDate}</title>

    <!-- Preload fonts for faster loading -->
    <link rel="preload" href="/Roboto/static/roboto/Roboto-Regular.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="preload" href="/Roboto/static/roboto/Roboto-Medium.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="preload" href="/Roboto/static/roboto/Roboto-Bold.ttf" as="font" type="font/ttf" crossorigin>

    <style>
        @font-face {
            font-family: 'Roboto';
            src: url('/Roboto/static/roboto/Roboto-Regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
            font-display: block;
        }

        @font-face {
            font-family: 'Roboto';
            src: url('/Roboto/static/roboto/Roboto-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
            font-display: block;
        }

        @font-face {
            font-family: 'Roboto';
            src: url('/Roboto/static/roboto/Roboto-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
            font-display: block;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 0;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background: #FFFFFF;
            color: #1B2B38;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #FFFFFF;
            position: relative;
            page-break-after: always;
            padding: 15mm 10mm;
            box-shadow: none;
            color: #1B2B38;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }

        .logo {
            width: 80px;
            height: 80px;
        }

        .company-info {
            text-align: left;
            direction: ltr;
        }

        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #D65A1F;
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 11px;
            color: #333333;
            line-height: 1.4;
        }

        .quotation-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #D65A1F;
            margin: 20px 0;
            font-family: 'Roboto', sans-serif;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            direction: ltr;
            font-family: 'Roboto', sans-serif;
            border: 1px solid #ddd;
        }

        th {
            background: #D65A1F;
            color: #FFFFFF;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            font-family: 'Roboto', sans-serif;
            border: 1px solid #D65A1F;
        }

        td {
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: center;
            font-size: 11px;
            font-family: 'Roboto', sans-serif;
            color: #1B2B38;
        }

        td.description {
            font-weight: bold;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 200px; /* Prevent description from taking too much space */
            white-space: pre-wrap; /* Preserve line breaks and wrap text */
            /* Bidirectional text support - direction set per cell */
        }

        /* Bidirectional text support */
        .bidi-text {
            unicode-bidi: isolate;
        }

        .bidi-rtl {
            direction: rtl;
            text-align: right;
            unicode-bidi: isolate;
        }

        .bidi-ltr {
            direction: ltr;
            text-align: left;
            unicode-bidi: isolate;
        }

        /* For mixed RTL/LTR content - auto-detect direction */
        [dir="auto"] {
            unicode-bidi: isolate;
        }

        .item-image {
            max-width: 300px;
            max-height: 300px;
            object-fit: contain;
            display: block;
            margin: 4px auto;
        }

        .images-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .cert-cell {
            font-size: 10px;
            text-align: left;
            padding: 8px;
            vertical-align: top;
        }

        .cert-type {
            font-weight: bold;
            color: #D65A1F;
            margin-bottom: 4px;
        }

        .cert-detail {
            color: #333333;
            margin: 2px 0;
        }

        .total-row {
            background: #D65A1F;
            color: #FFFFFF;
            font-weight: bold;
        }

        .total-row td {
            color: #FFFFFF;
        }

        .grand-total-row {
            background: #EC722D;
            color: #FFFFFF;
            font-weight: bold;
        }

        .grand-total-row td {
            color: #FFFFFF;
        }

        .qar-amount {
            font-size: 10px;
            color: #666666;
            display: block;
        }

        .total-row .qar-amount,
        .grand-total-row .qar-amount {
            color: #FFFFFF;
            opacity: 0.9;
        }

        .terms-section {
            margin: 20px 0;
            direction: rtl;
            text-align: right;
        }

        .terms-title {
            font-size: 14px;
            font-weight: bold;
            color: #D65A1F;
            margin-bottom: 10px;
        }

        .term-item {
            margin: 8px 0 8px 20px;
            font-size: 12px;
            line-height: 1.8;
            color: #1B2B38;
        }

        .section-image {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            margin: 10px 0 10px 20px;
            border-radius: 4px;
        }

        /* Bank details now handled by custom blocks, but keeping class just in case users add it manually or for legacy support */
        .bank-details {
            direction: ltr;
            text-align: left;
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
        }

        .bank-details p {
            margin: 5px 0;
            font-size: 11px;
        }

        .footer-bar {
            position: absolute;
            bottom: 0;
            right: 0;
            max-height: 80px;
            max-width: 300px;
            object-fit: contain;
            display: none;
        }

        .page:last-of-type .footer-bar {
            display: block;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                background: #FFFFFF !important;
                color: #1B2B38 !important;
            }
            .page {
                margin: 0;
                page-break-after: always;
                background: #FFFFFF !important;
                color: #1B2B38 !important;
            }
            td {
                color: #1B2B38 !important;
            }
            .total-row td,
            .grand-total-row td {
                color: #FFFFFF !important;
            }
            .company-details {
                color: #333333 !important;
            }
            .term-item {
                color: #1B2B38 !important;
            }
            .cert-detail {
                color: #333333 !important;
            }
            .qar-amount {
                color: #666666 !important;
            }
            .total-row .qar-amount,
            .grand-total-row .qar-amount {
                color: #FFFFFF !important;
            }
        }
    </style>
</head>
<body>
    <!-- Page 1 -->
    <div class="page">
        <div class="header">
            <div class="company-info">
                <div class="company-name">${companyInfo.name}</div>
                <div class="company-details">${companyInfo.address.replace(/\n/g, '<br>')}</div>
                <div class="company-details">${companyInfo.email}</div>
                <div class="company-details">${formattedDate}</div>
            </div>
            <img src="/logo-standalone-web.png" alt="Logo" class="logo">
        </div>

        <div class="quotation-title">${escapeHtml(quotationTitle)}</div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    ${showPictureColumn ? '<th>Picture</th>' : ''}
                    <th>Description</th>
                    <th>Qty (${quantityUnit})</th>
                    <th>Price (USD)</th>
                    <th>Total (USD)</th>
                    ${showCertificationColumn ? `<th>${escapeHtml(extraColumnLabel)}</th>` : ''}
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => {
                    const certCost = parseFloat(item.certificationCost) || 0;
                    const labCost = parseFloat(item.labTestCost) || 0;
                    const oneTimeCost = parseFloat(item.oneTimeCost) || 0;
                    const totalItemAddons = certCost + labCost + oneTimeCost;
                    const oneTimeDesc = item.oneTimeCostDescription || 'One-Time';
                    // Support both legacy single image and new multi-image array
                    const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
                    // Escape HTML and preserve newlines in description with proper bidi handling
                    const descriptionText = item.description || '';
                    const descriptionDir = detectTextDirection(descriptionText);
                    const descriptionHtml = escapeHtml(descriptionText).replace(/\n/g, '<br>');
                    return `
                    <tr>
                        <td>${index + 1}</td>
                        ${showPictureColumn ? `<td>${images.length > 0 ? `<div class="images-container">${images.map((img, imgIdx) => `<img src="${img}" class="item-image" alt="Product ${imgIdx + 1}">`).join('')}</div>` : ''}</td>` : ''}
                        <td class="description" dir="${descriptionDir}" style="direction: ${descriptionDir}; text-align: ${descriptionDir === 'rtl' ? 'right' : 'left'}; unicode-bidi: isolate;">${descriptionHtml}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${formatCurrency(item.quantity * item.price)}</td>
                        ${showCertificationColumn ? `
                        <td class="cert-cell">
                            ${totalItemAddons > 0 ? `
                                ${item.certificationType ? `<div class="cert-type">${escapeHtml(item.certificationType)}</div>` : ''}
                                ${certCost > 0 ? `<div class="cert-detail">Cert: $${certCost.toFixed(2)}</div>` : ''}
                                ${labCost > 0 ? `<div class="cert-detail">Lab: $${labCost.toFixed(2)}</div>` : ''}
                                ${oneTimeCost > 0 ? `<div class="cert-detail">${escapeHtml(oneTimeDesc)}: $${oneTimeCost.toFixed(2)}</div>` : ''}
                                <div class="cert-detail" style="font-weight: bold; margin-top: 4px;">Total: $${totalItemAddons.toFixed(2)}</div>
                            ` : ''}
                        </td>
                        ` : ''}
                    </tr>
                `}).join('')}
                <tr class="total-row">
                    <td colspan="${showPictureColumn ? '5' : '4'}">${totalAddonsCost > 0 ? 'Product Total' : 'Total'}</td>
                    <td>${formatCurrency(totalUSD)}</td>
                    ${showCertificationColumn ? `<td>${totalAddonsCost > 0 ? formatCurrency(totalAddonsCost) : ''}</td>` : ''}
                </tr>
                ${totalAddonsCost > 0 ? `
                <tr class="grand-total-row">
                    <td colspan="${showPictureColumn ? (showCertificationColumn ? '6' : '5') : (showCertificationColumn ? '5' : '4')}">Grand Total (Products + Add-ons)</td>
                    <td colspan="${showCertificationColumn ? '2' : '1'}">${formatCurrency(totalUSD + totalAddonsCost)}</td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        <!-- Custom Blocks (Now includes Terms & Bank Details) -->
        ${customBlocks.map(block => {
            const blockTitleDir = detectTextDirection(block.title);
            return `
            <div class="terms-section" style="margin-top: 30px; direction: ${blockTitleDir}; text-align: ${blockTitleDir === 'rtl' ? 'right' : 'left'};">
                <div class="terms-title" dir="${blockTitleDir}" style="unicode-bidi: isolate;">${escapeHtml(block.title)}</div>
                ${block.sections.map(section => {
                    const sectionTitleDir = detectTextDirection(section.title);
                    return `
                    <div style="margin-top: 15px;">
                        <strong dir="${sectionTitleDir}" style="unicode-bidi: isolate; display: inline-block;">● ${escapeHtml(section.title)}</strong>
                        ${section.items.map(item => {
                            const itemDir = detectTextDirection(item);
                            return `<div class="term-item" dir="${itemDir}" style="unicode-bidi: isolate;">○ ${escapeHtml(item)}</div>`;
                        }).join('')}
                        ${section.image ? `<img src="${section.image}" alt="Section image" class="section-image">` : ''}
                    </div>
                `}).join('')}
            </div>
        `}).join('')}

        <!-- Footer - appears only on final page -->
        <img src="/footer.png" alt="Footer" class="footer-bar">
    </div>

    <script>
        // Auto-print dialog - wait for fonts to load
        window.onload = async () => {
            try {
                // Wait for all fonts to load
                await document.fonts.ready;
                // Additional delay to ensure rendering is complete
                setTimeout(() => {
                    window.print();
                }, 300);
            } catch (e) {
                // Fallback if font loading fails
                setTimeout(() => {
                    window.print();
                }, 1000);
            }
        };
    </script>
</body>
</html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
};
