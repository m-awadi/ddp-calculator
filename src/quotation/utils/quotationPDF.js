import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QUOTATION_COLORS } from './defaultTerms';
import { preserveArabicText } from './arabicText';

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

/**
 * Generate professional quotation PDF matching Arabian Trade Route template
 */
export const generateQuotationPDF = async (data) => {
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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Convert hex colors to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const primaryRGB = hexToRgb(QUOTATION_COLORS.primary);
    const secondaryRGB = hexToRgb(QUOTATION_COLORS.secondary);
    const backgroundRGB = hexToRgb(QUOTATION_COLORS.background);

    // Load logo and footer images
    const logoImage = await loadImageAsBase64('/logo-standalone-web.png');
    const footerImage = await loadImageAsBase64('/page_footer.png');

    let yPos = margin;

    // Helper function to add logo
    const addLogo = (x, y, width = 30, height = 30) => {
        if (logoImage) {
            try {
                doc.addImage(logoImage, 'PNG', x, y, width, height);
            } catch (e) {
                console.error('Error adding logo:', e);
            }
        }
    };

    // Add page background
    doc.setFillColor(backgroundRGB.r, backgroundRGB.g, backgroundRGB.b);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Company name and logo
    addLogo(pageWidth - margin - 30, yPos, 30, 30);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    doc.text(companyInfo.name, margin, yPos + 7);

    yPos += 12;

    // Company address
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const addressLines = companyInfo.address.split('\n');
    addressLines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += 4;
    });

    // Email
    doc.text(companyInfo.email, margin, yPos);
    yPos += 8;

    // Date
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    doc.text(formattedDate, margin, yPos);
    yPos += 10;

    // Title "DDP Quotation"
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    doc.text('DDP Quotation', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Items table
    const tableData = items.map((item, index) => {
        const row = [
            (index + 1).toString(),
        ];
        if (showPictureColumn) {
            row.push(''); // Image placeholder
        }
        row.push(
            item.description || '',
            item.quantity.toString(),
            `$${item.price.toFixed(2)}`,
            `$${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        );
        return row;
    });

    // Add total row
    const totalRowData = [];
    totalRowData.push({
        content: 'Total',
        colSpan: showPictureColumn ? 5 : 4,
        styles: {
            fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        }
    });
    totalRowData.push({
        content: '$' + totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        styles: {
            fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'right'
        }
    });
    tableData.push(totalRowData);

    // Build table header
    const tableHeader = ['Item'];
    if (showPictureColumn) {
        tableHeader.push('Picture');
    }
    tableHeader.push('Description', `Qty (${quantityUnit})`, 'Price (USD)', 'Total (USD)');

    // Build column styles
    const columnStyles = {};
    let colIndex = 0;
    columnStyles[colIndex++] = { cellWidth: 15, halign: 'center' }; // Item
    if (showPictureColumn) {
        columnStyles[colIndex++] = { cellWidth: 60, halign: 'center' }; // PIC (increased from 35)
    }
    columnStyles[colIndex++] = { cellWidth: showPictureColumn ? 50 : 90 }; // Description (wider when no PIC)
    columnStyles[colIndex++] = { cellWidth: 25, halign: 'center' }; // Qty
    columnStyles[colIndex++] = { cellWidth: 25, halign: 'right' }; // Price
    columnStyles[colIndex++] = { cellWidth: 30, halign: 'right' }; // Total

    autoTable(doc, {
        startY: yPos,
        head: [tableHeader],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: columnStyles,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.5
        },
        didDrawCell: (data) => {
            // Add images to PIC column (index 1 when shown)
            const picColumnIndex = showPictureColumn ? 1 : -1;
            if (showPictureColumn && data.column.index === picColumnIndex && data.row.index < items.length) {
                const item = items[data.row.index];
                if (item.image) {
                    const cellX = data.cell.x;
                    const cellY = data.cell.y;
                    const cellWidth = data.cell.width;
                    const cellHeight = data.cell.height;

                    try {
                        // Calculate image dimensions to fit and center (max 300x300)
                        const maxImgSize = Math.min(cellWidth - 4, cellHeight - 4, 300);
                        const imgSize = maxImgSize;
                        const imgX = cellX + (cellWidth - imgSize) / 2;
                        const imgY = cellY + (cellHeight - imgSize) / 2;

                        doc.addImage(item.image, 'JPEG', imgX, imgY, imgSize, imgSize);
                    } catch (e) {
                        console.error('Error adding image:', e);
                    }
                }
            }
        }
    });

    // Footer image on first page (bottom right, maintain aspect ratio)
    if (footerImage) {
        try {
            const footerMaxWidth = 100;
            const footerMaxHeight = 30;
            const footerX = pageWidth - margin - footerMaxWidth;
            const footerY = pageHeight - margin - footerMaxHeight;
            doc.addImage(footerImage, 'PNG', footerX, footerY, footerMaxWidth, footerMaxHeight);
        } catch (e) {
            console.error('Error adding footer:', e);
        }
    }

    // Page 2 - Terms
    doc.addPage();

    // Add page background
    doc.setFillColor(backgroundRGB.r, backgroundRGB.g, backgroundRGB.b);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = margin;

    // Add logo on top right
    addLogo(pageWidth - margin - 30, yPos, 30, 30);
    yPos += 40;

    // Terms header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    doc.text(preserveArabicText('معلومات خاصة بالعرض:'), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
    yPos += 10;

    // Delivery section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(preserveArabicText('● التسليم:'), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    deliveryTerms.forEach(term => {
        if (term.trim()) {
            doc.text(preserveArabicText('○ ' + term), pageWidth - margin, yPos, { align: 'right', maxWidth: pageWidth - 2 * margin, lang: 'ar' });
            yPos += 6;
        }
    });
    yPos += 4;

    // Timeline section
    doc.setFont('helvetica', 'bold');
    doc.text(preserveArabicText('● المدة الزمنية:'), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    timelineTerms.forEach(term => {
        if (term.trim()) {
            doc.text(preserveArabicText('○ ' + term), pageWidth - margin, yPos, { align: 'right', maxWidth: pageWidth - 2 * margin, lang: 'ar' });
            yPos += 6;
        }
    });
    yPos += 4;

    // Payment section
    doc.setFont('helvetica', 'bold');
    doc.text(preserveArabicText('● الدفع:'), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    paymentTerms.forEach(term => {
        if (term.trim()) {
            doc.text(preserveArabicText('○ ' + term), pageWidth - margin, yPos, { align: 'right', maxWidth: pageWidth - 2 * margin, lang: 'ar' });
            yPos += 6;
        }
    });
    yPos += 8;

    // Bank transfers section
    doc.setFont('helvetica', 'bold');
    doc.text(preserveArabicText('● التحويلات:'), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(preserveArabicText('يتم التحويل على الحساب البنكي الخاص بالشركة بالتفاصيل التالية:'), pageWidth - margin, yPos, { align: 'right', maxWidth: pageWidth - 2 * margin, lang: 'ar' });
    yPos += 10;

    // Bank details
    doc.setFont('helvetica', 'normal');
    doc.text(`Account name: ${bankDetails.accountName}`, margin, yPos);
    yPos += 5;
    doc.text(`Account number/IBAN: ${bankDetails.accountNumber}`, margin, yPos);
    yPos += 5;
    doc.text(`Bank name: ${bankDetails.bankName}`, margin, yPos);
    yPos += 5;
    doc.text(`Bank SWIFT/BIC: ${bankDetails.swiftBic}`, margin, yPos);
    yPos += 5;
    doc.text(`Bank address: ${bankDetails.bankAddress}`, margin, yPos);
    yPos += 5;
    doc.text(`Bank country: ${bankDetails.bankCountry}`, margin, yPos);

    // Footer image on second page (bottom right, maintain aspect ratio)
    if (footerImage) {
        try {
            const footerMaxWidth = 100;
            const footerMaxHeight = 30;
            const footerX = pageWidth - margin - footerMaxWidth;
            const footerY = pageHeight - margin - footerMaxHeight;
            doc.addImage(footerImage, 'PNG', footerX, footerY, footerMaxWidth, footerMaxHeight);
        } catch (e) {
            console.error('Error adding footer:', e);
        }
    }

    // Download
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeCompanyName = companyInfo.name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
    doc.save(`${safeCompanyName}-Quotation-${timestamp}.pdf`);
};
