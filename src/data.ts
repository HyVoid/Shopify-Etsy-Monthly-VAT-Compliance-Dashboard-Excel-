/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CountryRate, ShopifyRawRow, EtsyRawRow } from './types';

export const DEFAULT_RATES: CountryRate[] = [
  { countryCode: 'GB', vatRate: 0.20 },
  { countryCode: 'DE', vatRate: 0.19 },
  { countryCode: 'FR', vatRate: 0.20 },
  { countryCode: 'IT', vatRate: 0.22 },
  { countryCode: 'ES', vatRate: 0.21 },
  { countryCode: 'NL', vatRate: 0.21 },
  { countryCode: 'BE', vatRate: 0.21 },
  { countryCode: 'IE', vatRate: 0.23 },
  { countryCode: 'AT', vatRate: 0.20 },
];

export const DEFAULT_SHOPIFY: ShopifyRawRow[] = [
  {
    orderId: '#SHO-1001',
    date: '2026-06-02 10:14',
    countryCode: 'GB',
    grossAmount: 120.00,
    discount: 0.00,
    shipping: 10.00,
    taxAmount: 20.00,
    refundAmount: 0.00,
    currency: 'GBP',
  },
  {
    orderId: '#SHO-1002',
    date: '2026-06-04 14:32',
    countryCode: 'DE',
    grossAmount: 238.00,
    discount: 10.00,
    shipping: 15.00,
    taxAmount: 38.00,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1003',
    date: '2026-06-06 18:21',
    countryCode: 'FR',
    grossAmount: 84.00,
    discount: 0.00,
    shipping: 8.00,
    taxAmount: 14.00,
    refundAmount: 84.00, // Fully refunded
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1004',
    date: '2026-06-08 09:05',
    countryCode: 'IT',
    grossAmount: 305.00,
    discount: 20.00,
    shipping: 12.00,
    taxAmount: 55.00,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    // Anomaly 1: Missing Country Code
    orderId: '#SHO-1005',
    date: '2026-06-11 11:45',
    countryCode: '',
    grossAmount: 150.00,
    discount: 0.00,
    shipping: 10.00,
    taxAmount: 25.00,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1006',
    date: '2026-06-14 16:11',
    countryCode: 'ES',
    grossAmount: 145.20,
    discount: 5.00,
    shipping: 9.00,
    taxAmount: 25.20,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    // Anomaly 2: Platform vs Calculated Tax Discrepancy (> 1.00)
    orderId: '#SHO-1007',
    date: '2026-06-16 12:00',
    countryCode: 'DE',
    grossAmount: 238.00, // Calculated tax (19%) should be 38.00
    discount: 0.00,
    shipping: 0.00,
    taxAmount: 15.00, // Platform registered tax is 15.00 (discrepancy of 23.00)
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1008',
    date: '2026-06-19 21:03',
    countryCode: 'NL',
    grossAmount: 181.50,
    discount: 15.00,
    shipping: 10.00,
    taxAmount: 31.50,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    // Anomaly 3: Negative gross sales amount
    orderId: '#SHO-1009',
    date: '2026-06-21 15:30',
    countryCode: 'FR',
    grossAmount: -50.00,
    discount: 0.00,
    shipping: 0.00,
    taxAmount: -8.33,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1010',
    date: '2026-06-25 10:48',
    countryCode: 'IE',
    grossAmount: 246.00,
    discount: 0.00,
    shipping: 12.00,
    taxAmount: 46.00,
    refundAmount: 50.00, // Partial refund
    currency: 'EUR',
  },
  {
    orderId: '#SHO-1011',
    date: '2026-06-28 17:01',
    countryCode: 'BE',
    grossAmount: 121.00,
    discount: 0.00,
    shipping: 8.00,
    taxAmount: 21.00,
    refundAmount: 0.00,
    currency: 'EUR',
  }
];

export const DEFAULT_ETSY: EtsyRawRow[] = [
  {
    receiptId: '#ETS-8001',
    date: '2026-06-03 12:22',
    countryCode: 'GB',
    grossAmount: 60.00,
    fees: 3.50,
    vatCollected: 10.00,
    refundAmount: 0.00,
    currency: 'GBP',
  },
  {
    receiptId: '#ETS-8002',
    date: '2026-06-05 09:14',
    countryCode: 'FR',
    grossAmount: 110.00,
    fees: 6.20,
    vatCollected: 18.33,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    receiptId: '#ETS-8003',
    date: '2026-06-09 20:41',
    countryCode: 'DE',
    grossAmount: 119.00,
    fees: 5.90,
    vatCollected: 19.00,
    refundAmount: 119.00, // Fully refunded
    currency: 'EUR',
  },
  {
    // Anomaly 4: Country code 'JP' is not mapped in standard rates list
    receiptId: '#ETS-8004',
    date: '2026-06-12 14:02',
    countryCode: 'JP',
    grossAmount: 95.00,
    fees: 4.80,
    vatCollected: 15.00,
    refundAmount: 0.00,
    currency: 'JPY',
  },
  {
    receiptId: '#ETS-8005',
    date: '2026-06-15 11:15',
    countryCode: 'IT',
    grossAmount: 183.00,
    fees: 9.10,
    vatCollected: 33.00,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    receiptId: '#ETS-8006',
    date: '2026-06-20 16:50',
    countryCode: 'NL',
    grossAmount: 72.60,
    fees: 3.90,
    vatCollected: 12.60,
    refundAmount: 0.00,
    currency: 'EUR',
  },
  {
    receiptId: '#ETS-8007',
    date: '2026-06-27 18:03',
    countryCode: 'ES',
    grossAmount: 151.25,
    fees: 8.40,
    vatCollected: 26.25,
    refundAmount: 0.00,
    currency: 'EUR',
  }
];
