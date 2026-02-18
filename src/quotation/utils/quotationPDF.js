import { detectTextDirection, escapeHtml } from './bidiUtils';
import { pdfLogger as logger } from '../../utils/logger';

/**
 * Convert an image URL to base64 data URI
 * @param {string} url - The image URL to convert
 * @returns {Promise<string|null>} Base64 data URI or null if failed
 */
const imageToBase64 = async (url) => {
    try {
        logger.debug('Converting image to base64', { url });
        const response = await fetch(url);
        if (!response.ok) {
            logger.warn('Image fetch failed', { url, status: response.status });
            return null;
        }
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => {
                logger.warn('FileReader error for image', { url });
                resolve(null);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        logger.error('Error converting image to base64', { error, url });
        return null;
    }
};

/**
 * Generate quotation PDF using server-side Puppeteer rendering
 * This provides perfect Arabic/English bidirectional text support
 */
export const generateQuotationPDF = async (data) => {
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

    // Load images as base64 for server-side rendering
    // The server can't access client URLs, so we embed images directly
    const baseUrl = window.location.origin;
    const [logoBase64, footerBase64] = await Promise.all([
        imageToBase64(`${baseUrl}/logo-standalone-web.png`),
        imageToBase64(`${baseUrl}/footer.png`)
    ]);

    // Generate standalone HTML with embedded fonts from Google Fonts CDN
    // Using Noto Sans Arabic for proper Arabic text support + Roboto for English
    const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyInfo.name} - Quotation - ${formattedDate}</title>

    <!-- Google Fonts with Arabic support -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 15mm 10mm 20mm 10mm; /* top, right, bottom, left */
        }

        body {
            font-family: 'Roboto', 'Noto Sans Arabic', sans-serif;
            background: #FFFFFF;
            color: #1B2B38;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 100%;
            background: #FFFFFF;
            color: #1B2B38;
        }

        /* Page break controls */
        thead {
            display: table-header-group; /* Repeat header on each page */
        }

        tr {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* Prevent orphaned headers - keep title with first item only */
        .terms-title {
            break-after: avoid;
            page-break-after: avoid;
        }

        /* Section titles (bullets) - keep with first sub-item */
        .section-block > strong {
            break-after: avoid;
            page-break-after: avoid;
        }

        /* Allow sections to break across pages - only keep individual items together */
        .terms-section {
            break-inside: auto;
            page-break-inside: auto;
        }

        /* Each term item (sub-bullet) can break independently */
        .term-item {
            break-inside: avoid;
            page-break-inside: avoid;
            orphans: 2;
            widows: 2;
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
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            direction: ltr;
            border: 1px solid #ddd;
        }

        th {
            background: #D65A1F;
            color: #FFFFFF;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #D65A1F;
        }

        td {
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: center;
            font-size: 11px;
            color: #1B2B38;
        }

        td.description {
            font-weight: bold;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 200px;
            white-space: pre-wrap;
        }

        /* Bidirectional text support */
        .bidi-rtl {
            direction: rtl;
            text-align: right;
            unicode-bidi: isolate;
            font-family: 'Noto Sans Arabic', 'Roboto', sans-serif;
        }

        .bidi-ltr {
            direction: ltr;
            text-align: left;
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
            font-family: 'Noto Sans Arabic', 'Roboto', sans-serif;
            /* Allow sections to break - only individual items stay together */
        }

        .terms-title {
            break-after: avoid;
            page-break-after: avoid;
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
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* Section blocks - allow to break, but keep title with first item */
        .section-block {
            break-inside: auto;
            page-break-inside: auto;
        }

        .section-image {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            margin: 10px 0 10px 20px;
            border-radius: 4px;
        }

        .footer-bar {
            max-height: 80px;
            max-width: 300px;
            object-fit: contain;
            display: block;
            margin-left: auto;
            margin-top: 30px;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                background: #FFFFFF !important;
                color: #1B2B38 !important;
            }
            .page {
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
            /* Ensure table headers repeat on each page */
            thead {
                display: table-header-group;
            }
            /* Prevent rows from breaking */
            tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="company-info">
                <div class="company-name">${escapeHtml(companyInfo.name)}</div>
                <div class="company-details">${escapeHtml(companyInfo.address).replace(/\n/g, '<br>')}</div>
                <div class="company-details">${escapeHtml(companyInfo.email)}</div>
                <div class="company-details">${formattedDate}</div>
            </div>
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ''}
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
                    const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
                    const descriptionText = item.description || '';
                    const descriptionDir = detectTextDirection(descriptionText);
                    const descriptionHtml = escapeHtml(descriptionText).replace(/\n/g, '<br>');
                    return `
                    <tr>
                        <td>${index + 1}</td>
                        ${showPictureColumn ? `<td>${images.length > 0 ? `<div class="images-container">${images.map((img, imgIdx) => `<img src="${img}" class="item-image" alt="Product ${imgIdx + 1}">`).join('')}</div>` : ''}</td>` : ''}
                        <td class="description ${descriptionDir === 'rtl' ? 'bidi-rtl' : 'bidi-ltr'}">${descriptionHtml}</td>
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

        <!-- Custom Blocks (Terms & Bank Details) -->
        ${customBlocks.map(block => {
            const blockTitleDir = detectTextDirection(block.title);
            return `
            <div class="terms-section" style="margin-top: 30px; direction: ${blockTitleDir}; text-align: ${blockTitleDir === 'rtl' ? 'right' : 'left'};">
                <div class="terms-title ${blockTitleDir === 'rtl' ? 'bidi-rtl' : 'bidi-ltr'}">${escapeHtml(block.title)}</div>
                ${block.sections.map(section => {
                    const sectionTitleDir = detectTextDirection(section.title);
                    return `
                    <div class="section-block" style="margin-top: 15px;">
                        <strong class="${sectionTitleDir === 'rtl' ? 'bidi-rtl' : 'bidi-ltr'}" style="display: inline-block;">● ${escapeHtml(section.title)}</strong>
                        ${section.items.map(item => {
                            const itemDir = detectTextDirection(item);
                            return `<div class="term-item ${itemDir === 'rtl' ? 'bidi-rtl' : 'bidi-ltr'}">○ ${escapeHtml(item)}</div>`;
                        }).join('')}
                        ${section.image ? `<img src="${section.image}" alt="Section image" class="section-image">` : ''}
                    </div>
                `}).join('')}
            </div>
        `}).join('')}

        ${footerBase64 ? `<img src="${footerBase64}" alt="Footer" class="footer-bar">` : ''}
    </div>
</body>
</html>
    `;

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeCompanyName = companyInfo.name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
    const filename = `${safeCompanyName}-Quotation-${timestamp}.pdf`;

    try {
        // Determine backend URL based on environment
        const backendUrl = getBackendUrl();

        logger.info('Sending PDF generation request to server', {
            backendUrl,
            filename,
            itemCount: items.length,
            htmlSize: html.length
        });

        // Send HTML to backend for PDF generation
        const response = await fetch(`${backendUrl}/api/documents/html-to-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html, filename }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            logger.error('Server PDF generation failed', {
                status: response.status,
                error: errorData.error,
                filename
            });
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        // Download the PDF
        const blob = await response.blob();
        logger.info('PDF generated successfully', {
            filename,
            blobSize: blob.size
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        logger.info('PDF download triggered', { filename });

    } catch (error) {
        logger.error('PDF generation error', { error, filename });
        // Show user-friendly error message
        alert(`Failed to generate PDF: ${error.message}\n\nPlease try the "Print to PDF" option instead.`);
        throw error;
    }
};

/**
 * Determine the backend URL based on current environment
 */
function getBackendUrl() {
    // In production/staging, use relative URL (same origin)
    if (window.location.hostname.includes('arabiantraderoute.com') ||
        window.location.hostname.includes('tradebridgesme.com')) {
        // The DDP calculator runs on internal subdomain, backend is proxied
        return '';
    }

    // Local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }

    // Default to same origin
    return '';
}
