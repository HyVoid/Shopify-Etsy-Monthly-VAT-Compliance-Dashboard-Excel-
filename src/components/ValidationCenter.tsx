/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Edit3, 
  X, 
  Save, 
  Search, 
  SlidersHorizontal,
  FileWarning,
  Flame,
  ArrowRight
} from 'lucide-react';
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
  
  // Categorization filter states
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'COUNTRY' | 'TAX' | 'INCONSISTENCY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Anomaly diagnostic classifier
  const getCategory = (errStr: string) => {
    const s = errStr.toLowerCase();
    if (s.includes('country') || s.includes('unmapped')) {
      return 'COUNTRY';
    }
    if (s.includes('discrepancy') || s.includes('differs')) {
      return 'TAX';
    }
    return 'INCONSISTENCY';
  };

  // Compute category counts for tabs
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: exceptions.length,
      COUNTRY: 0,
      TAX: 0,
      INCONSISTENCY: 0,
    };
    exceptions.forEach((row) => {
      const cat = getCategory(row.errorMessage);
      if (cat === 'COUNTRY') counts.COUNTRY++;
      else if (cat === 'TAX') counts.TAX++;
      else counts.INCONSISTENCY++;
    });
    return counts;
  }, [exceptions]);

  // Filter and search logic
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((row) => {
      // 1. Category filter
      const cat = getCategory(row.errorMessage);
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) {
        return false;
      }
      // 2. Search term filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesId = row.id.toLowerCase().includes(query);
        const matchesCountry = row.countryCode.toLowerCase().includes(query);
        const matchesMsg = row.errorMessage.toLowerCase().includes(query);
        return matchesId || matchesCountry || matchesMsg;
      }
      return true;
    });
  }, [exceptions, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
          Audit & Validation Center
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Automated cross-reconciliation auditing. Isolate missing country mappings, tax variances, and reporting anomalies with direct in-ledger repair controls.
        </p>
      </div>

      {/* Compliance Overview Banner */}
      {exceptions.length === 0 ? (
        <div className="bg-[#00C853]/[0.04] border-l-3 border-[#00C853] p-6 rounded-r-xl flex items-center space-x-4">
          <CheckCircle className="w-8 h-8 text-[#00C853] shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
              100% Tax Compliant & Verified
            </h4>
            <p className="text-slate-600 text-xs mt-1">
              Zero transaction anomalies detected. The system has successfully completed cross-platform logical consistency checks and standard VAT variance audits.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#D32F2F]/[0.04] border-l-3 border-[#D32F2F] p-5 rounded-r-xl flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-[#D32F2F] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
              Filing Blocked — {exceptions.length} Outstanding Anomalies Detected
            </h4>
            <p className="text-slate-600 text-xs mt-1">
              The auditing compiler has isolated transactions with missing destination codes, platform tax discrepancies, or abnormal amounts. Click any row to launch the <strong>Quick Ledger Repair</strong> console and apply localized patches.
            </p>
          </div>
        </div>
      )}

      {/* Advanced Interactive Segmented Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Category Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#051C2C] text-white border-[#051C2C]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              All Exceptions ({categoryCounts.ALL})
            </button>
            <button
              onClick={() => setSelectedCategory('COUNTRY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                selectedCategory === 'COUNTRY'
                  ? 'bg-[#2251FF] text-white border-[#2251FF]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Missing Country Mappings ({categoryCounts.COUNTRY})
            </button>
            <button
              onClick={() => setSelectedCategory('TAX')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                selectedCategory === 'TAX'
                  ? 'bg-[#2251FF] text-white border-[#2251FF]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Incorrect Tax Assumptions ({categoryCounts.TAX})
            </button>
            <button
              onClick={() => setSelectedCategory('INCONSISTENCY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                selectedCategory === 'INCONSISTENCY'
                  ? 'bg-[#2251FF] text-white border-[#2251FF]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              Reporting Inconsistencies ({categoryCounts.INCONSISTENCY})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-[#FFFDE7] text-[#051C2C] focus:outline-none focus:ring-1 focus:ring-[#2251FF] focus:border-[#2251FF]"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: List on Left, Repair Panel on Right if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Exceptions List */}
        <div className={`transition-all duration-300 ${editingRow ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#051C2C] text-white">
                    <th className="py-3 px-4 text-center w-12 font-bold uppercase tracking-wider">#</th>
                    <th className="py-3 px-4 text-left font-bold uppercase tracking-wider">Transaction ID</th>
                    <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Platform</th>
                    <th className="py-3 px-4 text-center font-bold uppercase tracking-wider">Country Code</th>
                    <th className="py-3 px-4 text-right font-bold uppercase tracking-wider">Gross Sales</th>
                    <th className="py-3 px-4 text-right font-bold uppercase tracking-wider">Platform Tax</th>
                    <th className="py-3 px-4 text-right font-bold uppercase tracking-wider">Calculated VAT</th>
                    <th className="py-3 px-4 text-left pl-6 font-bold uppercase tracking-wider">Anomaly Diagnostics & Comparative Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExceptions.map((row, idx) => {
                    const variance = row.platformTax - row.calculatedVat;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleSelectRow(row)}
                        className={`cursor-pointer transition-all duration-150 group hover:bg-[#D32F2F]/[0.02] ${
                          editingRow?.id === row.id ? 'bg-[#D32F2F]/[0.04]' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
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
                            <span className="text-[#D32F2F] bg-red-50 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
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

                        {/* Diagnostic Alert message with platform vs calculated comparison */}
                        <td className="py-3.5 px-4 text-left pl-6 text-[#D32F2F] font-medium text-[11px] space-y-1">
                          <div className="flex items-center space-x-2 font-semibold">
                            <span>{row.errorMessage}</span>
                          </div>
                          {Math.abs(variance) > 0.01 && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Platform Collected: <span className="font-bold text-slate-700">{formatCurrency(row.platformTax)}</span> vs. Calculated obligation: <span className="font-bold text-slate-700">{formatCurrency(row.calculatedVat)}</span> (Var: <span className="font-bold text-red-600">{formatCurrency(variance)}</span>)
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExceptions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-emerald-600 italic font-medium bg-emerald-50/10">
                        No active exceptions match the selected filter/search. Good work!
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
          <div className="lg:col-span-4 bg-white rounded-xl p-5 shadow-md border border-slate-100 animate-fade-up self-start space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#D32F2F]" />
                <h3 className="text-xs font-bold text-[#051C2C] uppercase tracking-wider">
                  Quick Ledger Repair Console
                </h3>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#D32F2F]/[0.04] p-3 rounded-lg text-[11px] text-[#D32F2F] space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px]">Active Audit Fail Type:</p>
              <p className="font-medium">{getCategory(editingRow.errorMessage) === 'COUNTRY' ? 'Missing/Unmapped Country Code' : getCategory(editingRow.errorMessage) === 'TAX' ? 'Incorrect Tax Assumptions Variance' : 'Reporting & Schema Inconsistency'}</p>
              <p className="text-[10px] text-slate-500 mt-1">{editingRow.errorMessage}</p>
            </div>

            {/* Platform tax vs calculated comparison widget */}
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tax Gap Comparison</span>
              <div className="flex items-center justify-between font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Platform Collected</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(editingRow.platformTax)}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase">Calculated VAT</span>
                  <span className="font-bold text-[#2251FF]">{formatCurrency(editingRow.calculatedVat)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveRepair} className="space-y-4">
              {/* ID Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Source ID</span>
                  <span className="font-mono font-bold text-[#051C2C]">{editingRow.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Filing Platform</span>
                  <span className="font-bold text-[#051C2C]">{editingRow.platform}</span>
                </div>
              </div>

              {/* Recipient Country code input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Recipient Country (2 Letter ISO)
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
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
                  className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
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
