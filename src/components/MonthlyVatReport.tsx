/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Download, Printer, Copy, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { MonthlyReportRow } from '../types';

interface MonthlyVatReportProps {
  reportData: MonthlyReportRow[];
  selectedMonth: string;
  hasExceptions: boolean;
}

export default function MonthlyVatReport({ reportData, selectedMonth, hasExceptions }: MonthlyVatReportProps) {
  // Compute totals
  const totals = useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let outputVat = 0;
    let refundVat = 0;
    let netVatPayable = 0;

    reportData.forEach((row) => {
      grossSales += row.grossSales;
      netSales += row.netSales;
      outputVat += row.outputVat;
      refundVat += row.refundVat;
      netVatPayable += row.netVatPayable;
    });

    return { grossSales, netSales, outputVat, refundVat, netVatPayable };
  }, [reportData]);

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

    // Create TSV content
    let tsv = 'Country Code\tGross Sales\tNet Sales (Pre-Tax)\tOutput VAT\tRefund VAT Credit\tNet VAT Payable\n';
    reportData.forEach((row) => {
      tsv += `${row.countryCode}\t${row.grossSales.toFixed(2)}\t${row.netSales.toFixed(2)}\t${row.outputVat.toFixed(2)}\t${row.refundVat.toFixed(2)}\t${row.netVatPayable.toFixed(2)}\n`;
    });
    tsv += `TOTAL\t${totals.grossSales.toFixed(2)}\t${totals.netSales.toFixed(2)}\t${totals.outputVat.toFixed(2)}\t${totals.refundVat.toFixed(2)}\t${totals.netVatPayable.toFixed(2)}`;

    navigator.clipboard.writeText(tsv).then(() => {
      alert('Tab-separated VAT report copied to clipboard! You can paste it directly into Excel.');
    });
  };

  return (
    <div className="space-y-6 animate-fade-up print:bg-white print:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
            Monthly VAT Report
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Aggregated standard VAT declaration returns grouped by destination country code for <strong>{selectedMonth}</strong>.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex items-center space-x-2 shrink-0 self-start">
          <button
            onClick={handleCopyToClipboard}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#051C2C] text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy to Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Return File</span>
          </button>
        </div>
      </div>

      {/* Print only Header */}
      <div className="hidden print:block space-y-2 border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-serif">VAT RETURN FILING RECORD</h1>
        <p className="text-xs text-slate-500">Tax Period: {selectedMonth} | Generation Time: {new Date().toLocaleString()}</p>
      </div>

      {/* Exception Guard warning */}
      {hasExceptions && (
        <div className="bg-[#D32F2F]/[0.04] border-l-3 border-[#D32F2F] p-4 rounded-r-xl flex items-start space-x-3 print:hidden">
          <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <strong>⚠️ Compliance Lock Alert:</strong> This monthly return summary contains unreconciled transactions.
            Please resolve outstanding variances under the <strong>6. Validation Center</strong> tab to guarantee official tax compliance accuracy.
          </div>
        </div>
      )}

      {/* Official Return Form Structure */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 p-6 space-y-6">
        {/* Document Header block */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#051C2C]" />
            <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-label-custom">
              VAT Return Schedule
            </h3>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 font-semibold block">Filing Currency</span>
            <span className="font-bold text-[#051C2C]">GBP (£)</span>
          </div>
        </div>

        {/* Aggregation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10">
              <tr>
                <th className="py-3 px-4 text-left">Filing Country</th>
                <th className="py-3 px-4 text-right">Gross Sales (VAT Inc.)</th>
                <th className="py-3 px-4 text-right">Net Sales (Pre-Tax)</th>
                <th className="py-3 px-4 text-right">Gross Output VAT</th>
                <th className="py-3 px-4 text-right">Refund Tax Credit</th>
                <th className="py-3 px-4 text-right">Net VAT Return Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row) => (
                <tr key={row.countryCode} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#051C2C]">
                    {row.countryCode}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(row.grossSales)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.netSales)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(row.outputVat)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#D32F2F]">
                    {row.refundVat > 0 ? `-${formatCurrency(row.refundVat)}` : '£0.00'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#2251FF] font-semibold">
                    {formatCurrency(row.netVatPayable)}
                  </td>
                </tr>
              ))}

              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No transactions recorded for active period {selectedMonth}.
                  </td>
                </tr>
              ) : (
                /* Master Aggregate row */
                <tr className="bg-slate-50 font-bold border-t-2 border-[#051C2C]/10">
                  <td className="py-4 px-4 text-[#051C2C] font-bold uppercase tracking-label-custom">
                    TOTAL REPORTABLE
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[#051C2C] text-[13px]">
                    {formatCurrency(totals.grossSales)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-700 text-[13px]">
                    {formatCurrency(totals.netSales)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[#051C2C] text-[13px]">
                    {formatCurrency(totals.outputVat)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[#D32F2F] text-[13px]">
                    {totals.refundVat > 0 ? `-${formatCurrency(totals.refundVat)}` : '£0.00'}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[#2251FF] text-[14px]">
                    {formatCurrency(totals.netVatPayable)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidelines Insight Card */}
      <div className="bg-[#2251FF]/[0.04] border-l-3 border-[#2251FF] p-5 rounded-r-xl print:hidden">
        <h4 className="text-[13px] font-semibold text-[#051C2C] uppercase tracking-label-custom">
          Accounting Guidelines & Filing Steps
        </h4>
        <ol className="text-slate-600 text-xs mt-3 list-decimal pl-4 space-y-2 leading-relaxed">
          <li>
            <strong>Verify VAT Rates:</strong> Before submitting numbers to filing portals, ensure standard VAT rates in the <strong>Control Panel</strong> match up-to-date regional authorities' definitions.
          </li>
          <li>
            <strong>Download Record:</strong> Click "Print Return File" to save a PDF copy of this ledger to include in your company's physical tax filing archives.
          </li>
          <li>
            <strong>Copy Matrix:</strong> Click "Copy to Excel" to paste tab-separated aggregates into professional third-party worksheets instantly for accounting checks.
          </li>
        </ol>
      </div>
    </div>
  );
}
