/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Edit3, X, Save } from 'lucide-react';
import { ExceptionRow, ShopifyRawRow, EtsyRawRow } from '../types';

interface ValidationCenterProps {
  exceptions: ExceptionRow[];
  shopifyData: ShopifyRawRow[];
  setShopifyData: (data: ShopifyRawRow[]) => void;
  etsyData: EtsyRawRow[];
  setEtsyData: (data: EtsyRawRow[]) => void;
}

export default function ValidationCenter({
  exceptions,
  shopifyData,
  setShopifyData,
  etsyData,
  setEtsyData,
}: ValidationCenterProps) {
  const [editingRow, setEditingRow] = useState<ExceptionRow | null>(null);
  const [patchCountry, setPatchCountry] = useState('');
  const [patchGross, setPatchGross] = useState('');
  const [patchTax, setPatchTax] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleSelectRow = (row: ExceptionRow) => {
    setEditingRow(row);
    setPatchCountry(row.countryCode);
    setPatchGross(row.grossSales.toString());
    setPatchTax(row.platformTax.toString());
  };

  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const grossVal = parseFloat(patchGross);
    const taxVal = parseFloat(patchTax);

    if (isNaN(grossVal)) {
      alert('Please enter a valid gross amount.');
      return;
    }
    if (isNaN(taxVal)) {
      alert('Please enter a valid tax amount.');
      return;
    }

    if (editingRow.platform === 'Shopify') {
      const updated = shopifyData.map((row) => {
        if (row.orderId === editingRow.id) {
          return {
            ...row,
            countryCode: patchCountry.trim().toUpperCase(),
            grossAmount: grossVal,
            taxAmount: taxVal,
          };
        }
        return row;
      });
      setShopifyData(updated);
    } else {
      const updated = etsyData.map((row) => {
        if (row.receiptId === editingRow.id) {
          return {
            ...row,
            countryCode: patchCountry.trim().toUpperCase(),
            grossAmount: grossVal,
            vatCollected: taxVal,
          };
        }
        return row;
      });
      setEtsyData(updated);
    }

    setEditingRow(null);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
          Audit & Validation Center
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Automated cross-reconciliation auditing. Correct anomalies below to unlock compliant filing.
        </p>
      </div>

      {/* Compliance Overview Banner */}
      {exceptions.length === 0 ? (
        <div className="bg-[#00C853]/[0.04] border-l-3 border-[#00C853] p-6 rounded-r-xl flex items-center space-x-4">
          <CheckCircle className="w-8 h-8 text-[#00C853] shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-[#051C2C] uppercase tracking-label-custom">
              100% Tax Compliant
            </h4>
            <p className="text-slate-600 text-xs mt-1">
              Zero transaction anomalies detected. The system has completed logical consistency checks and tax variance audits.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#D32F2F]/[0.04] border-l-3 border-[#D32F2F] p-5 rounded-r-xl flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-[#D32F2F] shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-sm font-semibold text-[#051C2C] uppercase tracking-label-custom">
              Filing Blocked — {exceptions.length} Outstanding Anomalies
            </h4>
            <p className="text-slate-600 text-xs mt-1">
              The reporting system has isolated transactions violating compliance policies.
              Click on any row to open the <strong>Quick Repair console</strong> and fix inputs directly.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: List on Left, Repair Panel on Right if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Exceptions List */}
        <div className={`transition-all ${editingRow ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">#</th>
                    <th className="py-3.5 px-4 text-left">Transaction ID</th>
                    <th className="py-3.5 px-4 text-center">Platform</th>
                    <th className="py-3.5 px-4 text-center">Country</th>
                    <th className="py-3.5 px-4 text-right">Gross Sales</th>
                    <th className="py-3.5 px-4 text-right">Platform Tax</th>
                    <th className="py-3.5 px-4 text-right">Calculated VAT</th>
                    <th className="py-3.5 px-4 text-left pl-6">Anomaly Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exceptions.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => handleSelectRow(row)}
                      className={`cursor-pointer transition-all duration-150 group hover:bg-[#D32F2F]/[0.02] ${
                        editingRow?.id === row.id ? 'bg-[#D32F2F]/[0.04]' : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#051C2C] flex items-center space-x-1.5">
                        <Edit3 className="w-3 h-3 text-[#2251FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span>{row.id}</span>
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          row.platform === 'Shopify' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {row.platform}
                        </span>
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-4 text-center font-bold text-[#051C2C]">
                        {row.countryCode || (
                          <span className="text-[#D32F2F] bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                            MISSING
                          </span>
                        )}
                      </td>

                      {/* Gross */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {formatCurrency(row.grossSales)}
                      </td>

                      {/* Platform Tax */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(row.platformTax)}
                      </td>

                      {/* Calc Tax */}
                      <td className="py-3.5 px-4 text-right font-mono text-[#051C2C] font-semibold">
                        {formatCurrency(row.calculatedVat)}
                      </td>

                      {/* Diagnostic Alert message */}
                      <td className="py-3.5 px-4 text-left pl-6 text-[#D32F2F] font-medium text-[11px]">
                        {row.errorMessage}
                      </td>
                    </tr>
                  ))}
                  {exceptions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-emerald-600 italic font-medium bg-emerald-50/10">
                        Awesome! Zero compliance issues detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Repair Console (Right side drawer) */}
        {editingRow && (
          <div className="lg:col-span-4 bg-white rounded-xl p-5 shadow-md border border-slate-100 animate-fade-up self-start">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#D32F2F]" />
                <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-label-custom">
                  Quick Ledger Repair
                </h3>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#D32F2F]/[0.04] p-3 rounded-lg text-[11px] text-[#D32F2F] mb-4 space-y-1">
              <p className="font-bold">Active Diagnostic:</p>
              <p>{editingRow.errorMessage}</p>
            </div>

            <form onSubmit={handleSaveRepair} className="space-y-4">
              {/* ID Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Source ID</span>
                  <span className="font-mono font-bold text-[#051C2C]">{editingRow.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Filing Platform</span>
                  <span className="font-bold text-[#051C2C]">{editingRow.platform}</span>
                </div>
              </div>

              {/* Recipient Country code input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-label-custom block">
                  Recipient Country (2 letter)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="e.g. FR"
                  value={patchCountry}
                  onChange={(e) => setPatchCountry(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:border-[#2251FF]"
                />
              </div>

              {/* Gross Amount Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-label-custom block">
                  Gross Sales Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={patchGross}
                  onChange={(e) => setPatchGross(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:border-[#2251FF]"
                />
              </div>

              {/* Platform Tax Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-label-custom block">
                  Platform Registered Tax
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={patchTax}
                  onChange={(e) => setPatchTax(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:border-[#2251FF]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#2251FF] hover:bg-opacity-95 text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Patch</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
