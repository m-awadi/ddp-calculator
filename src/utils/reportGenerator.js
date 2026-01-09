import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Load footer image
    const footerImage = await loadImageAsBase64('/footer.png');

    let yPos = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243);
    doc.text('DDP Cost Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Report name (supplier name) if provided
    if (reportName) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(16, 185, 129); // Emerald green
        doc.text(`Supplier: ${reportName}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
    }

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Summary section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Cost Summary', margin, yPos);
    yPos += 8;

    // Summary details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
        ['Total CIF Cost:', `$${results.totalCIF.toFixed(2)} (QAR ${results.totalCIFQAR.toFixed(2)})`],
        ['Customs Duties:', `$${results.customsDuties.toFixed(2)} (QAR ${results.customsDutiesQAR.toFixed(2)})`],
        ['Local Delivery:', `$${results.localDelivery.toFixed(2)} (QAR ${results.localDeliveryQAR.toFixed(2)})`],
        ['Total DDP Cost:', `$${results.ddpTotal.toFixed(2)} (QAR ${results.ddpTotalQAR.toFixed(2)})`]
    ];

    summaryData.forEach(([label, value]) => {
        doc.text(label, margin + 5, yPos);
        doc.text(value, margin + 70, yPos);
        yPos += 6;
    });
    yPos += 10;

    // Item breakdown table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Item Breakdown', margin, yPos);
    yPos += 8;

    const itemBreakdowns = items.map((item, idx) => results.itemBreakdowns[idx]);

    // Table data with ID column
    const itemsTableData = itemBreakdowns.map((item, index) => {
        const row = [
            (index + 1).toString(), // ID column
            item.description || `Item ${index + 1}`,
            item.country || 'N/A',
            item.supplier || 'N/A',
            item.hsCode || 'N/A',
            item.quantity.toString(),
            `$${item.unitPrice.toFixed(2)}`,
            `$${item.cifTotal.toFixed(2)}`,
            `$${item.customsDuty.toFixed(2)}`,
            `$${item.ddpTotal.toFixed(2)}`,
            `$${item.ddpPerUnit.toFixed(2)}`
        ];
        return row;
    });

    // Add total row
    const totalRow = [
        { content: 'TOTAL', colSpan: 8, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `$${results.customsDuties.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `$${results.ddpTotal.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: '', styles: { fillColor: [240, 240, 240] } }
    ];
    itemsTableData.push(totalRow);

    autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Description', 'Country', 'Supplier', 'HS Code', 'Qty', 'Unit Price', 'CIF Total', 'Customs', 'DDP Total', 'DDP/Unit']],
        body: itemsTableData,
        theme: 'grid',
        headStyles: {
            fillColor: [33, 150, 243],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },   // ID
            1: { cellWidth: 32 },                      // Description (large)
            2: { cellWidth: 8, halign: 'center' },    // Country
            3: { cellWidth: 10 },                      // Supplier
            4: { cellWidth: 10, halign: 'center' },   // HS Code
            5: { cellWidth: 8, halign: 'center' },    // Qty
            6: { cellWidth: 12, halign: 'right' },    // Unit Price
            7: { cellWidth: 12, halign: 'right' },    // CIF Total
            8: { cellWidth: 10, halign: 'right' },    // Customs
            9: { cellWidth: 12, halign: 'right' },    // DDP Total
            10: { cellWidth: 12, halign: 'right' }    // DDP/Unit
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        didDrawPage: function(data) {
            // Check if this is the last page
            const isLastPage = doc.internal.pages.length - 1 === doc.internal.getCurrentPageInfo().pageNumber;

            if (isLastPage && footerImage) {
                try {
                    const footerMaxWidth = 100;
                    const footerMaxHeight = 30;
                    const footerX = pageWidth - margin - footerMaxWidth;
                    // Position above notes section if present, otherwise at bottom
                    const footerY = pageHeight - margin - footerMaxHeight - 35;
                    doc.addImage(footerImage, 'PNG', footerX, footerY, footerMaxWidth, footerMaxHeight);
                } catch (e) {
                    console.error('Error adding footer:', e);
                }
            }
        }
    });

    // Notes section (after table, on last page)
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesY = finalY + 5;
    const notes = [
        '• All prices shown in both USD and QAR (exchange rate: 1 USD = 3.65 QAR)',
        '• Customs duties calculated based on HS codes and CIF values',
        '• DDP (Delivered Duty Paid) includes all costs to deliver to Qatar',
        '• Local delivery cost distributed across all items proportionally'
    ];

    notes.forEach((note, idx) => {
        doc.text(note, margin, notesY + (idx * 5));
    });

    return doc;
};

export const downloadPDFReport = async (results, items, settings, filename = 'ddp-report.pdf', previewResults = null, reportName = '') => {
    const doc = await generatePDFReport(results, items, settings, previewResults, reportName);
    if (doc) {
        doc.save(filename);
    }
};
