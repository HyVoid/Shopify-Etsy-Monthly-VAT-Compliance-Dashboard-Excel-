/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShopifyRawRow {
  orderId: string;
  date: string;
  countryCode: string;
  grossAmount: number;
  discount: number;
  shipping: number;
  taxAmount: number;
  refundAmount: number;
  currency: string;
}

export interface EtsyRawRow {
  receiptId: string;
  date: string;
  countryCode: string;
  grossAmount: number;
  fees: number;
  vatCollected: number;
  refundAmount: number;
  currency: string;
}

export interface CountryRate {
  countryCode: string;
  vatRate: number; // e.g. 0.20 for 20%
}

export interface NormalizedRow {
  id: string; // Unified Order/Receipt ID
  date: string; // Formatted YYYY-MM-DD
  platform: 'Shopify' | 'Etsy';
  countryCode: string;
  grossSales: number;
  refundAmount: number;
  platformTax: number;
}

export interface CalculatedRow extends NormalizedRow {
  vatRate: number;
  netSales: number;
  outputVat: number;
  refundVat: number;
  netVatPayable: number;
}

export interface ExceptionRow {
  id: string;
  date: string;
  platform: 'Shopify' | 'Etsy';
  countryCode: string;
  grossSales: number;
  platformTax: number;
  calculatedVat: number;
  errorMessage: string;
}

export interface MonthlyReportRow {
  countryCode: string;
  grossSales: number;
  netSales: number;
  outputVat: number;
  refundVat: number;
  netVatPayable: number;
}
