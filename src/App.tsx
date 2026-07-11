/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ControlPanel from './components/ControlPanel';
import ShopifyImport from './components/ShopifyImport';
import EtsyImport from './components/EtsyImport';
import NormalizationEngine from './components/NormalizationEngine';
import VatCalculationEngine from './components/VatCalculationEngine';
import ValidationCenter from './components/ValidationCenter';
import MonthlyVatReport from './components/MonthlyVatReport';

import { DEFAULT_SHOPIFY, DEFAULT_ETSY, DEFAULT_RATES } from './data';
import { ShopifyRawRow, EtsyRawRow, CountryRate, NormalizedRow, CalculatedRow, ExceptionRow, MonthlyReportRow } from './types';
import { Check, Info, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('control-panel');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');
  const [shopifyData, setShopifyData] = useState<ShopifyRawRow[]>([]);
  const [etsyData, setEtsyData] = useState<EtsyRawRow[]>([]);
  const [rates, setRates] = useState<CountryRate[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedShopify = localStorage.getItem('vat_compliance_shopify');
      const storedEtsy = localStorage.getItem('vat_compliance_etsy');
      const storedRates = localStorage.getItem('vat_compliance_rates');
      const storedMonth = localStorage.getItem('vat_compliance_month');

      if (storedShopify && storedEtsy && storedRates) {
        setShopifyData(JSON.parse(storedShopify));
        setEtsyData(JSON.parse(storedEtsy));
        setRates(JSON.parse(storedRates));
        if (storedMonth) setSelectedMonth(storedMonth);
      } else {
        // First load: seed defaults
        setShopifyData(DEFAULT_SHOPIFY);
        setEtsyData(DEFAULT_ETSY);
        setRates(DEFAULT_RATES);
        setSelectedMonth('2026-06');
      }

      const savedTime = localStorage.getItem('vat_compliance_saved_time');
      if (savedTime) setSavedTimeFormatted(new Date(savedTime));
    } catch (e) {
      console.error('Error loading localStorage:', e);
    }
  }, []);

  // Helper to format saved timestamp
  const setSavedTimeFormatted = (date: Date) => {
    const formatted = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setLastSaved(formatted);
  };

  // Trigger Toast Notification
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save to LocalStorage automatically whenever dependencies modify
  useEffect(() => {
    if (shopifyData.length === 0 && etsyData.length === 0 && rates.length === 0) return;

    try {
      localStorage.setItem('vat_compliance_shopify', JSON.stringify(shopifyData));
      localStorage.setItem('vat_compliance_etsy', JSON.stringify(etsyData));
      localStorage.setItem('vat_compliance_rates', JSON.stringify(rates));
      localStorage.setItem('vat_compliance_month', selectedMonth);

      const now = new Date();
      localStorage.setItem('vat_compliance_saved_time', now.toISOString());
      setSavedTimeFormatted(now);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [shopifyData, etsyData, rates, selectedMonth]);

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupObj = {
      version: '1.0',
      rates,
      selectedMonth,
      shopifyData,
      etsyData,
    };

    const str = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vat_compliance_backup_${selectedMonth}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('JSON backup file exported successfully!', 'success');
  };

  // Import JSON Backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.rates && json.shopifyData && json.etsyData) {
          setRates(json.rates);
          setShopifyData(json.shopifyData);
          setEtsyData(json.etsyData);
          if (json.selectedMonth) setSelectedMonth(json.selectedMonth);

          showToast('JSON backup imported successfully!', 'success');
        } else {
          showToast('Invalid backup file structure.', 'error');
        }
      } catch (err) {
        showToast('Failed to parse backup JSON.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Reset to original June 2026 data
  const handleResetData = () => {
    if (window.confirm('This will wipe local overrides and restore defaults. Proceed?')) {
      setShopifyData(DEFAULT_SHOPIFY);
      setEtsyData(DEFAULT_ETSY);
      setRates(DEFAULT_RATES);
      setSelectedMonth('2026-06');
      showToast('Wiped local storage and restored June 2026 sample data!', 'info');
    }
  };

  // Compute 4. Normalization Engine (Unified ledger)
  const normalizedData = useMemo<NormalizedRow[]>(() => {
    const shopifyRows = shopifyData
      .filter((row) => row.orderId.trim() !== '')
      .map((row) => {
        const dateStr = row.date.trim().split(' ')[0] || '';
        return {
          id: row.orderId.trim(),
          date: dateStr,
          platform: 'Shopify' as const,
          countryCode: row.countryCode.trim().toUpperCase(),
          grossSales: Number(row.grossAmount) || 0,
          refundAmount: Math.abs(Number(row.refundAmount)) || 0,
          platformTax: Number(row.taxAmount) || 0,
        };
      });

    const etsyRows = etsyData
      .filter((row) => row.receiptId.trim() !== '')
      .map((row) => {
        const dateStr = row.date.trim().split(' ')[0] || '';
        return {
          id: row.receiptId.trim(),
          date: dateStr,
          platform: 'Etsy' as const,
          countryCode: row.countryCode.trim().toUpperCase(),
          grossSales: Number(row.grossAmount) || 0,
          refundAmount: Math.abs(Number(row.refundAmount)) || 0,
          platformTax: Number(row.vatCollected) || 0,
        };
      });

    // Merge both lists
    return [...shopifyRows, ...etsyRows];
  }, [shopifyData, etsyData]);

  // Compute 5. VAT Calculation Engine (Theory VAT & net values)
  const calculatedData = useMemo<CalculatedRow[]>(() => {
    return normalizedData.map((row) => {
      const rateObj = rates.find((r) => r.countryCode === row.countryCode);
      const vatRate = rateObj ? rateObj.vatRate : 0;

      const netSales = row.grossSales / (1 + vatRate);
      const outputVat = row.grossSales - netSales;
      const refundVat = (row.refundAmount * vatRate) / (1 + vatRate);
      const netVatPayable = outputVat - refundVat;

      return {
        ...row,
        vatRate,
        netSales,
        outputVat,
        refundVat,
        netVatPayable,
      };
    });
  }, [normalizedData, rates]);

  // Compute 6. Validation Center (Detecting discrepancies)
  const exceptions = useMemo<ExceptionRow[]>(() => {
    const list: ExceptionRow[] = [];
    calculatedData.forEach((row) => {
      const errMsgs: string[] = [];

      // Check 1: Missing Country Code
      if (!row.countryCode) {
        errMsgs.push('[Missing Country Code] Cannot determine tax destination country');
      } else {
        // Check 2: Unmapped country rate
        const rateObj = rates.find((r) => r.countryCode === row.countryCode);
        if (!rateObj || rateObj.vatRate === 0) {
          errMsgs.push('[Unmapped VAT Rate] Country not configured in Control Panel');
        }
      }

      // Check 3: Negative sales
      if (row.grossSales < 0) {
        errMsgs.push('[Abnormal Sales] Gross sales amount is negative');
      }

      // Check 4: platform vs calculated tax discrepancy (> 1.00)
      if (Math.abs(row.platformTax - row.outputVat) > 1.00) {
        errMsgs.push('[Tax Discrepancy] Platform collected tax differs from computed VAT by > £1.00');
      }

      if (errMsgs.length > 0) {
        list.push({
          id: row.id,
          date: row.date,
          platform: row.platform,
          countryCode: row.countryCode,
          grossSales: row.grossSales,
          platformTax: row.platformTax,
          calculatedVat: row.outputVat,
          errorMessage: errMsgs.join(' | '),
        });
      }
    });
    return list;
  }, [calculatedData, rates]);

  // Compute 7. Monthly VAT Report Aggregation (by Country Code for activeMonth)
  const reportData = useMemo<MonthlyReportRow[]>(() => {
    const countriesMap: Record<string, MonthlyReportRow> = {};

    calculatedData.forEach((row) => {
      // Filter date range by YYYY-MM
      if (!row.date.startsWith(selectedMonth)) return;
      if (!row.countryCode) return;

      const code = row.countryCode;
      if (!countriesMap[code]) {
        countriesMap[code] = {
          countryCode: code,
          grossSales: 0,
          netSales: 0,
          outputVat: 0,
          refundVat: 0,
          netVatPayable: 0,
        };
      }

      countriesMap[code].grossSales += row.grossSales;
      countriesMap[code].netSales += row.netSales;
      countriesMap[code].outputVat += row.outputVat;
      countriesMap[code].refundVat += row.refundVat;
      countriesMap[code].netVatPayable += row.netVatPayable;
    });

    return Object.values(countriesMap);
  }, [calculatedData, selectedMonth]);

  // Aggregate stats of activeMonth for Control Panel display
  const activeMonthStats = useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let netVatPayable = 0;

    calculatedData.forEach((row) => {
      if (row.date.startsWith(selectedMonth)) {
        grossSales += row.grossSales;
        netSales += row.netSales;
        netVatPayable += row.netVatPayable;
      }
    });

    return { grossSales, netSales, netVatPayable };
  }, [calculatedData, selectedMonth]);

  // Render current active view
  const renderViewContent = () => {
    switch (currentTab) {
      case 'control-panel':
        return (
          <ControlPanel
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            rates={rates}
            setRates={setRates}
            grossSales={activeMonthStats.grossSales}
            netSales={activeMonthStats.netSales}
            netVatPayable={activeMonthStats.netVatPayable}
            exceptionsCount={exceptions.length}
            calculatedData={calculatedData}
          />
        );
      case 'shopify-import':
        return (
          <ShopifyImport
            data={shopifyData}
            setData={setShopifyData}
            onResetToDefault={() => {
              if (window.confirm('Wipe and restore original Shopify data?')) {
                setShopifyData(DEFAULT_SHOPIFY);
                showToast('Shopify raw data restored.', 'info');
              }
            }}
          />
        );
      case 'etsy-import':
        return (
          <EtsyImport
            data={etsyData}
            setData={setEtsyData}
            onResetToDefault={() => {
              if (window.confirm('Wipe and restore original Etsy data?')) {
                setEtsyData(DEFAULT_ETSY);
                showToast('Etsy raw data restored.', 'info');
              }
            }}
          />
        );
      case 'normalization':
        return <NormalizationEngine normalizedData={normalizedData} />;
      case 'calculation':
        return (
          <VatCalculationEngine
            calculatedData={calculatedData}
            selectedMonth={selectedMonth}
          />
        );
      case 'validation':
        return (
          <ValidationCenter
            exceptions={exceptions}
            shopifyData={shopifyData}
            setShopifyData={setShopifyData}
            etsyData={etsyData}
            setEtsyData={setEtsyData}
          />
        );
      case 'report':
        return (
          <MonthlyVatReport
            reportData={reportData}
            selectedMonth={selectedMonth}
            hasExceptions={exceptions.length > 0}
            calculatedData={calculatedData}
            rates={rates}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] flex flex-col">
      {/* Horizontal Header Chrome Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lastSaved={lastSaved}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onReset={handleResetData}
        pendingExceptionsCount={exceptions.length}
      />

      {/* Floating interactive notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg bg-[#051C2C] text-white border border-slate-700">
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-[#00C853]" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-[#2251FF]" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-[#D32F2F]" />}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Content viewport area */}
      <main className="flex-grow max-w-[1400px] w-full mx-auto px-10 py-8">
        <div className="animate-fade-up">
          {renderViewContent()}
        </div>
      </main>

      {/* Humble, literal footer line */}
      <footer className="py-6 border-t border-[#E8E8E6] bg-white print:hidden">
        <div className="max-w-[1400px] mx-auto px-10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#888888] font-mono">
          <span>VAT COMPLIANCE AUTOMATION WORKBOOK &copy; 2026 — ALL RIGTHS RESERVED</span>
          <span>CURRENCY: GBP (£) | ENGINE: THEORETICAL TAX RECONCILIATION</span>
        </div>
      </footer>
    </div>
  );
}
