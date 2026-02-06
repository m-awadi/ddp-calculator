/**
 * Type definitions for the Quotation module
 */

// Currency options for displaying prices
export interface CurrencyOptions {
  showItemDualCurrency: boolean;
  showItemTotalDualCurrency: boolean;
  showInvoiceTotalDualCurrency: boolean;
}

// Company information displayed on quotation
export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
}

// Individual quotation item
export interface QuotationItem {
  description: string;
  quantity: number;
  price: number;
  image: string | null;
  certificationCost: number;
  labTestCost: number;
  certificationType: string;
  oneTimeCost?: number;
  oneTimeCostDescription?: string;
}

// Initial item passed from DDP Calculator
export interface InitialQuotationItem {
  description?: string;
  quantity?: number | string;
  price?: number | string;
  ddpPerUnit?: number | string;
}

// Section within a custom block
export interface CustomBlockSection {
  id: string | number;
  title: string;
  items: string[];
}

// Custom block for terms and conditions
export interface CustomBlock {
  id: string | number;
  title: string;
  images: string[];
  sections: CustomBlockSection[];
}

// Data passed to PDF/HTML generators
export interface QuotationGeneratorData {
  date: string;
  items: QuotationItem[];
  totalQAR: number;
  totalUSD: number;
  companyInfo: CompanyInfo;
  showPictureColumn: boolean;
  showCertificationColumn: boolean;
  customBlocks: CustomBlock[];
  quantityUnit: string;
  currencyOptions: CurrencyOptions;
  usdToQar: number;
  decimalPlaces: number;
  totalCertificationCost: number;
  totalLabTestCost: number;
  totalCertLabCost: number;
}

// QuotationApp props
export interface QuotationAppProps {
  initialItems?: InitialQuotationItem[];
  onClose?: () => void;
}

// QuotationItemRow props
export interface QuotationItemRowProps {
  item: QuotationItem;
  index: number;
  onUpdate: (index: number, field: keyof QuotationItem, value: QuotationItem[keyof QuotationItem]) => void;
  onRemove: (index: number) => void;
  showPictureColumn?: boolean;
  showCertificationColumn?: boolean;
  usdToQar?: number;
  showItemDualCurrency?: boolean;
  showItemTotalDualCurrency?: boolean;
  decimalPlaces?: number;
}

// Certification type option
export interface CertificationType {
  value: string;
  label: string;
}

// Constants
export const USD_TO_QAR = 3.65;
export const DECIMAL_PLACES = 4;
