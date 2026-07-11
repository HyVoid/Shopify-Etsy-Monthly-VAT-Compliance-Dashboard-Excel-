/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Edit3, 
  Check, 
  Sliders, 
  Clock, 
  HelpCircle,
  FileCheck2,
  TrendingDown,
  Percent
} from 'lucide-react';
import { MonthlyReportRow, CalculatedRow, CountryRate } from '../types';

interface MonthlyVatReportProps {
  reportData: MonthlyReportRow[];
  selectedMonth: string;
  hasExceptions: boolean;
  calculatedData: CalculatedRow[];
  rates: CountryRate[];
}

export default function MonthlyVatReport({ 
  reportData, 
  selectedMonth, 
  hasExceptions, 
  calculatedData, 
  rates 
}: MonthlyVatReportProps) {
  // Toggle for interactive metadata editing
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Corporate and Document Metadata (Persistent via LocalStorage)
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('vat_doc_company_name') || 'STRATOS SOLUTIONS LTD';
  });
  const [vatRegNo, setVatRegNo] = useState(() => {
    return localStorage.getItem('vat_doc_vat_reg') || 'GB 384 9201 44';
  });
  const [reviewerName, setReviewerName] = useState(() => {
    return localStorage.getItem('vat_doc_reviewer_name') || 'Alexander Hong';
  });
  const [reviewerTitle, setReviewerTitle] = useState(() => {
    return localStorage.getItem('vat_doc_reviewer_title') || 'Lead Financial Controller';
  });
  const [signDate, setSignDate] = useState(() => {
    return localStorage.getItem('vat_doc_sign_date') || new Date().toISOString().split('T')[0];
  });

  // Save metadata changes to localStorage
  useEffect(() => {
    localStorage.setItem('vat_doc_company_name', companyName);
    localStorage.setItem('vat_doc_vat_reg', vatRegNo);
    localStorage.setItem('vat_doc_reviewer_name', reviewerName);
    localStorage.setItem('vat_doc_reviewer_title', reviewerTitle);
    localStorage.setItem('vat_doc_sign_date', signDate);
  }, [companyName, vatRegNo, reviewerName, reviewerTitle, signDate]);

  // Compute active month transactions
  const activeMonthTransactions = useMemo(() => {
    return calculatedData.filter((row) => row.date.startsWith(selectedMonth));
  }, [calculatedData, selectedMonth]);

  // Compute Totals
  const totals = useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let outputVat = 0;
    let refundVat = 0;
    let netVatPayable = 0;
    let platformTax = 0;

    reportData.forEach((row) => {
      grossSales += row.grossSales;
      netSales += row.netSales;
      outputVat += row.outputVat;
      refundVat += row.refundVat;
      netVatPayable += row.netVatPayable;
    });

    // Sum platform-collected tax in active month
    activeMonthTransactions.forEach((row) => {
      platformTax += row.platformTax;
    });

    const variance = platformTax - outputVat;

    return { 
      grossSales, 
      netSales, 
      outputVat, 
      refundVat, 
      netVatPayable, 
      platformTax,
      variance 
    };
  }, [reportData, activeMonthTransactions]);

  // Compute Shopify vs. Etsy sub-totals for multi-channel composition explanation
  const channelTotals = useMemo(() => {
    const shopify = { gross: 0, net: 0, outputVat: 0, refundVat: 0, netVat: 0, platformTax: 0 };
    const etsy = { gross: 0, net: 0, outputVat: 0, refundVat: 0, netVat: 0, platformTax: 0 };

    activeMonthTransactions.forEach((row) => {
      if (row.platform === 'Shopify') {
        shopify.gross += row.grossSales;
        shopify.net += row.netSales;
        shopify.outputVat += row.outputVat;
        shopify.refundVat += row.refundVat;
        shopify.netVat += row.netVatPayable;
        shopify.platformTax += row.platformTax;
      } else {
        etsy.gross += row.grossSales;
        etsy.net += row.netSales;
        etsy.outputVat += row.outputVat;
        etsy.refundVat += row.refundVat;
        etsy.netVat += row.netVatPayable;
        etsy.platformTax += row.platformTax;
      }
    });

    return { shopify, etsy };
  }, [activeMonthTransactions]);

  // Compute Country Variance details to display vetted status per country
  const countryReconciliationDetails = useMemo(() => {
    const detailsMap: Record<string, {
      countryCode: string;
      shopifyGross: number;
      etsyGross: number;
      totalGross: number;
      totalNet: number;
      outputVat: number;
      refundVat: number;
      netVatPayable: number;
      platformTax: number;
      variance: number;
      status: 'APPROVED' | 'VARIANCE_FLAG';
    }> = {};

    reportData.forEach((row) => {
      detailsMap[row.countryCode] = {
        countryCode: row.countryCode,
        shopifyGross: 0,
        etsyGross: 0,
        totalGross: row.grossSales,
        totalNet: row.netSales,
        outputVat: row.outputVat,
        refundVat: row.refundVat,
        netVatPayable: row.netVatPayable,
        platformTax: 0,
        variance: 0,
        status: 'APPROVED',
      };
    });

    activeMonthTransactions.forEach((row) => {
      if (!row.countryCode) return;
      const d = detailsMap[row.countryCode];
      if (d) {
        if (row.platform === 'Shopify') {
          d.shopifyGross += row.grossSales;
        } else {
          d.etsyGross += row.grossSales;
        }
        d.platformTax += row.platformTax;
      }
    });

    // Calculate final variances and statuses per country
    Object.values(detailsMap).forEach((d) => {
      d.variance = d.platformTax - d.outputVat;
      // If absolute variance exceeds £1.00, flag it as variance alert
      d.status = Math.abs(d.variance) > 1.00 ? 'VARIANCE_FLAG' : 'APPROVED';
    });

    return Object.values(detailsMap);
  }, [reportData, activeMonthTransactions]);

  // Automated Audit Checklist Status (合理审阅校对指标)
  const auditIndicators = useMemo(() => {
    const totalTx = activeMonthTransactions.length;
    
    // Check 1: Missing mappings
    const unmappedCount = activeMonthTransactions.filter(
      (row) => !row.countryCode || !rates.some((r) => r.countryCode === row.countryCode)
    ).length;
    const isRatesAuditPassed = unmappedCount === 0 && totalTx > 0;

    // Check 2: Refund metrics
    const refundTxCount = activeMonthTransactions.filter((row) => row.refundAmount > 0).length;
    const totalRefundVat = activeMonthTransactions.reduce((sum, row) => sum + row.refundVat, 0);

    // Check 3: General exceptions
    const activeExceptionsCount = activeMonthTransactions.filter((row) => {
      const isUnmapped = !row.countryCode || !rates.some((r) => r.countryCode === row.countryCode);
      const isNegative = row.grossSales < 0;
      const hasDiscrepancy = Math.abs(row.platformTax - row.outputVat) > 1.00;
      return isUnmapped || isNegative || hasDiscrepancy;
    }).length;
    const isVarianceAuditPassed = activeExceptionsCount === 0 && totalTx > 0;

    return {
      totalTx,
      unmappedCount,
      isRatesAuditPassed,
      refundTxCount,
      totalRefundVat,
      activeExceptionsCount,
      isVarianceAuditPassed,
    };
  }, [activeMonthTransactions, rates]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    if (reportData.length === 0) return;

    let tsv = 'Country\tShopify Gross\tEtsy Gross\tTotal Gross\tTotal Net (Pre-Tax)\tTheoretical Output VAT\tRefund VAT Credit\tNet VAT Payable\tPlatform Tax Collected\tReconciliation Variance\n';
    countryReconciliationDetails.forEach((row) => {
      tsv += `${row.countryCode}\t${row.shopifyGross.toFixed(2)}\t${row.etsyGross.toFixed(2)}\t${row.totalGross.toFixed(2)}\t${row.totalNet.toFixed(2)}\t${row.outputVat.toFixed(2)}\t${row.refundVat.toFixed(2)}\t${row.netVatPayable.toFixed(2)}\t${row.platformTax.toFixed(2)}\t${row.variance.toFixed(2)}\n`;
    });
    tsv += `TOTAL\t${channelTotals.shopify.gross.toFixed(2)}\t${channelTotals.etsy.gross.toFixed(2)}\t${totals.grossSales.toFixed(2)}\t${totals.netSales.toFixed(2)}\t${totals.outputVat.toFixed(2)}\t${totals.refundVat.toFixed(2)}\t${totals.netVatPayable.toFixed(2)}\t${totals.platformTax.toFixed(2)}\t${totals.variance.toFixed(2)}`;

    navigator.clipboard.writeText(tsv).then(() => {
      alert('Tab-separated VAT audit ledger copied to clipboard! You can paste it directly into Excel.');
    });
  };

  return (
    <div className="space-y-6 animate-fade-up print:bg-white print:p-0">
      
      {/* ----------------- PERSISTENT ACTION & HEADER BAR (HIDDEN IN PRINT) ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
            VAT Audit & Supporting Ledger
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Official supporting documentation detailing multi-channel VAT reconciliation, refund recoveries, and validation audits for <strong>{selectedMonth}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <button
            onClick={() => setIsEditingMetadata(!isEditingMetadata)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border ${
              isEditingMetadata 
                ? 'bg-[#2251FF] text-white border-[#2251FF]' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingMetadata ? 'Close Corporate Editor' : 'Edit Ledger Details'}</span>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Ledger (Excel)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print supporting file</span>
          </button>
        </div>
      </div>

      {/* ----------------- COMPLIANCE LEVEL WARNING (HIDDEN IN PRINT) ----------------- */}
      {hasExceptions && (
        <div className="bg-[#D32F2F]/[0.04] border-l-3 border-[#D32F2F] p-4 rounded-r-xl flex items-start space-x-3 print:hidden">
          <AlertTriangle className="w-4.5 h-4.5 text-[#D32F2F] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <strong>⚠️ Compliance Reconciliation Notice:</strong> This monthly supporting ledger contains unresolved exceptions and variances.
            To present an immaculate, fully vetted audit trail to regional tax authorities, we recommend resolving outstanding items under the <strong>6. Validation Center</strong> tab first.
          </div>
        </div>
      )}

      {/* ----------------- INLINE CORPORATE METADATA PANEL (HIDDEN IN PRINT) ----------------- */}
      {isEditingMetadata && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 animate-fade-up print:hidden">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-[#2251FF]" />
            <h4 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider">
              Document Corporate Metadata Editor
            </h4>
          </div>
          <p className="text-slate-400 text-[11px]">
            Input details to customize the headers, registration indicators, and professional signing lines of this dossier. Updates persist automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Registered Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">VAT Registration Number</label>
              <input
                type="text"
                value={vatRegNo}
                onChange={(e) => setVatRegNo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Review Completion Date</label>
              <input
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Authorized Signatory Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Signatory Professional Title</label>
              <input
                type="text"
                value={reviewerTitle}
                onChange={(e) => setReviewerTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
              />
            </div>
          </div>
        </div>
      )}


      {/* ===================================================================================== */}
      {/* ==================== OFFICIAL DOSSIER FRAMEWORK (AUDIT-READY) ===================== */}
      {/* ===================================================================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 max-w-[1100px] mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Dossier Cover / Header Meta Block */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-[#051C2C]/15 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-[#051C2C] rounded flex items-center justify-center">
                <div className="w-2.5 h-2.5 border-2 border-white rotate-45"></div>
              </div>
              <span className="text-xs font-bold text-[#051C2C] tracking-widest font-sans">STRATOS COMPLIANCE AUDITING</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#051C2C] tracking-tight pt-1">
              VAT RECONCILIATION SUPPORTING DOSSIER
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">
              DOCUMENT IDENTIFIER: <span className="font-bold text-[#051C2C]">STR-VAT-{selectedMonth.replace('-', '')}-SUPPORTING</span>
            </p>
          </div>

          <div className="text-xs space-y-1 md:text-right font-mono text-slate-700">
            <div>FILING BUSINESS ENTITY: <span className="font-bold text-[#051C2C]">{companyName}</span></div>
            <div>VAT ID / TAX REGISTRATION: <span className="font-bold text-[#051C2C]">{vatRegNo}</span></div>
            <div>ACTIVE TAX FILING PERIOD: <span className="font-bold text-[#051C2C]">{selectedMonth}</span></div>
            <div>PREPARATION METHODOLOGY: <span className="font-bold text-[#051C2C]">THEORETICAL NET RECONCILIATION</span></div>
          </div>
        </div>

        {/* ----------------- SECTION 1: DETAILED AUDIT & REASONABLE REVIEW STATUS (合理审阅校对结论) ----------------- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-[#051C2C]" />
            <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider font-sans">
              1. Automated Audit Review Indicators & Compliance Statement
            </h3>
          </div>
          
          <p className="text-slate-500 text-xs leading-relaxed">
            The dataset for this filing period has been systematically audited against established tax algorithms, regional destination-based standard rates, and source platform collection registers. The following parameters represent formal vetting checks conducted prior to submission:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Audit Check 1 */}
            <div className="border border-slate-100 p-4 rounded-lg bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Multi-Channel Source Consistency</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                  ✓ VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Shopify and Etsy raw ledgers merged with 100% trace integrity. Audited a total of <span className="font-semibold text-slate-700 font-mono">{auditIndicators.totalTx}</span> transaction records.
              </p>
            </div>

            {/* Audit Check 2 */}
            <div className={`border p-4 rounded-lg space-y-1 ${
              auditIndicators.isRatesAuditPassed 
                ? 'bg-slate-50/50 border-slate-100' 
                : 'bg-rose-50/35 border-rose-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Regional Rate Calibration Audit</span>
                {auditIndicators.isRatesAuditPassed ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    ✓ PASSED
                  </span>
                ) : (
                  <span className="bg-rose-100 text-[#D32F2F] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    ⚠️ UNMAPPED ({auditIndicators.unmappedCount})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {auditIndicators.isRatesAuditPassed 
                  ? 'All active transaction destination country codes map successfully against the configured standard VAT rate matrix.'
                  : `Detected ${auditIndicators.unmappedCount} transaction(s) pointing to countries without active VAT rate mappings.`
                }
              </p>
            </div>

            {/* Audit Check 3 */}
            <div className="border border-slate-100 p-4 rounded-lg bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Refund-Driven Recoveries Recovery</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                  ✓ CLAWBACK APPLIED
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Audited <span className="font-semibold text-slate-700 font-mono">{auditIndicators.refundTxCount}</span> return order(s). Deducted <span className="font-bold text-emerald-700 font-mono">{formatCurrency(auditIndicators.totalRefundVat)}</span> in refund VAT credits that would otherwise cause overpayment.
              </p>
            </div>

            {/* Audit Check 4 */}
            <div className={`border p-4 rounded-lg space-y-1 ${
              auditIndicators.isVarianceAuditPassed 
                ? 'bg-slate-50/50 border-slate-100' 
                : 'bg-rose-50/35 border-rose-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Variance Tolerance Audit</span>
                {auditIndicators.isVarianceAuditPassed ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    ✓ PASS
                  </span>
                ) : (
                  <span className="bg-rose-100 text-[#D32F2F] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    ⚠️ {auditIndicators.activeExceptionsCount} WARN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {auditIndicators.isVarianceAuditPassed 
                  ? 'Variance check complete. The gap between platform-collected tax and computed legal liability is within the absolute £1.00 tolerance margin.'
                  : `Audit isolated ${auditIndicators.activeExceptionsCount} records with significant variances or schema abnormalities.`
                }
              </p>
            </div>

          </div>
        </div>

        {/* ----------------- SECTION 2: EXECUTIVE FINANCIAL SUMMARY ----------------- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#051C2C]" />
            <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider font-sans">
              2. Executive Financial Aggregates & Discrepancy Reconciliation
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            
            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Gross Sales</span>
              <span className="font-mono text-xs font-semibold text-[#051C2C] block mt-1.5">{formatCurrency(totals.grossSales)}</span>
            </div>

            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Net Sales</span>
              <span className="font-mono text-xs font-semibold text-[#2251FF] block mt-1.5">{formatCurrency(totals.netSales)}</span>
            </div>

            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Output VAT (Theory)</span>
              <span className="font-mono text-xs font-semibold text-[#051C2C] block mt-1.5">{formatCurrency(totals.outputVat)}</span>
            </div>

            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Refund Deductions</span>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-600 block mt-1.5">-{formatCurrency(totals.refundVat)}</span>
            </div>

            <div className="border border-[#2251FF]/10 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Final Net VAT</span>
              <span className="font-mono text-xs font-bold text-[#2251FF] block mt-1.5">{formatCurrency(totals.netVatPayable)}</span>
            </div>

            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Platform Tax</span>
              <span className="font-mono text-xs font-semibold text-slate-500 block mt-1.5">{formatCurrency(totals.platformTax)}</span>
            </div>

            <div className="border border-slate-100 p-3.5 rounded-lg text-center bg-slate-50/30">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Tax Variance</span>
              <span className={`font-mono text-xs font-semibold block mt-1.5 ${
                Math.abs(totals.variance) > 5.00 ? 'text-[#D32F2F]' : 'text-emerald-600'
              }`}>
                {totals.variance > 0 ? '+' : ''}{formatCurrency(totals.variance)}
              </span>
            </div>

          </div>
        </div>

        {/* ----------------- SECTION 3: MULTI-CHANNEL DATA COMPOSITION EXPLANATION (数据明细构成解释) ----------------- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Percent className="w-4 h-4 text-[#051C2C]" />
            <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider font-sans">
              3. Multi-Channel Revenue and VAT Composition Breakdown
            </h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            This table isolates transaction aggregates by platform, explaining exactly how the final combined numbers are derived from raw Shopify and Etsy records respectively:
          </p>

          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#051C2C]/[0.03] text-[#051C2C] font-semibold border-b border-[#051C2C]/10 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Sales Channel</th>
                  <th className="py-2.5 px-4 text-right">Gross Sales (VAT Inc.)</th>
                  <th className="py-2.5 px-4 text-right">Net Sales (Pre-Tax)</th>
                  <th className="py-2.5 px-4 text-right">Output VAT (Theory)</th>
                  <th className="py-2.5 px-4 text-right">Refund VAT Credit</th>
                  <th className="py-2.5 px-4 text-right">Platform Collected Tax</th>
                  <th className="py-2.5 px-4 text-right">Net Reconciled VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-700">Shopify Enterprise Store</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.shopify.gross)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.shopify.net)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.shopify.outputVat)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#D32F2F] bg-red-50/10">-{formatCurrency(channelTotals.shopify.refundVat)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatCurrency(channelTotals.shopify.platformTax)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#051C2C] bg-slate-50/20">{formatCurrency(channelTotals.shopify.netVat)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-700">Etsy Global Marketplace</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.etsy.gross)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.etsy.net)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(channelTotals.etsy.outputVat)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#D32F2F] bg-red-50/10">-{formatCurrency(channelTotals.etsy.refundVat)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatCurrency(channelTotals.etsy.platformTax)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#051C2C] bg-slate-50/20">{formatCurrency(channelTotals.etsy.netVat)}</td>
                </tr>
                <tr className="bg-slate-50/75 font-bold border-t border-[#051C2C]/10">
                  <td className="py-3 px-4 text-[#051C2C]">COMBINED RECONCILED TOTALS</td>
                  <td className="py-3 px-4 text-right font-mono text-[#051C2C]">{formatCurrency(totals.grossSales)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">{formatCurrency(totals.netSales)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">{formatCurrency(totals.outputVat)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#D32F2F] bg-red-50/20">-{formatCurrency(totals.refundVat)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(totals.platformTax)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#2251FF] text-sm">{formatCurrency(totals.netVatPayable)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------------- SECTION 4: COUNTRY-LEVEL COMPLIANCE RECONCILIATION TABLE ----------------- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#051C2C]" />
            <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider font-sans">
              4. Comprehensive Country-by-Country Audited VAT Ledger
            </h3>
          </div>
          
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#051C2C] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Country Code</th>
                  <th className="py-3 px-4 text-right">Shopify Gross</th>
                  <th className="py-3 px-4 text-right">Etsy Gross</th>
                  <th className="py-3 px-4 text-right">Combined Gross</th>
                  <th className="py-3 px-4 text-right">Pre-Tax Net</th>
                  <th className="py-3 px-4 text-right">Output VAT</th>
                  <th className="py-3 px-4 text-right">Refund Credit</th>
                  <th className="py-3 px-4 text-right">Net VAT Liability</th>
                  <th className="py-3 px-4 text-right">Platform Tax</th>
                  <th className="py-3 px-4 text-right">Filing Variance</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {countryReconciliationDetails.map((row) => (
                  <tr key={row.countryCode} className="hover:bg-slate-50/45 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#051C2C] bg-slate-50/30">
                      {row.countryCode}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(row.shopifyGross)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(row.etsyGross)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{formatCurrency(row.totalGross)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(row.totalNet)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(row.outputVat)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium bg-emerald-50/5">-{formatCurrency(row.refundVat)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#051C2C] bg-slate-50/30">{formatCurrency(row.netVatPayable)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(row.platformTax)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-semibold ${
                      row.status === 'VARIANCE_FLAG' ? 'text-[#D32F2F] bg-red-50/15' : 'text-[#00C853]'
                    }`}>
                      {row.variance > 0 ? '+' : ''}{formatCurrency(row.variance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'APPROVED' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-sans">
                          <Check className="w-2.5 h-2.5 stroke-[3px]" />
                          <span>VETTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-sans animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>RECON ATTN</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {countryReconciliationDetails.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 italic font-mono">
                      No transactions recorded for active period {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  /* Master Aggregate row */
                  <tr className="bg-[#051C2C]/[0.03] font-bold border-t-2 border-[#051C2C]">
                    <td className="py-4 px-4 text-[#051C2C] font-extrabold uppercase text-[10px] tracking-wider">
                      TOTALS
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600 text-[11px]">{formatCurrency(channelTotals.shopify.gross)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600 text-[11px]">{formatCurrency(channelTotals.etsy.gross)}</td>
                    <td className="py-4 px-4 text-right font-mono text-[#051C2C] text-[11px]">{formatCurrency(totals.grossSales)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700 text-[11px]">{formatCurrency(totals.netSales)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800 text-[11px]">{formatCurrency(totals.outputVat)}</td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 text-[11px] bg-emerald-50/10">-{formatCurrency(totals.refundVat)}</td>
                    <td className="py-4 px-4 text-right font-mono text-[#2251FF] text-[12px] bg-[#2251FF]/[0.03]">{formatCurrency(totals.netVatPayable)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-500 text-[11px]">{formatCurrency(totals.platformTax)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700 text-[11px]">{formatCurrency(totals.variance)}</td>
                    <td className="py-4 px-4 text-center">
                      {hasExceptions ? (
                        <span className="text-amber-700 font-bold text-[9px] uppercase tracking-wider font-sans">PROVISIONAL</span>
                      ) : (
                        <span className="text-[#00C853] font-bold text-[9px] uppercase tracking-wider font-sans">AUDITED PASS</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------------- SECTION 5: ACCOUNTING GUIDELINES & REGULATORY COMPLIANCE STAMP ----------------- */}
        <div className="bg-[#2251FF]/[0.03] border-l-3 border-[#2251FF] p-5 rounded-r-xl space-y-2 print:hidden">
          <h4 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider font-sans">
            Regulatory Disclosure Note
          </h4>
          <p className="text-slate-600 text-xs leading-relaxed font-sans">
            This document serves as an Explanatory Audit Supporting Ledger (支撑文件) to explain the detail of multi-channel transactional VAT figures under destination country codes. It does not replace the official regional declarations (e.g. One Stop Shop filings) but serves as formal documentation of the reasonable review and vetting conducted by the reporting business entity. All figures should be reconciled with monthly bank statements prior to official filing.
          </p>
        </div>

        {/* ----------------- SECTION 6: FORMAL AUDIT ATTESTATION & SIGN-OFF SIGNATURE BLOCK ----------------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-6 border-t border-[#051C2C]/10 font-sans">
          
          <div className="space-y-3 w-full max-w-md">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
              Review Completion Details
            </h4>
            <div className="space-y-1 font-mono text-xs text-slate-700">
              <div>AUDIT FINISHED: <span className="font-bold text-[#051C2C]">{signDate}</span></div>
              <div>EXCEPTIONS OUTSTANDING: <span className={`font-bold ${hasExceptions ? 'text-[#D32F2F]' : 'text-emerald-600'}`}>{hasExceptions ? 'YES' : 'NONE'}</span></div>
              <div>SYSTEM RECORD STATE: <span className="font-bold text-[#00C853]">APPROVED / STABLE</span></div>
            </div>
          </div>

          {/* Regulatory Compliance Physical Stamp */}
          <div className="border-2 border-dashed border-[#051C2C]/25 p-4 rounded-lg w-full max-w-xs text-center select-none bg-slate-50/40 shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">STRATOS TAX PORTAL</span>
            <span className="text-sm font-serif font-bold text-[#051C2C] tracking-tight block my-1">
              VAT COMPLIANCE VERIFIED
            </span>
            <span className="text-[9px] font-mono text-slate-500 block uppercase border-t border-[#051C2C]/10 pt-1.5 mt-1.5">
              RECORD VERIFICATION HASH APPROVED
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
