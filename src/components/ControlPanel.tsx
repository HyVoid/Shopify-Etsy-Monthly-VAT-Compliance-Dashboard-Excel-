/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, Info } from 'lucide-react';
import { CountryRate } from '../types';

interface ControlPanelProps {
  selectedMonth: string; // e.g. "2026-06"
  setSelectedMonth: (month: string) => void;
  rates: CountryRate[];
  setRates: (rates: CountryRate[]) => void;
  grossSales: number;
  netSales: number;
  netVatPayable: number;
  exceptionsCount: number;
}

export default function ControlPanel({
  selectedMonth,
  setSelectedMonth,
  rates,
  setRates,
  grossSales,
  netSales,
  netVatPayable,
  exceptionsCount,
}: ControlPanelProps) {
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newRatePercent, setNewRatePercent] = useState('');

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCountryCode.trim().toUpperCase();
    const rateVal = parseFloat(newRatePercent);

    if (!code || code.length !== 2) {
      alert('Please enter a valid 2-character country code (e.g., DE)');
      return;
    }
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
      alert('Please enter a valid VAT rate percentage (0 - 100)');
      return;
    }

    // Check duplicate
    if (rates.some((r) => r.countryCode === code)) {
      alert(`Country code ${code} is already configured.`);
      return;
    }

    const updated = [...rates, { countryCode: code, vatRate: rateVal / 100 }];
    setRates(updated);
    setNewCountryCode('');
    setNewRatePercent('');
  };

  const handleRateChange = (index: number, newRateStr: string) => {
    const rawVal = parseFloat(newRateStr);
    const updated = [...rates];
    if (!isNaN(rawVal) && rawVal >= 0 && rawVal <= 100) {
      updated[index].vatRate = rawVal / 100;
    } else if (newRateStr === '') {
      updated[index].vatRate = 0;
    }
    setRates(updated);
  };

  const handleDeleteRate = (code: string) => {
    const updated = rates.filter((r) => r.countryCode !== code);
    setRates(updated);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
          Control Panel
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Set active VAT tax filing period and manage target country VAT rate matrices.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Gross Sales */}
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover-effect border-t border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold tracking-label-custom uppercase">
              Gross Sales (Month)
            </span>
            <span className="text-xs bg-slate-100 text-[#051C2C] font-mono px-2 py-0.5 rounded">
              {selectedMonth}
            </span>
          </div>
          <div className="mt-4 font-serif-display text-3xl font-bold tracking-tight text-[#051C2C]">
            {formatCurrency(grossSales)}
          </div>
          <p className="text-xs text-[#888888] mt-1">Total revenue includingVAT & shipping</p>
        </div>

        {/* KPI 2: Net Sales */}
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover-effect border-t border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold tracking-label-custom uppercase">
              Net Revenue
            </span>
            <span className="text-xs text-[#2251FF] font-medium">Pre-tax</span>
          </div>
          <div className="mt-4 font-serif-display text-3xl font-bold tracking-tight text-[#2251FF]">
            {formatCurrency(netSales)}
          </div>
          <p className="text-xs text-[#888888] mt-1">Excludes VAT, shipping discounts applied</p>
        </div>

        {/* KPI 3: Net VAT Payable */}
        <div className="bg-white rounded-xl p-6 shadow-sm card-hover-effect border-t border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold tracking-label-custom uppercase">
              Net VAT Payable
            </span>
            <span className="text-xs text-emerald-500 font-medium">To Remit</span>
          </div>
          <div className="mt-4 font-serif-display text-3xl font-bold tracking-tight text-[#051C2C]">
            {formatCurrency(netVatPayable)}
          </div>
          <p className="text-xs text-[#888888] mt-1">Output VAT minus validated refunds</p>
        </div>

        {/* KPI 4: Pending Exceptions */}
        <div className={`bg-white rounded-xl p-6 shadow-sm card-hover-effect border-t-2 ${
          exceptionsCount > 0 ? 'border-t-[#D32F2F]' : 'border-t-slate-100'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold tracking-label-custom uppercase">
              Pending Exceptions
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              exceptionsCount > 0 ? 'bg-red-50 text-[#D32F2F]' : 'bg-green-50 text-[#00C853]'
            }`}>
              {exceptionsCount > 0 ? 'ACTION REQUIRED' : 'COMPLIANT'}
            </span>
          </div>
          <div className={`mt-4 font-serif-display text-3xl font-bold tracking-tight ${
            exceptionsCount > 0 ? 'text-[#D32F2F]' : 'text-[#051C2C]'
          }`}>
            {exceptionsCount}
          </div>
          <p className="text-xs text-[#888888] mt-1">
            {exceptionsCount > 0 ? 'Discrepancy anomalies blocking report' : 'Zero tax anomalies found'}
          </p>
        </div>
      </div>

      {/* Insight Recommendation Block */}
      <div className="bg-[#2251FF]/[0.04] border-l-3 border-[#2251FF] p-5 rounded-r-xl">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-[#2251FF] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-semibold text-[#051C2C] uppercase tracking-label-custom">
              Filing Insight & Recommended Action
            </h4>
            <div className="text-slate-600 text-xs mt-1.5 space-y-1">
              <p>
                This SaaS tool mirrors the Excel data model for Cross-Platform VAT reconciliation.
                All calculations occur live on the client side based on standard country rates configured below.
              </p>
              {exceptionsCount > 0 ? (
                <p className="font-medium text-[#D32F2F]">
                  ⚠️ There are <strong>{exceptionsCount} unaddressed exceptions</strong> in the Validation Center.
                  Please audit raw platform dates and verify country tax rates to resolve outstanding anomalies.
                </p>
              ) : (
                <p className="font-medium text-[#00C853]">
                  ✓ System is currently fully reconciled with zero outstanding validation errors.
                  The aggregate figures are ready for export under tab <strong>7. Monthly VAT Report</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Month Selector Column */}
        <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-label-custom">
              Filing Period
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Define target month for active aggregations.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-label-custom block">
              Active Month
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-[#FFFDE7] text-[#051C2C] focus:outline-none focus:ring-1 focus:ring-[#2251FF] focus:border-[#2251FF]"
              />
            </div>
          </div>

          <div className="text-slate-500 text-xs leading-relaxed space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2251FF] shrink-0 mt-1.5"></span>
              <span>Changing this updates calculation filters across all transaction views instantly.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2251FF] shrink-0 mt-1.5"></span>
              <span>Default mock datasets represent shipments from <strong>June 2026</strong>.</span>
            </div>
          </div>
        </div>

        {/* VAT Rate Matrix Table Column */}
        <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-label-custom">
                  VAT Rate Matrix
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Standard VAT rates by destination country code used for theoretical calculations.
                </p>
              </div>
            </div>

            {/* Matrix Form */}
            <form onSubmit={handleAddRate} className="flex items-end space-x-3 mb-5 p-4 bg-slate-50 rounded-lg">
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-label-custom block mb-1">
                  Country Code (2 Letters)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="e.g. GB"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                />
              </div>

              <div className="w-1/3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-label-custom block mb-1">
                  Standard VAT Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 20.0"
                  value={newRatePercent}
                  onChange={(e) => setNewRatePercent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FFFDE7] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2251FF]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rate</span>
              </button>
            </form>

            {/* Rates Table */}
            <div className="overflow-y-auto max-h-[220px] rounded border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Country Code</th>
                    <th className="py-2.5 px-4 text-right">Filing VAT Rate (%)</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rates.map((rate, idx) => (
                    <tr
                      key={rate.countryCode}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-bold text-[#051C2C]">
                        {rate.countryCode}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={(rate.vatRate * 100).toFixed(1)}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-right font-mono bg-[#FFFDE7] border border-slate-200 rounded text-xs focus:outline-none focus:border-[#2251FF]"
                          />
                          <span className="text-slate-400 font-mono">%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRate(rate.countryCode)}
                          className="text-slate-400 hover:text-[#D32F2F] p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer inline-flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">
                        No country rates configured. Please add rates above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
