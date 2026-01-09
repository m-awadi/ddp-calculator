# DDP Cost Calculator for Arabian Trade Route

A micro web application to calculate Delivered Duty Paid (DDP) costs for shipments from China to Qatar.

## Features

- **Multi-item support**: Add multiple products to a single shipment
- **Automatic container selection**: Optimizes container type based on total volume
- **Complete cost breakdown**: Shows all cost components from EXW to final DDP
- **Per-item DDP pricing**: Calculates the landed cost per unit for each item
- **Container utilization**: Visual indicator of how efficiently containers are used
- **Rate overrides**: Override default rates when you have actual quotes
- **Qatar-specific**: Pre-configured with Qatar clearance costs (Mwani, customs duty, etc.)

## Cost Components Calculated

### China Side
- EXW (Ex-Works) product cost
- Domestic China shipping (per CBM)

### Freight
- Sea freight (based on container type or LCL)
- Insurance (0.5% of CIF)

### Qatar Clearance (from your reference documents)
- Customs Duty: 5% of CIF value
- Mwani Charges: QAR 160
- Delivery Order Fees: QAR 2,150
- Terminal Handling: QAR 550-900 (by container type)
- Clearance Agent Fees: QAR 250
- Local Transportation: QAR 800
- Document Attestation: QAR 100

### Margins
- Profit margin (default 15%, adjustable)
- Sales commission (default 6%, adjustable)

## Quick Start

### Option 1: Python Server (Recommended)

```bash
# Navigate to the folder
cd ddp-calculator

# Run the server
python server.py

# Opens automatically at http://localhost:8080
```

### Option 2: Node.js Server

```bash
# If you have Node.js installed
npx serve .

# Then open http://localhost:3000
```

### Option 3: Direct File Open

Simply double-click `index.html` to open in your browser. 
Note: Some browsers may restrict local file JavaScript execution.

## Usage Guide

### 1. Add Items

For each product in your shipment:
- **Description**: Product name (for your reference)
- **Quantity**: Number of units
- **EXW Price**: Supplier price per unit in USD
- **CBM/Unit**: Volume per unit in cubic meters
- **Weight/Unit**: Weight per unit in kg (optional)

### 2. Adjust Settings

- **Container Type**: Auto-select (recommended) or force a specific size
- **Profit Margin**: Your markup percentage (default 15%)
- **Commission Rate**: Sales agent commission (4-10% typical)

### 3. Override Rates (Optional)

If you have actual freight quotes, expand "Rate Overrides" and enter:
- **Sea Freight Total**: Your quoted amount replaces the estimate

### 4. Read Results

- **Summary Cards**: Quick view of totals
- **Cost Breakdown**: Detailed line-by-line costs
- **Per-Item DDP**: Each item's final delivered cost and per-unit price
- **Container Utilization**: Visual fill percentage

## Default Sea Freight Rates

These are average China-Qatar rates used when no override is provided:

| Container | Rate (USD) |
|-----------|------------|
| 20' GP    | $1,800     |
| 40' GP    | $3,200     |
| 40' HC    | $3,400     |
| LCL       | ~$100/CBM  |

## Exchange Rate

Default: 1 USD = 3.64 QAR

## Customization

To modify default rates, edit the `DEFAULT_RATES` object in `index.html`:

```javascript
const DEFAULT_RATES = {
    seaFreight: {
        '20GP': 1800,  // Change these values
        '40GP': 3200,
        '40HC': 3400,
    },
    qatarClearance: {
        customsDutyRate: 0.05,  // 5%
        mwaniCharges: 160,
        // ... etc
    },
    // ... other rates
};
```

## Files

```
ddp-calculator/
├── index.html    # Main application (single-file React app)
├── server.py     # Python development server
└── README.md     # This file
```

## Browser Support

Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Notes

- All calculations use USD as the base currency
- Qatar charges are calculated in QAR then converted to USD for totals
- Container selection prefers larger containers for efficiency
- LCL (Less than Container Load) is used for shipments under 15 CBM

---

**Arabian Trade Route** | DDP Calculator v1.0
