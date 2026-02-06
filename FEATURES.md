# DDP Calculator Features Documentation

**Last Updated:** 2025-02-06
**Version:** 2.1

This document provides comprehensive documentation for the features available in the DDP Calculator module.

---

## Table of Contents

1. [Fixed Costs (One-Time)](#1-fixed-costs-one-time)
2. [Certifications](#2-certifications)
3. [History Panel](#3-history-panel)
4. [Smart Import (AI)](#4-smart-import-ai)
5. [Multi-Image Support](#5-multi-image-support)
6. [Multi-Line Descriptions](#6-multi-line-descriptions)
7. [Import/Export JSON](#7-importexport-json)

---

## 1. Fixed Costs (One-Time)

### Description
Fixed costs are one-time per-item costs that are **NOT multiplied by quantity**. Unlike the unit price which is multiplied by quantity, fixed costs are added once per item line regardless of how many units are ordered.

### Use Cases
- Tooling costs (cylinder costs, mold fees)
- Setup fees
- Sample costs
- One-time packaging design costs
- Special handling fees

### How to Use

**In DDP Calculator (calculations):**
```javascript
const item = {
    description: 'Product A',
    quantity: 100,
    unitPrice: 50,
    cbmPerUnit: 0.05,
    fixedCosts: [
        { name: 'Cylinder Cost', cost: 500 },
        { name: 'Mold Fee', cost: 200 }
    ]
};
```

**In Quotation Builder UI:**
1. Enable "Show Cert/Lab Test Costs" checkbox
2. In the Cert/Lab Costs column, scroll to "One-Time" section
3. Enter the one-time cost amount
4. Add a description (e.g., "Cylinder Cost")

### Data Structure

```typescript
// In calculation items
interface Item {
    fixedCosts?: Array<{
        name: string;    // Description of the cost
        cost: number;    // Amount in USD
    }>;
}

// In quotation items
interface QuotationItem {
    oneTimeCost?: number;              // Amount in USD
    oneTimeCostDescription?: string;   // Description shown on quotation
}
```

### Calculation Logic

```javascript
// In calculations.js - fixedCosts are summed without multiplication
let totalFixedCost = 0;
items.forEach(item => {
    if (item.fixedCosts && Array.isArray(item.fixedCosts)) {
        item.fixedCosts.forEach(cost => {
            totalFixedCost += parseNumberInput(cost.cost);
        });
    }
});

// Added directly to landed cost (not multiplied by quantity)
const landedCostBeforeMargin = totalExwCost + freightSubtotal +
    totalQatarChargesUsd + certificationCost + fixedCostTotal + insurance;
```

### Known Limitations
- Fixed costs are allocated to items by value ratio in item breakdowns
- The DDP per unit includes a pro-rated portion of fixed costs

---

## 2. Certifications

### Description
Certifications allow you to track and include certification and lab test costs in DDP calculations. There's a base certification cost ($150 by default) plus per-item certification costs.

### Certification Types Supported
| Type | Label |
|------|-------|
| SASO | SASO |
| COC | COC (Certificate of Conformity) |
| Lab Analysis | Lab Analysis |
| SABER | SABER |
| GCC | GCC Conformity |
| ESMA | ESMA |
| Other | Other |

### How to Use

**In DDP Calculator:**
```javascript
const item = {
    description: 'Industrial Pump',
    quantity: 10,
    unitPrice: 500,
    cbmPerUnit: 0.5,
    certifications: [
        { name: 'SASO', cost: 50 },
        { name: 'COC', cost: 30 },
        { name: 'Lab Test - Material', cost: 25 }
    ]
};
```

**In Quotation Builder:**
1. Enable "Show Cert/Lab Test Costs" checkbox
2. Select certification type from dropdown
3. Enter certification cost (USD)
4. Enter lab test cost (USD) if applicable

### Data Structure

```typescript
// DDP Calculator item
interface DDPItem {
    certifications?: Array<{
        name: string;   // Certification name (SASO, COC, Lab Test, etc.)
        cost: number;   // Cost in USD
    }>;
}

// Quotation item
interface QuotationItem {
    certificationCost: number;      // USD
    labTestCost: number;            // USD
    certificationType: string;      // Type for display (SASO, COC, etc.)
}
```

### Calculation Logic

```javascript
// Base certification cost from constants ($150 default)
const baseCertificationCost = rates.certificationCost; // $150

// Per-item certifications added on top
let totalCertificationCost = 0;
items.forEach(item => {
    if (item.certifications && Array.isArray(item.certifications)) {
        item.certifications.forEach(cert => {
            totalCertificationCost += parseNumberInput(cert.cost);
        });
    }
});

// Total = base + all per-item certs
const certificationCost = baseCertificationCost + totalCertificationCost;
```

### Cost Allocation
- Base certification cost is pro-rated across items by value ratio
- Per-item certifications are added directly to that specific item's breakdown
- Final allocation: `allocatedCertification = baseCert * valueRatio + itemCertCosts`

---

## 3. History Panel

### Description
The History Panel allows users to save, load, rename, and manage quotation history. Data is persisted in localStorage with automatic autosave functionality.

### Features
- Save current quotation with custom name
- Load previously saved quotations
- Rename saved quotations (click on name)
- Delete individual quotations
- Clear all history
- Search/filter saved quotations
- Autosave on every change (1 second debounce)

### How to Use
1. Click the "HISTORY" tab on the right side of the screen
2. Click "Save Current Quotation" to save
3. Enter a name or use auto-generated name
4. Click "Restore" to load a saved quotation
5. Click on a quotation name to rename it
6. Click trash icon to delete

### Data Structure

```typescript
interface HistoryEntry {
    id: string;           // Unique ID (quotation-{timestamp}-{random})
    name: string;         // Display name
    savedAt: string;      // ISO timestamp
    data: {
        items: Item[];
        settings: Settings;
        overrides: Overrides;
        customsPreview: CustomsPreview;
        reportName: string;
    };
    summary: {
        itemCount: number;
        totalCBM: number;
        ddpTotal: number;
        currency: string;   // 'USD'
    };
}
```

### Storage Details
| Key | Purpose | Limit |
|-----|---------|-------|
| `ddp-calculator-history` | Saved quotations | 50 entries max |
| `ddp-calculator-autosave` | Current working state | 1 entry |

### Hook API

```javascript
import { useQuotationHistory } from './hooks/useQuotationHistory';

const {
    history,          // Array of saved quotations
    isLoaded,         // Boolean - has localStorage been loaded
    saveQuotation,    // (data, customName?) => id
    loadQuotation,    // (id) => data | null
    deleteQuotation,  // (id) => void
    renameQuotation,  // (id, newName) => void
    clearHistory,     // () => void
    getAutosave,      // () => data | null
    setAutosave,      // (data) => void
    clearAutosave,    // () => void
} = useQuotationHistory();
```

---

## 4. Smart Import (AI)

### Description
Smart Import uses AI (Google Gemini or local LLM) to automatically extract product data from documents, images, or spreadsheets. It can parse quotations, invoices, or product lists and convert them to the DDP Calculator format.

### Supported Input Formats
- PDF files
- Images (PNG, JPG, JPEG, WebP)
- Excel files (.xlsx, .xls)
- Clipboard paste (images)

### AI Providers
| Provider | Configuration |
|----------|--------------|
| Google Gemini | Requires API key (AIza...) |
| Local LLM | OpenAI-compatible endpoint (e.g., Ollama) |

### How to Use
1. Click "Smart Import (AI)" button
2. Configure AI provider in Settings tab (first time only)
3. Upload file or paste image (Ctrl/Cmd+V)
4. Review parsed data in Preview tab
5. Click "Import Data" to apply

### Data Flow
```
Input (PDF/Image/Excel)
  -> AI Processing (Gemini/Local LLM)
  -> JSON Extraction
  -> Preview/Edit
  -> Import to Calculator
```

### Output Format

```typescript
interface SmartImportResult {
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        cbmPerUnit?: number;
        weightPerUnit?: number;
        unitType?: string;
    }>;
    settings?: {
        pricingMode?: string;
        containerType?: string;
    };
    reportName?: string;
}
```

### Configuration Storage
AI configuration is stored via the `AIService` singleton and persists across sessions.

---

## 5. Multi-Image Support

### Description
Each quotation item can have an image attached for visual reference. Images are resized and embedded directly in the quotation PDF/HTML output.

### Supported Methods
- File upload (click button)
- Drag and drop
- Clipboard paste (Ctrl/Cmd+V)

### How to Use
1. In Quotation Builder, ensure "Show Picture Column" is checked
2. Click "Upload Image" or drag/drop/paste into the cell
3. Image is automatically resized to max 300x300px
4. Click X button to remove image

### Technical Details
- Images are stored as base64 data URLs
- Maximum dimensions: 300x300 pixels
- JPEG compression at 85% quality
- Embedded directly in HTML/PDF output

### Data Structure

```typescript
interface QuotationItem {
    image: string | null;  // Base64 data URL or null
}
```

### Image Processing

```javascript
// Resize logic in QuotationItemRow.jsx
const maxSize = 300;
let width = img.width;
let height = img.height;

if (width > height) {
    if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
    }
} else {
    if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
    }
}

const resizedImage = canvas.toDataURL('image/jpeg', 0.85);
```

---

## 6. Multi-Line Descriptions

### Description
Product descriptions support multiple lines using textarea inputs. Line breaks are preserved in both the UI and PDF/HTML output.

### How to Use
- In DDP Calculator ItemRow: textarea expands vertically
- In Quotation Builder: textarea with resize: vertical
- Press Enter for new lines

### HTML Output
Line breaks in descriptions are rendered using `<br>` tags in HTML output.

### Data Storage
Descriptions are stored as plain strings with `\n` for line breaks.

---

## 7. Import/Export JSON

### Description
The Import/Export feature allows you to save and load complete quotation data as JSON files. This enables:
- Backup/restore of quotations
- Sharing quotations between users
- Template creation for recurring products

### Template Structure

```json
{
    "version": "1.0",
    "timestamp": "2025-02-06T00:00:00.000Z",
    "_documentation": {
        "description": "DDP Calculator Data Template",
        "usage": "Fill in the items array with your products",
        "pricingModes": {
            "EXW": "Ex Works - Buyer pays domestic China shipping",
            "FOB": "Free On Board - Domestic shipping included",
            "CIF": "Cost, Insurance & Freight - Includes sea freight and insurance"
        },
        "containerTypes": ["auto", "20GP", "40GP", "40HC", "LCL"]
    },
    "reportName": "ABC Trading Company",
    "items": [
        {
            "description": "Sample Product A",
            "quantity": 100,
            "unitType": "pcs",
            "unitPrice": 12.50,
            "cbmPerUnit": 0.15,
            "weightPerUnit": 5,
            "cbmInputMode": "perUnit",
            "weightInputMode": "perUnit",
            "certifications": [
                { "name": "CE Certification", "cost": 150 }
            ]
        }
    ],
    "settings": {
        "pricingMode": "EXW",
        "containerType": "auto",
        "profitMargin": 0.15,
        "profitMarginMode": "percentage",
        "commissionRate": 0.06,
        "commissionMode": "percentage"
    },
    "overrides": {
        "seaFreightOverride": null,
        "domesticChinaShippingOverride": null,
        "customsDutyRate": null
    },
    "customsPreview": {
        "enabled": false,
        "invoiceCostOverride": null,
        "shippingCostOverride": null
    }
}
```

### API Functions

```javascript
import {
    generateTemplate,      // () => JSON string
    downloadTemplate,      // (filename?) => void
    exportFormData,        // (items, settings, overrides, customsPreview, reportName) => JSON string
    downloadFormData,      // (items, settings, overrides, customsPreview, reportName, filename?) => void
    validateImportData,    // (data) => { valid: boolean, error?: string }
    importFormData,        // (jsonString) => data object
    importFormDataFromFile // (file) => Promise<data>
} from './utils/importExport';
```

### How to Use

**Export:**
1. Click "Export" button in header
2. JSON file downloads automatically
3. Filename: `DDP-Calculator-Data-{YYYY-MM-DD}.json`

**Import:**
1. Click "Import" button
2. Select JSON file
3. Data loads automatically

**Template:**
1. Click "Template" button
2. Download sample template with documentation
3. Edit template with your data
4. Import the modified file

### Backward Compatibility
- Both `unitPrice` and legacy `exwPrice` field names are supported
- Pricing mode is normalized to uppercase (EXW, FOB, CIF)
- Missing fields use default values

---

## File Reference

| Feature | Primary Files |
|---------|---------------|
| Fixed Costs | `utils/calculations.js` |
| Certifications | `utils/calculations.js`, `quotation/components/QuotationItemRow.jsx` |
| History Panel | `components/HistoryPanel.jsx`, `hooks/useQuotationHistory.js` |
| Smart Import | `components/SmartImportModal.jsx`, `services/ai/AIService.js`, `utils/smartParser.js` |
| Multi-Image | `quotation/components/QuotationItemRow.jsx` |
| Multi-Line Descriptions | `quotation/components/QuotationItemRow.jsx`, `quotation/utils/quotationHTML.js` |
| Import/Export | `utils/importExport.js` |

---

## Testing

Run the test suite to verify feature functionality:

```bash
cd modules/ddp-calculator
npm test -- --run
```

Key test files:
- `src/__tests__/certification-labtest.test.js` - Certification and lab test cost calculations
- `src/__tests__/calculations.test.js` - Core DDP calculations
- `src/__tests__/importExport.test.js` - Import/export functionality
- `src/__tests__/useQuotationHistory.test.js` - History panel hook
- `src/__tests__/HistoryPanel.test.jsx` - History panel component

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2025-02-06 | Added documentation for all features |
| 2.0 | 2025-02-05 | Added certifications, one-time costs, history panel |
| 1.0 | 2025-01-11 | Initial release with core DDP calculations |
