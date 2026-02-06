import { aiService } from '../services/ai/AIService';
import { generateTemplate, validateImportData } from './importExport';

/**
 * System instruction prompt for the AI
 */
const SYSTEM_PROMPT = `
You remain a helpful assistant for logistics data extraction.
Your task is to analyze the provided shipping document (Quotation, Invoice, Packing List) and extract data into a specific JSON format.

DATE EXTRACTION RULES:
- Extract item descriptions, quantities, unit prices, weights, and dimensions.
- **CRITICAL**: Look for TOTAL GROSS WEIGHT and TOTAL MEASUREMENT (CBM) in the document footer or summary.
- If individual CBM/Weight is not listed, use the Total CBM/Weight and divide by the total quantity to estimate per-unit values.
- **MERGED ROWS**: Be alert for tables with merged cells where a value (like Description) visually applies to multiple rows. If a cell spans multiple rows, apply its value to ALL covered items. Do NOT skip items just because a field looks empty in a specific row.
- **ITEM CONTINUITY**: Trust the item numbering (e.g., 1, 2, 3...). If a row index exists, it is a valid item, even if it shares data with the row above.
- Detect the currency. If NOT USD, convert it to USD using the provided exchange rate or your best knowledge of current rates if not provided (assume 1 USD = 3.65 QAR, 1 USD = 7.2 CNY for example, but prefer converting everything to USD).
- Detect Incoterms (EXW, FOB, or CIF). If not explicit, infer from context (e.g. "Ex-works", "FOB Shenzhen", "CIF Doha"). Default to EXW if unsure.

**MULTI-LINE DESCRIPTIONS**:
- **CRITICAL**: Preserve line breaks in item descriptions! If a description spans multiple lines or contains specifications on separate lines, include newline characters (\\n) in the description string.
- Example: "Product Name\\nModel: ABC-123\\nColor: Red" - this preserves the multi-line format.
- Do NOT flatten multi-line descriptions into a single line.

OUTPUT FORMAT:
You must output PURE JSON matching this schema exactly:
{
  "items": [
    {
      "description": "Item description\\nWith multiple lines\\nPreserved",
      "quantity": 100,
      "unitType": "pcs",
      "unitPrice": 10.50, // IN USD
      "cbmPerUnit": 0.05, // Cubic meters per unit (derived from dimensions or total CBM)
      "weightPerUnit": 2.5, // Kilograms per unit (derived from total weight)
      "cbmInputMode": "perUnit",
      "weightInputMode": "perUnit"
    }
  ],
  "settings": {
    "pricingMode": "EXW" // or "FOB" or "CIF"
  },
  "originalCurrency": "CNY", // The detected currency
  "exchangeRateUsed": 0.138 // Rate used to convert to USD
}

IMPORTANT:
- If CBM is total, divide by quantity to get perUnit.
- If dimensions are in cm, convert to meters for calculation (L*W*H).
- If weight is total, divide by quantity.
- Return ONLY the JSON object. No markdown formatting.
- PRESERVE newlines in descriptions using \\n character.
`;

/**
 * Parse a file using the AI Service
 * @param {Object} fileData - { data: base64, mimeType: string } or text content
 * @param {number} exchangeRateOverride - Optional exchange rate to force conversion
 * @returns {Promise<Object>} The parsed data object
 */
export const smartParseDocument = async (fileData, exchangeRateOverride = null) => {
  let userPrompt = "Please parse this document.";
  if (exchangeRateOverride) {
    userPrompt += ` usage exchange rate: 1 Local Currency = ${exchangeRateOverride} USD.`;
  }

  const fullPrompt = `${SYSTEM_PROMPT}\n\nUSER REQUEST: ${userPrompt}`;

  try {
    const responseText = await aiService.generateContent(fullPrompt, [fileData]);

    // Clean up response (remove markdown code blocks if present)
    let jsonString = responseText;
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    }

    const data = JSON.parse(jsonString.trim());

    // Post-processing to match strict DDP calculator needs
    // Ensure defaults if AI missed them
    if (!data.items) data.items = [];
    if (!data.settings) data.settings = { pricingMode: 'EXW' };
    if (data.settings.pricingMode) {
      const pricingMode = String(data.settings.pricingMode).toUpperCase();
      data.settings.pricingMode = ['EXW', 'FOB', 'CIF'].includes(pricingMode) ? pricingMode : 'EXW';
    }

    // Validate structure (soft validation, try to fix)
    data.items = data.items.map(item => ({
      description: item.description || 'Unknown Item',
      quantity: Number(item.quantity) || 1,
      unitType: item.unitType || 'pcs',
      unitPrice: Number(item.unitPrice) || 0,
      cbmPerUnit: Number(item.cbmPerUnit) || 0,
      weightPerUnit: Number(item.weightPerUnit) || 0,
      cbmInputMode: 'perUnit',
      weightInputMode: 'perUnit',
      certifications: []
    }));

    return data;
  } catch (error) {
    console.error('Smart Parse Error:', error);
    throw new Error('Failed to parse document. ' + error.message);
  }
};
