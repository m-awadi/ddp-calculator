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
        showPictureColumn = true,
        showCertificationColumn = false,
        customBlocks = [],
        quantityUnit = 'pcs',
        totalCertificationCost = 0,
        totalLabTestCost = 0,
        totalCertLabCost = 0,
        totalOneTimeCost = 0,
        totalAddonsCost = 0
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
    const footerImage = await loadImageAsBase64('/footer.png');

    let yPos = margin;

    // Helper to add logo
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
        // Add certification column if enabled
        if (showCertificationColumn) {
            const certCost = parseFloat(item.certificationCost) || 0;
            const labCost = parseFloat(item.labTestCost) || 0;
            const oneTimeCost = parseFloat(item.oneTimeCost) || 0;
            const totalItemAddons = certCost + labCost + oneTimeCost;
            let certText = '';
            if (totalItemAddons > 0) {
                const parts = [];
                if (item.certificationType) {
                    parts.push(item.certificationType);
                }
                if (certCost > 0) {
                    parts.push(`Cert: $${certCost.toFixed(2)}`);
                }
                if (labCost > 0) {
                    parts.push(`Lab: $${labCost.toFixed(2)}`);
                }
                if (oneTimeCost > 0) {
                    const desc = item.oneTimeCostDescription || 'One-Time';
                    parts.push(`${desc}: $${oneTimeCost.toFixed(2)}`);
                }
                certText = parts.join('\n');
            }
            row.push(certText);
        }
        return row;
    });

    // Calculate colSpan based on visible columns
    const baseColSpan = showPictureColumn ? 5 : 4;

    // Add total row
    const totalRowData = [];
    totalRowData.push({
        content: totalAddonsCost > 0 ? 'Product Total' : 'Total',
        colSpan: baseColSpan,
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
    // Add certification total column if enabled
    if (showCertificationColumn) {
        totalRowData.push({
            content: totalAddonsCost > 0 ? '$' + totalAddonsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
            styles: {
                fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'right'
            }
        });
    }
    tableData.push(totalRowData);

    // Add grand total row if add-on costs exist (ALWAYS shown when there are add-ons)
    if (totalAddonsCost > 0) {
        const grandTotalRow = [];
        grandTotalRow.push({
            content: 'Grand Total (Products + Add-ons)',
            colSpan: baseColSpan,
            styles: {
                fillColor: [secondaryRGB.r, secondaryRGB.g, secondaryRGB.b],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            }
        });
        grandTotalRow.push({
            content: '$' + (totalUSD + totalAddonsCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            colSpan: showCertificationColumn ? 2 : 1,
            styles: {
                fillColor: [secondaryRGB.r, secondaryRGB.g, secondaryRGB.b],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'right'
            }
        });
        tableData.push(grandTotalRow);
    }

    // Build table header
    const tableHeader = ['Item'];
    if (showPictureColumn) {
        tableHeader.push('Picture');
    }
    tableHeader.push('Description', `Qty (${quantityUnit})`, 'Price (USD)', 'Total (USD)');
    if (showCertificationColumn) {
        tableHeader.push('Cert/Lab Costs');
    }

    // Build column styles
    const columnStyles = {};
    let colIndex = 0;
    columnStyles[colIndex++] = { cellWidth: 15, halign: 'center' }; // Item
    if (showPictureColumn) {
        columnStyles[colIndex++] = { cellWidth: showCertificationColumn ? 50 : 60, halign: 'center' }; // PIC (smaller when cert column)
    }
    columnStyles[colIndex++] = { cellWidth: showPictureColumn ? (showCertificationColumn ? 40 : 50) : 90 }; // Description
    columnStyles[colIndex++] = { cellWidth: 20, halign: 'center' }; // Qty
    columnStyles[colIndex++] = { cellWidth: 22, halign: 'right' }; // Price
    columnStyles[colIndex++] = { cellWidth: 28, halign: 'right' }; // Total
    if (showCertificationColumn) {
        columnStyles[colIndex++] = { cellWidth: 35, halign: 'left' }; // Cert/Lab Costs
    }

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
                // Support both legacy single image and new multi-image array
                const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);

                if (images.length > 0) {
                    const cellX = data.cell.x;
                    const cellY = data.cell.y;
                    const cellWidth = data.cell.width;
                    const cellHeight = data.cell.height;

                    try {
                        // Calculate space for multiple images stacked vertically
                        const imageCount = images.length;
                        const totalGap = (imageCount - 1) * 2; // 2mm gap between images
                        const availableHeight = cellHeight - 4 - totalGap;
                        const maxImgHeight = Math.min(availableHeight / imageCount, cellWidth - 4);

                        let currentY = cellY + 2;

                        images.forEach((imgSrc, imgIdx) => {
                            const imgSize = Math.min(maxImgHeight, cellWidth - 4);
                            const imgX = cellX + (cellWidth - imgSize) / 2;

                            doc.addImage(imgSrc, 'JPEG', imgX, currentY, imgSize, imgSize);
                            currentY += imgSize + 2; // Move down for next image
                        });
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

    // Check if we need a new page for terms section
    const checkPageSpace = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - margin - 30) {
            doc.addPage();
            // Add page background
            doc.setFillColor(backgroundRGB.r, backgroundRGB.g, backgroundRGB.b);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            yPos = margin;
            // Add logo on top right
            addLogo(pageWidth - margin - 30, yPos, 30, 30);
            yPos += 40;
            return true;
        }
        return false;
    };

    // Calculate estimated height for a custom block
    const estimateBlockHeight = (block) => {
        let height = 20; // Block title + margin

        block.sections.forEach(section => {
            height += 10; // Section title
            height += (section.items.length * 6) + 5; // Items
        });

        return height;
    };

    // Render Custom Blocks
    if (customBlocks && customBlocks.length > 0) {
        // Add spacing before terms
        yPos += 15;

        customBlocks.forEach(block => {
            // Check if whole block fits, if not conservatively checks per section/item
            // But if block title is near end, push to new page
            checkPageSpace(20);

            // Block Title
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
            doc.text(preserveArabicText(block.title), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
            yPos += 10;

            block.sections.forEach(section => {
                checkPageSpace(15);

                // Section Title
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text(preserveArabicText('● ' + section.title), pageWidth - margin, yPos, { align: 'right', lang: 'ar' });
                yPos += 6;

                // Section Items
                doc.setFont('helvetica', 'normal');
                section.items.forEach(item => {
                    if (item && item.toString().trim()) {
                        checkPageSpace(8);
                        // Note: We use '○' for items
                        doc.text(preserveArabicText('○ ' + item), pageWidth - margin, yPos, { align: 'right', maxWidth: pageWidth - 2 * margin, lang: 'ar' });

                        // Calculate height of the text just added to increment yPos correctly
                        // splitTextToSize approximates lines, we assume ~5-6 per line
                        const textLines = doc.splitTextToSize(preserveArabicText('○ ' + item), pageWidth - 2 * margin);
                        yPos += (textLines.length * 6);
                    }
                });
                yPos += 4; // Spacing after section
            });

            yPos += 8; // Spacing after block
        });
    }

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
