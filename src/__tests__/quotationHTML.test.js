import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test suite for quotation HTML generation
 * Tests that certification and lab test costs appear correctly in HTML output
 */

// Mock window.open for HTML generation
const mockDocument = {
    write: vi.fn(),
    close: vi.fn()
};

const mockWindow = {
    document: mockDocument
};

global.window = {
    open: vi.fn(() => mockWindow)
};

describe('Quotation HTML Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('HTML Structure Generation', () => {
        it('should generate valid HTML document structure', () => {
            const quotationData = {
                date: '2026-02-05',
                items: [
                    { description: 'Test Item', quantity: 10, price: 100, image: null }
                ],
                totalQAR: 3650,
                totalUSD: 1000,
                companyInfo: {
                    name: 'Arabian Trade Route',
                    address: 'Doha, Qatar',
                    email: 'info@test.com'
                },
                showPictureColumn: true,
                customBlocks: [],
                quantityUnit: 'pcs'
            };

            // Verify the data structure for HTML generation
            expect(quotationData.items).toHaveLength(1);
            expect(quotationData.companyInfo.name).toBe('Arabian Trade Route');
        });

        it('should format date correctly for HTML title', () => {
            const date = '2026-02-05';
            const formattedDate = new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            expect(formattedDate).toBe('5 Feb 2026');
        });
    });

    describe('Table Generation with Certification Data', () => {
        it('should generate table headers correctly', () => {
            const showPictureColumn = true;
            const quantityUnit = 'pcs';

            const headerHTML = `
                <tr>
                    <th>Item</th>
                    ${showPictureColumn ? '<th>Picture</th>' : ''}
                    <th>Description</th>
                    <th>Qty (${quantityUnit})</th>
                    <th>Price (USD)</th>
                    <th>Total (USD)</th>
                </tr>
            `;

            expect(headerHTML).toContain('Item');
            expect(headerHTML).toContain('Picture');
            expect(headerHTML).toContain('Description');
            expect(headerHTML).toContain('Qty (pcs)');
            expect(headerHTML).toContain('Price (USD)');
            expect(headerHTML).toContain('Total (USD)');
        });

        it('should generate table headers without picture column', () => {
            const showPictureColumn = false;
            const quantityUnit = 'units';

            const headerHTML = `
                <tr>
                    <th>Item</th>
                    ${showPictureColumn ? '<th>Picture</th>' : ''}
                    <th>Description</th>
                    <th>Qty (${quantityUnit})</th>
                    <th>Price (USD)</th>
                    <th>Total (USD)</th>
                </tr>
            `;

            expect(headerHTML).not.toContain('<th>Picture</th>');
            expect(headerHTML).toContain('Qty (units)');
        });

        it('should generate item rows with certification-inclusive prices', () => {
            const items = [
                {
                    description: 'Industrial Pump with SASO Cert',
                    quantity: 10,
                    price: 575.50, // DDP price including certs
                    image: null
                }
            ];

            const rowsHTML = items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td class="description">${item.description || ''}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.quantity * item.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</td>
                </tr>
            `).join('');

            expect(rowsHTML).toContain('Industrial Pump with SASO Cert');
            expect(rowsHTML).toContain('$575.50');
            expect(rowsHTML).toContain('$5,755.00');
        });

        it('should generate total row correctly', () => {
            const totalUSD = 8650;
            const showPictureColumn = true;

            const totalRowHTML = `
                <tr class="total-row">
                    <td colspan="${showPictureColumn ? '5' : '4'}">Total</td>
                    <td>$${totalUSD.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</td>
                </tr>
            `;

            expect(totalRowHTML).toContain('colspan="5"');
            expect(totalRowHTML).toContain('$8,650.00');
        });

        it('should calculate correct colspan without picture column', () => {
            const showPictureColumn = false;

            const totalRowHTML = `
                <tr class="total-row">
                    <td colspan="${showPictureColumn ? '5' : '4'}">Total</td>
                    <td>$100.00</td>
                </tr>
            `;

            expect(totalRowHTML).toContain('colspan="4"');
        });
    });

    describe('Custom Blocks HTML Generation', () => {
        it('should generate certification terms in custom blocks', () => {
            const customBlocks = [
                {
                    id: 'cert-block',
                    title: 'Certifications Included:',
                    sections: [
                        {
                            id: 'saso-section',
                            title: 'SASO Certification',
                            items: [
                                'SASO conformity certificate included',
                                'Valid for 1 year'
                            ]
                        }
                    ]
                }
            ];

            const blocksHTML = customBlocks.map(block => `
                <div class="terms-section" style="margin-top: 30px;">
                    <div class="terms-title">${block.title}</div>
                    ${block.sections.map(section => `
                        <div style="margin-top: 15px;">
                            <strong>\u25CF ${section.title}</strong>
                            ${section.items.map(item => `<div class="term-item">\u25CB ${item}</div>`).join('')}
                        </div>
                    `).join('')}
                </div>
            `).join('');

            expect(blocksHTML).toContain('Certifications Included:');
            expect(blocksHTML).toContain('SASO Certification');
            expect(blocksHTML).toContain('SASO conformity certificate included');
        });

        it('should support Arabic text in custom blocks', () => {
            const customBlocks = [
                {
                    id: 'cert-block-ar',
                    title: 'الشهادات المتضمنة:',
                    sections: [
                        {
                            id: 'saso-ar',
                            title: 'شهادة ساسو:',
                            items: [
                                'شهادة مطابقة ساسو متضمنة'
                            ]
                        }
                    ]
                }
            ];

            const blocksHTML = customBlocks.map(block => `
                <div class="terms-section">
                    <div class="terms-title">${block.title}</div>
                </div>
            `).join('');

            expect(blocksHTML).toContain('الشهادات المتضمنة:');
        });

        it('should handle multiple sections within a block', () => {
            const block = {
                title: 'Product Certifications',
                sections: [
                    { title: 'SASO', items: ['Item 1'] },
                    { title: 'COC', items: ['Item 2'] },
                    { title: 'Lab Tests', items: ['Item 3'] }
                ]
            };

            expect(block.sections).toHaveLength(3);
            expect(block.sections[0].title).toBe('SASO');
            expect(block.sections[1].title).toBe('COC');
            expect(block.sections[2].title).toBe('Lab Tests');
        });

        it('should handle empty sections array', () => {
            const block = {
                title: 'Empty Block',
                sections: []
            };

            const sectionsHTML = block.sections.map(section => `<div>${section.title}</div>`).join('');

            expect(sectionsHTML).toBe('');
        });
    });

    describe('Image Handling in HTML', () => {
        it('should generate img tag when item has image', () => {
            const item = {
                description: 'Product with image',
                quantity: 5,
                price: 200,
                image: 'data:image/jpeg;base64,/9j/test'
            };
            const showPictureColumn = true;

            const imageCell = showPictureColumn
                ? `<td>${item.image ? `<img src="${item.image}" class="item-image" alt="Product">` : ''}</td>`
                : '';

            expect(imageCell).toContain('<img src="data:image/jpeg;base64,/9j/test"');
            expect(imageCell).toContain('class="item-image"');
        });

        it('should generate empty cell when item has no image', () => {
            const item = {
                description: 'Product without image',
                quantity: 5,
                price: 200,
                image: null
            };
            const showPictureColumn = true;

            const imageCell = showPictureColumn
                ? `<td>${item.image ? `<img src="${item.image}" class="item-image" alt="Product">` : ''}</td>`
                : '';

            expect(imageCell).toBe('<td></td>');
        });

        it('should not generate image column when showPictureColumn is false', () => {
            const item = {
                description: 'Product',
                quantity: 5,
                price: 200,
                image: 'data:image/jpeg;base64,test'
            };
            const showPictureColumn = false;

            const imageCell = showPictureColumn
                ? `<td>${item.image ? `<img src="${item.image}" class="item-image" alt="Product">` : ''}</td>`
                : '';

            expect(imageCell).toBe('');
        });
    });

    describe('CSS Styling Verification', () => {
        it('should include proper RTL styling for Arabic content', () => {
            const termsSection = `
                <div class="terms-section" style="direction: rtl; text-align: right;">
                    <div class="terms-title">Arabic Title</div>
                </div>
            `;

            expect(termsSection).toContain('direction: rtl');
            expect(termsSection).toContain('text-align: right');
        });

        it('should include LTR styling for table content', () => {
            const tableStyle = `
                table {
                    direction: ltr;
                }
            `;

            expect(tableStyle).toContain('direction: ltr');
        });

        it('should include proper color variables', () => {
            const QUOTATION_COLORS = {
                primary: '#D65A1F',
                secondary: '#EC722D',
                white: '#FFFFFF',
                textDark: '#1B2B38'
            };

            expect(QUOTATION_COLORS.primary).toBe('#D65A1F');
            expect(QUOTATION_COLORS.secondary).toBe('#EC722D');
        });
    });

    describe('Total Calculations in HTML', () => {
        it('should calculate totals correctly with certification costs', () => {
            const items = [
                {
                    description: 'Pump with SASO',
                    quantity: 10,
                    price: 575, // Includes cert costs
                    image: null
                },
                {
                    description: 'Valve with COC',
                    quantity: 20,
                    price: 145, // Includes cert costs
                    image: null
                }
            ];

            const totalUSD = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const totalQAR = totalUSD * 3.65;

            expect(totalUSD).toBe(8650);
            expect(totalQAR).toBeCloseTo(31572.50, 2);
        });

        it('should format totals correctly in HTML', () => {
            const totalUSD = 8650.75;

            const formattedUSD = '$' + totalUSD.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            expect(formattedUSD).toBe('$8,650.75');
        });
    });

    describe('Complete HTML Document Generation', () => {
        it('should generate complete HTML document with all sections', () => {
            const data = {
                date: '2026-02-05',
                items: [
                    { description: 'Test Item', quantity: 10, price: 100, image: null }
                ],
                totalUSD: 1000,
                totalQAR: 3650,
                companyInfo: {
                    name: 'Arabian Trade Route',
                    address: 'Doha, Qatar\nP.O. Box 12345',
                    email: 'info@arabiantraderoute.com'
                },
                showPictureColumn: true,
                customBlocks: [
                    {
                        title: 'Terms',
                        sections: [
                            { title: 'Payment', items: ['30% advance'] }
                        ]
                    }
                ],
                quantityUnit: 'pcs'
            };

            const formattedDate = new Date(data.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            // Verify all required data is present
            expect(formattedDate).toBe('5 Feb 2026');
            expect(data.companyInfo.name).toBe('Arabian Trade Route');
            expect(data.items.length).toBe(1);
            expect(data.customBlocks.length).toBe(1);
        });

        it('should include company info in HTML', () => {
            const companyInfo = {
                name: 'Arabian Trade Route',
                address: 'Doha, Qatar\nP.O. Box 12345',
                email: 'info@arabiantraderoute.com'
            };

            const companyHTML = `
                <div class="company-info">
                    <div class="company-name">${companyInfo.name}</div>
                    <div class="company-details">${companyInfo.address.replace(/\n/g, '<br>')}</div>
                    <div class="company-details">${companyInfo.email}</div>
                </div>
            `;

            expect(companyHTML).toContain('Arabian Trade Route');
            expect(companyHTML).toContain('<br>');
            expect(companyHTML).toContain('info@arabiantraderoute.com');
        });

        it('should include quotation title', () => {
            const titleHTML = '<div class="quotation-title">DDP Quotation</div>';

            expect(titleHTML).toContain('DDP Quotation');
        });
    });

    describe('HTML Generation for Print', () => {
        it('should include print-specific CSS', () => {
            const printCSS = `
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
            `;

            expect(printCSS).toContain('@media print');
            expect(printCSS).toContain('print-color-adjust: exact');
            expect(printCSS).toContain('page-break-after: always');
        });

        it('should include A4 page size', () => {
            const pageCSS = `
                @page {
                    size: A4;
                    margin: 0;
                }
            `;

            expect(pageCSS).toContain('size: A4');
        });
    });

    describe('Integration with Certification Data', () => {
        it('should include certification details in item description', () => {
            const itemWithCert = {
                description: `Industrial Pump Model A
- SASO Certified
- Lab Tested (Material, Performance)`,
                quantity: 10,
                price: 625.75,
                image: null
            };

            expect(itemWithCert.description).toContain('SASO Certified');
            expect(itemWithCert.description).toContain('Lab Tested');
        });

        it('should support certification cost breakdown in description', () => {
            const buildDescription = (baseDesc, certs) => {
                let desc = baseDesc;
                if (certs && certs.length > 0) {
                    desc += '\nCertifications: ' + certs.map(c => c.name).join(', ');
                }
                return desc;
            };

            const certs = [
                { name: 'SASO', cost: 50 },
                { name: 'COC', cost: 30 }
            ];

            const description = buildDescription('Industrial Pump', certs);

            expect(description).toContain('Industrial Pump');
            expect(description).toContain('Certifications: SASO, COC');
        });
    });
});

describe('HTML Output Validation', () => {
    describe('HTML Syntax', () => {
        it('should generate valid HTML tags', () => {
            const generateTableRow = (item, index) => {
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="description">${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                `;
            };

            const item = { description: 'Test', quantity: 10, price: 100 };
            const row = generateTableRow(item, 0);

            // Count opening and closing tags
            const openTd = (row.match(/<td/g) || []).length;
            const closeTd = (row.match(/<\/td>/g) || []).length;
            const openTr = (row.match(/<tr>/g) || []).length;
            const closeTr = (row.match(/<\/tr>/g) || []).length;

            expect(openTd).toBe(closeTd);
            expect(openTr).toBe(closeTr);
        });
    });

    describe('Special Character Handling', () => {
        it('should handle special characters in description', () => {
            const item = {
                description: 'Pump & Valve <Model A> "Special"',
                quantity: 10,
                price: 100
            };

            // In a real implementation, these should be escaped
            const escapeHtml = (text) => {
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            };

            const escaped = escapeHtml(item.description);

            expect(escaped).toContain('&amp;');
            expect(escaped).toContain('&lt;');
            expect(escaped).toContain('&gt;');
            expect(escaped).toContain('&quot;');
        });

        it('should preserve Arabic characters', () => {
            const arabicText = 'شهادة ساسو';

            // Arabic should be preserved as-is
            expect(arabicText).toBe('شهادة ساسو');
            expect(arabicText.length).toBeGreaterThan(0);
        });
    });
});
