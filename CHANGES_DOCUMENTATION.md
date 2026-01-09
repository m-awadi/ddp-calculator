# DDP Calculator - Complete Changes Documentation

## Overview
This document contains all changes made to the DDP Calculator and Quotation system during our conversation sessions.

## Session Summary - Changes from Previous Sessions

### 1. Quotation System - Picture Enhancements
- **Increased picture size to 300x300px** with aspect ratio maintenance
- **Made picture column optional** with toggle checkbox
- **Positioned footer at bottom-right** with aspect ratio maintained

### 2. Quotation System - Layout & Fonts
- **Fixed table direction issues** in PDF print (RTL/LTR handling)
- **Implemented local Roboto fonts** from `/public/Roboto/static/`
  - Roboto-Regular.ttf (400 weight)
  - Roboto-Medium.ttf (500 weight)
  - Roboto-Bold.ttf (700 weight)
- **Force Roboto font everywhere** including Arabic text (with fallback)
- **Removed white margin border**, use page padding instead
- **Side margins reduced** from 15mm to 10mm (top/bottom remain 15mm)

### 3. Quotation System - Custom Blocks
- **Added flexible custom blocks system** for quotation terms
- Blocks can be added after the main items table
- Each block has:
  - Block title
  - Multiple sections with section titles
  - Multiple items per section
  - Full CRUD operations (add, edit, delete)

### 4. Quotation System - Text Formatting
- **Made description text bold** in quotation tables
- Applied to both HTML and PDF generators

### 5. DDP Report - Supplier Name
- **Display supplier name (reportName)** in DDP report header
- Shown in emerald green color
- Passed from import data through to PDF generation

### 6. DDP Report - Table Improvements
- **Added ID column** as first column showing item numbers (1, 2, 3...)
- **Rebalanced all column widths**:
  - ID: 8mm (centered)
  - Description: 32mm (large, maintained)
  - Other columns: 8-16mm appropriately sized
- **Updated total row colspan** from 7 to 8 to account for ID column

### 7. DDP Report - Footer
- **Added footer image to last page** of DDP report
- Positioned bottom-right above notes section
- Made report generation async to load footer.png

## Current Session - Currency Conversion to USD

### 8. Quotation System - USD Conversion
**Changes applied to all quotation files:**

#### quotationPDF.js
- Changed title from Arabic "عرض سعر" to **"DDP Quotation"**
- Changed all prices from QAR to **USD** with $ symbol
- Updated column headers:
  - "Price (USD)"
  - "Total (USD)"
- Simplified total row to show only USD total
- Updated table data formatting to display `$` prefix

#### quotationHTML.js
- Changed title to **"DDP Quotation"**
- Changed all prices from QAR to **USD**
- Updated column headers to **(USD)**
- Simplified total row (removed QAR row)
- Updated all price displays to use $ symbol
- Maintained side margins at 10mm

#### QuotationApp.jsx
- Updated table headers to **"Price (USD)"** and **"Total (USD)"**
- Changed **total calculation**:
  - OLD: `totalQAR = sum of prices; totalUSD = totalQAR / 3.65`
  - NEW: `totalUSD = sum of prices; totalQAR = totalUSD * 3.65` (for compatibility)
- Removed QAR total row from display
- Changed total label from Arabic "الإجمالي" to "Total"
- Total row now shows only USD with $ prefix

#### QuotationItemRow.jsx
- Updated item total display from "QAR" to **"$"**
- Changed line 227: `QAR {amount}` → `${amount}`

## File Structure

```
/Users/mohamed/Downloads/ddp-calculator/
├── src/
│   ├── components/
│   │   └── ResultsPanel.jsx              # DDP results with download button
│   ├── quotation/
│   │   ├── QuotationApp.jsx              # Main quotation builder UI
│   │   ├── components/
│   │   │   └── QuotationItemRow.jsx      # Individual item row
│   │   └── utils/
│   │       ├── quotationPDF.js           # Direct PDF generation with jsPDF
│   │       ├── quotationHTML.js          # HTML for browser print-to-PDF
│   │       ├── defaultTerms.js           # Default terms and colors
│   │       └── arabicText.js             # Arabic text handling utility
│   └── utils/
│       └── reportGenerator.js            # DDP report PDF generation
└── public/
    ├── logo-standalone-web.png           # Company logo
    ├── page_footer.png                    # Page footer image
    ├── footer.png                         # DDP report footer
    └── Roboto/
        └── static/
            ├── Roboto-Regular.ttf
            ├── Roboto-Medium.ttf
            └── Roboto-Bold.ttf
```

## Key Technical Details

### Colors (QUOTATION_COLORS)
```javascript
{
  primary: '#2E7D32',      // Green
  secondary: '#1565C0',    // Blue
  background: '#FAFAFA',   // Light gray
  white: '#FFFFFF',
  textDark: '#212121',
  textMuted: '#757575'
}
```

### Exchange Rate
- **USD to QAR**: 3.65 (maintained for backward compatibility)
- **Primary currency**: USD (user-facing)

### Async Operations
- **generatePDFReport**: async function to load footer image
- **downloadPDFReport**: async function, must be awaited
- **generateQuotationPDF**: async function to load logo and footer images
- **ResultsPanel handleDownloadReport**: async function

### Column Widths (DDP Report)
| Column | Width | Alignment |
|--------|-------|-----------|
| ID | 8mm | center |
| Description | 32mm | left |
| Country | 8mm | center |
| Supplier | 10mm | left |
| HS Code | 10mm | center |
| Qty | 8mm | center |
| Unit Price | 12mm | right |
| CIF Total | 12mm | right |
| Customs | 10mm | right |
| DDP Total | 12mm | right |
| DDP/Unit | 12mm | right |

### Image Sizes
- **Quotation pictures**: 300x300px max (aspect ratio maintained)
- **Logo**: 30x30 (PDF), 80x80 (HTML)
- **Footer**: 100x30 max (aspect ratio maintained)

## Implementation Notes

1. **All quotation prices are in USD** - the user enters USD prices directly
2. **Total calculation is direct sum** - no conversion from QAR
3. **QAR calculation is for compatibility** - stored but not displayed in quotation
4. **DDP report still shows QAR** - this is separate from quotation
5. **Font loading is async** - HTML uses font preloading and waits before print
6. **Images are base64 encoded** - for PDF embedding
7. **Arabic text uses Roboto** - with proper RTL/LTR handling

## Commit Strategy
- Initial commit: Bootstrap version
- Commit after creating file structure
- Commit after each major component (quotation files, report files, utilities)
- Commit after testing features
- Push to remote regularly

## Testing Checklist
- [ ] Quotation displays USD correctly
- [ ] Quotation PDF generates with correct title and currency
- [ ] Quotation HTML prints with correct fonts and margins
- [ ] DDP report shows ID column
- [ ] DDP report displays supplier name
- [ ] DDP report shows footer on last page
- [ ] Total calculations are correct
- [ ] Images load and display at 300x300px
- [ ] Custom blocks work correctly
- [ ] All fonts load properly
