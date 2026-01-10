import { QUOTATION_COLORS } from './defaultTerms';

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
        deliveryTerms,
        timelineTerms,
        paymentTerms,
        bankDetails,
        showPictureColumn = true,
        customBlocks = [],
        quantityUnit = 'pcs'
    } = data;

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
            margin: 15mm;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background: ${QUOTATION_COLORS.background};
            color: ${QUOTATION_COLORS.textDark};
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            page-break-after: always;
            padding: 15mm 10mm;
            box-shadow: none;
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
            color: ${QUOTATION_COLORS.primary};
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 11px;
            color: #555;
            line-height: 1.4;
        }

        .quotation-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: ${QUOTATION_COLORS.primary};
            margin: 20px 0;
            font-family: 'Roboto', sans-serif;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            direction: ltr;
            font-family: 'Roboto', sans-serif;
        }

        th {
            background: ${QUOTATION_COLORS.primary};
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            font-family: 'Roboto', sans-serif;
        }

        td {
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: center;
            font-size: 11px;
            font-family: 'Roboto', sans-serif;
        }

        td.description {
            text-align: left;
            direction: ltr;
            font-weight: bold;
        }

        .item-image {
            max-width: 300px;
            max-height: 300px;
            object-fit: contain;
        }

        .total-row {
            background: ${QUOTATION_COLORS.primary};
            color: white;
            font-weight: bold;
        }

        .terms-section {
            margin: 20px 0;
            direction: rtl;
            text-align: right;
        }

        .terms-title {
            font-size: 14px;
            font-weight: bold;
            color: ${QUOTATION_COLORS.primary};
            margin-bottom: 10px;
        }

        .term-item {
            margin: 8px 0 8px 20px;
            font-size: 12px;
            line-height: 1.8;
        }

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
            }
            .page {
                margin: 0;
                page-break-after: always;
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

        <div class="quotation-title">DDP Quotation</div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    ${showPictureColumn ? '<th>Picture</th>' : ''}
                    <th>Description</th>
                    <th>Qty (${quantityUnit})</th>
                    <th>Price (USD)</th>
                    <th>Total (USD)</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        ${showPictureColumn ? `<td>${item.image ? `<img src="${item.image}" class="item-image" alt="Product">` : ''}</td>` : ''}
                        <td class="description">${item.description || ''}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="${showPictureColumn ? '5' : '4'}">Total</td>
                    <td>$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Custom Blocks (After Table) -->
        ${customBlocks.map(block => `
            <div class="terms-section" style="margin-top: 30px;">
                <div class="terms-title">${block.title}</div>
                ${block.sections.map(section => `
                    <div style="margin-top: 15px;">
                        <strong>● ${section.title}:</strong>
                        ${section.items.map(item => `<div class="term-item">○ ${item}</div>`).join('')}
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <!-- Fixed Terms - Right below custom blocks -->
        <div class="terms-section" style="margin-top: 20px;">
            <div class="terms-title">معلومات خاصة بالعرض:</div>

            <div style="margin-top: 15px;">
                <strong>● التسليم:</strong>
                ${deliveryTerms.map(term => `<div class="term-item">○ ${term}</div>`).join('')}
            </div>

            <div style="margin-top: 15px;">
                <strong>● المدة الزمنية:</strong>
                ${timelineTerms.map(term => `<div class="term-item">○ ${term}</div>`).join('')}
            </div>

            <div style="margin-top: 15px;">
                <strong>● الدفع:</strong>
                ${paymentTerms.map(term => `<div class="term-item">○ ${term}</div>`).join('')}
            </div>

            <div style="margin-top: 15px;">
                <strong>● التحويلات:</strong>
                <div class="term-item">يتم التحويل على الحساب البنكي الخاص بالشركة بالتفاصيل التالية:</div>
            </div>
        </div>

        <div class="bank-details">
            <p><strong>Account name:</strong> ${bankDetails.accountName}</p>
            <p><strong>Account number/IBAN:</strong> ${bankDetails.accountNumber}</p>
            <p><strong>Bank name:</strong> ${bankDetails.bankName}</p>
            <p><strong>Bank SWIFT/BIC:</strong> ${bankDetails.swiftBic}</p>
            <p><strong>Bank address:</strong> ${bankDetails.bankAddress}</p>
            <p><strong>Bank country:</strong> ${bankDetails.bankCountry}</p>
        </div>

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
