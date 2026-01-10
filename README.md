# DDP Cost Calculator 🚢

> Professional Delivered Duty Paid (DDP) cost calculator for China-Qatar shipping routes

A comprehensive web application for calculating accurate DDP costs with support for multiple items, automatic container optimization, and detailed cost breakdowns based on official CMA CGM tariffs and Qatar MOFA attestation fees.

[![Tests](https://img.shields.io/badge/tests-55%20passing-brightgreen)](src/__tests__)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)


> **📌 Important**: This project has two versions:
> - **`index.old.html`** - Full-featured standalone app ← **Use this for production**
> - **`npm run dev`** - Modular Vite/React demo (development/testing)
>
> See [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for complete details.

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-item support** - Add unlimited products to a single shipment
- **Smart container selection** - Automatically optimizes container type (20GP/40GP/40HC/LCL)
- **Complete cost breakdown** - Shows all cost components from EXW to final DDP
- **Per-item DDP pricing** - Calculates landed cost per unit for each item
- **Dual currency display** - Shows costs in both USD and QAR

### 🔧 Advanced Features
- **CBM input flexibility** - Toggle between per unit or total CBM entry
- **Flexible profit margin** - Choose percentage or fixed USD amount
- **Flexible commission** - Choose percentage or fixed USD amount
- **Rate overrides** - Override default rates with actual quotes
- **Domestic China shipping override** - Custom factory-to-port costs

### 📊 Accurate Fee Structure
- **CMA CGM port fees** - Container-specific fees (DO, THC, return, maintenance)
- **MOFA tiered attestation** - Official 5-tier Qatar MOFA fee structure
- **Qatar-specific rates** - Pre-configured clearance costs (Mwani, customs, etc.)
- **Real exchange rate** - 1 USD = 3.65 QAR

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for development)
- Python 3.6+ (for simple server, optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/m-awadi/ddp-calculator.git
cd ddp-calculator

# Install dependencies
npm install
```

### Running the Application

#### Option 1: Full-Featured Standalone Version (Production Ready)
```bash
# Open the standalone HTML file
open index.old.html
# or
python server.py  # serves index.old.html
```
**Note**: This version has ALL features and works without build tools.

#### Option 2: Vite/React Modular Demo (Development)
```bash
npm run dev
# Opens at http://localhost:8080 with hot reload
```
**Note**: This demonstrates the modular architecture with ES6 imports. See `INTEGRATION_STATUS.md` for details.

#### Option 3: Production Build
```bash
npm run build
npm run preview
```

---

## 📖 Usage Guide

### 1. Add Items

For each product in your shipment:

| Field | Description | Example |
|-------|-------------|---------|
| **Description** | Product name | "Wireless Mouse" |
| **Quantity** | Number of units | 500 |
| **EXW Price** | Supplier price per unit (USD) | $8.50 |
| **CBM** | Volume - toggle /Unit or Total | 0.015 m³ |
| **Weight/Unit** | Weight per unit in kg (optional) | 0.3 kg |

**💡 Tip:** Use the CBM toggle to switch between entering:
- **Per Unit**: CBM for each individual item
- **Total**: Total CBM for all items (auto-divides by quantity)

### 2. Adjust Settings

#### Container Type
- **Auto-select** (recommended) - Optimizes based on volume
- **20' Standard (33 CBM)** - Force 20GP container
- **40' Standard (67 CBM)** - Force 40GP container
- **40' High Cube (76 CBM)** - Force 40HC container

#### Profit Margin
Toggle between:
- **Percentage** - Applied to landed cost (e.g., 15%)
- **Fixed USD** - Flat amount added (e.g., $500)

#### Commission
Toggle between:
- **Percentage** - Applied after margin (e.g., 6%)
- **Fixed USD** - Flat amount added (e.g., $200)

### 3. Rate Overrides (Optional)

Expand "Rate Overrides" to enter actual quotes:
- **Sea Freight Total** - Your quoted freight amount
- **Domestic China Shipping** - Custom per CBM rate

### 4. Review Results

- **Summary Cards** - Total CIF, Customs Duties, Local Delivery, DDP Total
- **Cost Breakdown** - Line-by-line detailed costs
- **Per-Item DDP** - Each item's final cost and per-unit price
- **Container Info** - Selected containers and utilization

---

## 💰 Cost Components

### China Side
- **EXW (Ex-Works)** - Supplier product cost
- **Domestic China Shipping** - Factory to port ($15/CBM default)

### Freight
- **Sea Freight** - Container or LCL charges
- **Insurance** - 0.5% of CIF value

### Qatar Clearance (QAR)

Based on official CMA CGM tariff structure:

| Fee Component | 20GP | 40GP | 40HC |
|--------------|------|------|------|
| **Delivery Order** | 650 | 1,000 | 1,100 |
| **Terminal Handling (THC)** | 650 | 1,000 | 1,100 |
| **Container Return** | 150 | 300 | 380 |
| **Container Maintenance** | 20.02 | 40.04 | 40.04 |

**Fixed Fees:**
- Customs Duty: 5% of CIF value
- Mwani Charges: QAR 160
- Terminal Inspection: QAR 35
- Inspection Charge: QAR 50
- Clearance Agent: QAR 250
- Local Transport: QAR 800

**MOFA Attestation (Tiered):**

| Invoice Value (QAR) | Fee |
|---------------------|-----|
| 1 - 15,000 | QAR 650 |
| 15,001 - 100,000 | QAR 1,150 |
| 100,001 - 250,000 | QAR 2,650 |
| 250,001 - 1,000,000 | QAR 5,150 |
| Above 1,000,000 | 0.6% + QAR 150 |

### Margins
- **Profit Margin** - Your markup (default 15%)
- **Commission** - Sales agent fee (default 6%)

---

## 🧪 Testing

Comprehensive test suite with 55 tests covering all calculations:

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ MOFA tiered fee calculations (all 5 tiers)
- ✅ Container selection logic (LCL, 20GP, 40GP, 40HC)
- ✅ Sea freight calculations
- ✅ Qatar fee structure (DO, THC, container fees)
- ✅ Percentage vs fixed USD modes
- ✅ Override functionality
- ✅ Multi-item allocation
- ✅ Currency formatting (USD, QAR)

---

## 🏗️ Project Structure

```
ddp-calculator/
├── src/
│   ├── utils/
│   │   ├── constants.js       # Configuration constants
│   │   ├── calculations.js    # Pure calculation functions
│   │   └── formatters.js      # Formatting utilities
│   ├── components/
│   │   └── ResultsPanel.jsx   # Results display component
│   ├── quotation/             # Quotation system (optional)
│   └── __tests__/
│       ├── calculations.test.js  # 43 tests
│       └── formatters.test.js    # 12 tests
├── index.html                 # Main application
├── server.py                  # Python dev server
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
├── vitest.config.js         # Test configuration
└── README.md                # This file
```

---

## 🔧 Default Rates

### Sea Freight (USD)
| Container | Rate |
|-----------|------|
| 20' GP | $1,800 |
| 40' GP | $3,200 |
| 40' HC | $3,400 |
| LCL | ~$100/CBM |

### Exchange Rate
**1 USD = 3.65 QAR**

---

## 🎨 Customization

### Modifying Default Rates

Edit `src/utils/constants.js`:

```javascript
export const DEFAULT_RATES = {
    seaFreight: {
        '20GP': 1800,  // Change these values
        '40GP': 3200,
        '40HC': 3400,
    },
    qatarClearance: {
        customsDutyRate: 0.05,  // 5%
        deliveryOrder: {
            '20GP': 650,
            '40GP': 1000,
            '40HC': 1100,
        },
        // ... other fees
    },
    usdToQar: 3.65,  // Exchange rate
};
```

### Building for Production

```bash
# Create optimized build
npm run build

# Output will be in dist/
```

---

## 🌐 Browser Support

Works in all modern browsers:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

---

## 📝 API Documentation

### Core Functions

#### `calculateDDP(items, settings, overrides)`
Main calculation engine that computes complete DDP costs.

**Parameters:**
- `items` - Array of item objects with quantity, price, CBM, etc.
- `settings` - Settings object (containerType, profitMargin, modes)
- `overrides` - Optional rate overrides

**Returns:** Object with summary, costs, and itemBreakdowns

#### `calculateMofaFee(invoiceValueQar)`
Calculates MOFA attestation fee based on tiered structure.

**Parameters:**
- `invoiceValueQar` - Invoice value in QAR

**Returns:** Total MOFA fee (attestation + certificate of origin)

#### `selectContainers(totalCbm)`
Optimizes container selection for given volume.

**Parameters:**
- `totalCbm` - Total cubic meters

**Returns:** Array of container types (e.g., ['40HC', '20GP'])

See [src/utils/calculations.js](src/utils/calculations.js) for complete API.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 🐛 Known Issues

- PDF exports require additional dependencies (jsPDF, jsPDF-autotable)
- Quotation system requires asset files in `/public/` directory

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Qatar customs clearance data based on CMA CGM official tariffs
- MOFA attestation fees from official Qatar Ministry of Foreign Affairs
- Container specifications from standard shipping industry guidelines

---

## 📞 Support

For questions or issues:
- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/m-awadi/ddp-calculator/issues)

---

## 📊 Stats

- **Lines of Code**: 5,600+
- **Test Coverage**: 55 tests, 100% passing
- **Dependencies**: Minimal (React, Vite, Vitest)
- **Bundle Size**: ~150KB (minified)

---

**Built with ❤️ for Arabian Trade Route**

*Version 2.0 - Enhanced with modular architecture and comprehensive testing*
