/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Coins, 
  HelpCircle,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { CountryRate, CalculatedRow } from '../types';

interface ControlPanelProps {
  selectedMonth: string; // e.g. "2026-06"
  setSelectedMonth: (month: string) => void;
  rates: CountryRate[];
  setRates: (rates: CountryRate[]) => void;
  grossSales: number;
  netSales: number;
  netVatPayable: number;
  exceptionsCount: number;
  calculatedData: CalculatedRow[];
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
  calculatedData,
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

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // 1. Calculate Refund-Driven VAT Recoveries
  const refundVatOmittedRecoveries = useMemo(() => {
    return calculatedData
      .filter((row) => row.date.startsWith(selectedMonth))
      .reduce((sum, row) => sum + row.refundVat, 0);
  }, [calculatedData, selectedMonth]);

  // 2. Calculate Total Platform-Collected Tax for comparison
  const totalPlatformTax = useMemo(() => {
    return calculatedData
      .filter((row) => row.date.startsWith(selectedMonth))
      .reduce((sum, row) => sum + row.platformTax, 0);
  }, [calculatedData, selectedMonth]);

  // 3. Compute detailed country-by-country VAT and cross-platform matrix (Shopify + Etsy)
  const monthlyReconciliationMatrix = useMemo(() => {
    const matrixMap: Record<string, {
      countryCode: string;
      shopifyGross: number;
      shopifyNet: number;
      shopifyOutputVat: number;
      shopifyRefundVat: number;
      shopifyPlatformTax: number;
      shopifyNetVat: number;
      etsyGross: number;
      etsyNet: number;
      etsyOutputVat: number;
      etsyRefundVat: number;
      etsyPlatformTax: number;
      etsyNetVat: number;
      totalGross: number;
      totalNet: number;
      totalOutputVat: number;
      totalRefundVat: number;
      totalPlatformTax: number;
      totalNetVat: number;
      discrepancy: number;
    }> = {};

    calculatedData.forEach((row) => {
      if (!row.date.startsWith(selectedMonth)) return;
      
      const code = row.countryCode || 'UNMAPPED';

      if (!matrixMap[code]) {
        matrixMap[code] = {
          countryCode: code,
          shopifyGross: 0,
          shopifyNet: 0,
          shopifyOutputVat: 0,
          shopifyRefundVat: 0,
          shopifyPlatformTax: 0,
          shopifyNetVat: 0,
          etsyGross: 0,
          etsyNet: 0,
          etsyOutputVat: 0,
          etsyRefundVat: 0,
          etsyPlatformTax: 0,
          etsyNetVat: 0,
          totalGross: 0,
          totalNet: 0,
          totalOutputVat: 0,
          totalRefundVat: 0,
          totalPlatformTax: 0,
          totalNetVat: 0,
          discrepancy: 0,
        };
      }

      const m = matrixMap[code];
      if (row.platform === 'Shopify') {
        m.shopifyGross += row.grossSales;
        m.shopifyNet += row.netSales;
        m.shopifyOutputVat += row.outputVat;
        m.shopifyRefundVat += row.refundVat;
        m.shopifyPlatformTax += row.platformTax;
        m.shopifyNetVat += row.netVatPayable;
      } else {
        m.etsyGross += row.grossSales;
        m.etsyNet += row.netSales;
        m.etsyOutputVat += row.outputVat;
        m.etsyRefundVat += row.refundVat;
        m.etsyPlatformTax += row.platformTax;
        m.etsyNetVat += row.netVatPayable;
      }

      m.totalGross += row.grossSales;
      m.totalNet += row.netSales;
      m.totalOutputVat += row.outputVat;
      m.totalRefundVat += row.refundVat;
      m.totalPlatformTax += row.platformTax;
      m.totalNetVat += row.netVatPayable;
      m.discrepancy = m.totalPlatformTax - m.totalOutputVat;
    });

    return Object.values(matrixMap);
  }, [calculatedData, selectedMonth]);

  // 4. Compute Filing Readiness Status before submitting VAT returns / OSS declarations
  const readiness = useMemo(() => {
    const noExceptions = exceptionsCount === 0;
    
    const activeUnmappedCount = calculatedData
      .filter((row) => row.date.startsWith(selectedMonth) && (!row.countryCode || !rates.some((r) => r.countryCode === row.countryCode)))
      .length;
    const noUnmapped = activeUnmappedCount === 0;

    // Check if there are significant tax discrepancies
    const maxDiscrepancy = monthlyReconciliationMatrix.reduce((max, m) => Math.max(max, Math.abs(m.discrepancy)), 0);
    const lowDiscrepancy = maxDiscrepancy < 5.00;

    const dataPresent = monthlyReconciliationMatrix.length > 0;

    let score = 0;
    if (noExceptions) score += 25;
    if (noUnmapped) score += 25;
    if (lowDiscrepancy) score += 25;
    if (dataPresent) score += 25;

    return {
      noExceptions,
      noUnmapped,
      activeUnmappedCount,
      lowDiscrepancy,
      maxDiscrepancy,
      dataPresent,
      score,
    };
  }, [exceptionsCount, calculatedData, selectedMonth, rates, monthlyReconciliationMatrix]);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
            Control Panel & Dashboard
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Reconcile multi-channel VAT liabilities, monitor filing readiness, and audit cross-platform compliance indicators.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-[#E8E8E6] self-start font-mono text-xs text-[#051C2C]">
          <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"></span>
          <span>SYSTEM ACTIVE — JUNE 2026</span>
        </div>
      </div>

      {/* Five Column KPI Grid highlighting VAT recovery, gross vs net, output tax, and audit flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Gross Sales */}
        <div className="bg-white rounded-xl p-5 shadow-sm card-hover-effect border-t border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Gross Revenue
            </span>
            <div className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#051C2C]">
              {formatCurrency(grossSales)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>PLATFORM TOTAL</span>
            <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded uppercase">{selectedMonth}</span>
          </div>
        </div>

        {/* KPI 2: Net Revenue */}
        <div className="bg-white rounded-xl p-5 shadow-sm card-hover-effect border-t border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Net Revenue
            </span>
            <div className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#2251FF]">
              {formatCurrency(netSales)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>PRE-TAX SALABLE</span>
            <span>EXCLUDING VAT</span>
          </div>
        </div>

        {/* KPI 3: Theoretical VAT Liability */}
        <div className="bg-white rounded-xl p-5 shadow-sm card-hover-effect border-t border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Final Net VAT
            </span>
            <div className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#051C2C]">
              {formatCurrency(netVatPayable)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>TO REMIT</span>
            <span className="text-[#00C853] font-bold">RECONCILED</span>
          </div>
        </div>

        {/* KPI 4: Refund VAT recoveries saved */}
        <div className="bg-white rounded-xl p-5 shadow-sm card-hover-effect border-t border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                VAT Recoveries Saved
              </span>
              <Coins className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-2 font-serif text-2xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(refundVatOmittedRecoveries)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>REFUND-DRIVEN CREDIT</span>
            <span className="text-emerald-600 font-semibold">RECOVERED</span>
          </div>
        </div>

        {/* KPI 5: Pending Exceptions */}
        <div className={`bg-white rounded-xl p-5 shadow-sm card-hover-effect border-t-2 flex flex-col justify-between ${
          exceptionsCount > 0 ? 'border-t-[#D32F2F]' : 'border-t-[#00C853]'
        }`}>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Audit Failures
            </span>
            <div className={`mt-2 font-serif text-2xl font-bold tracking-tight ${
              exceptionsCount > 0 ? 'text-[#D32F2F]' : 'text-[#051C2C]'
            }`}>
              {exceptionsCount}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>UNRESOLVED ERRORS</span>
            <span className={`font-semibold ${exceptionsCount > 0 ? 'text-[#D32F2F]' : 'text-[#00C853]'}`}>
              {exceptionsCount > 0 ? 'ATTN REQ' : 'CLEARED'}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filing Readiness Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#2251FF]" />
                <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
                  Filing Readiness & OSS Compliance Evaluation
                </h3>
              </div>
              <p className="text-slate-500 text-xs">
                Before exporting data or initiating One Stop Shop (OSS) VAT filing, verify the live checks below. Discrepancies and missing rate mappings can cause compliance flags in tax returns.
              </p>
            </div>
            {/* Readiness progress bar and rating */}
            <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl shrink-0">
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-inner">
                <span className="font-mono text-xs font-bold text-[#051C2C]">{readiness.score}%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">READINESS SCORE</span>
                <span className={`text-xs font-bold ${
                  readiness.score === 100 ? 'text-[#00C853]' : readiness.score >= 50 ? 'text-amber-500' : 'text-[#D32F2F]'
                }`}>
                  {readiness.score === 100 ? 'EXCELLENT / READY TO SUBMIT' : readiness.score >= 50 ? 'MEDIUM / RESOLUTION RECOMMENDED' : 'CRITICAL / BLOCKED BY ERRORS'}
                </span>
              </div>
            </div>
          </div>

          {/* Checklist items in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            {/* Check 1 */}
            <div className={`p-4 rounded-lg border flex flex-col justify-between h-28 ${
              readiness.noExceptions ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-700 block">No Audit Anomalies</span>
                {readiness.noExceptions ? (
                  <span className="text-xs text-[#00C853] font-bold">✓ PASS</span>
                ) : (
                  <span className="text-xs text-[#D32F2F] font-bold">⚠️ FAIL</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {readiness.noExceptions 
                  ? 'All transaction schemas, date scopes, and amounts validated.' 
                  : `${exceptionsCount} active errors in Validation Center requiring quick repairs.`}
              </p>
            </div>

            {/* Check 2 */}
            <div className={`p-4 rounded-lg border flex flex-col justify-between h-28 ${
              readiness.noUnmapped ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-700 block">Country Rate Mappings</span>
                {readiness.noUnmapped ? (
                  <span className="text-xs text-[#00C853] font-bold">✓ PASS</span>
                ) : (
                  <span className="text-xs text-[#D32F2F] font-bold">⚠️ UNMAPPED ({readiness.activeUnmappedCount})</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {readiness.noUnmapped 
                  ? 'Every destination country in this month has a configured VAT rate.' 
                  : 'Found active transactions pointing to unmapped countries in Matrix.'}
              </p>
            </div>

            {/* Check 3 */}
            <div className={`p-4 rounded-lg border flex flex-col justify-between h-28 ${
              readiness.lowDiscrepancy ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-700 block">Tax Variance Check</span>
                {readiness.lowDiscrepancy ? (
                  <span className="text-xs text-[#00C853] font-bold">✓ PASS</span>
                ) : (
                  <span className="text-xs text-amber-600 font-bold">⚠️ DIFF (£{readiness.maxDiscrepancy.toFixed(2)})</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {readiness.lowDiscrepancy 
                  ? 'Platform-collected tax is highly aligned with theoretical VAT rates.' 
                  : 'Slight platform tax misconfigurations or variances detected.'}
              </p>
            </div>

            {/* Check 4 */}
            <div className={`p-4 rounded-lg border flex flex-col justify-between h-28 ${
              readiness.dataPresent ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-700 block">Transaction Presence</span>
                {readiness.dataPresent ? (
                  <span className="text-xs text-[#00C853] font-bold">✓ READY</span>
                ) : (
                  <span className="text-xs text-[#D32F2F] font-bold">⚠️ NO DATA</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {readiness.dataPresent 
                  ? `${monthlyReconciliationMatrix.length} countries have active transaction ledgers.` 
                  : 'No active transactions for this month. Change filing period below.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly VAT Payable by Country Across Shopify & Etsy (Unified Matrix View) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
                Monthly Country VAT & Multi-Channel Reconciliation Matrix
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Displays gross sales, net sales, calculated output VAT, refund VAT recoveries, and platform-collected tax comparison simultaneously.
              </p>
            </div>
            <div className="bg-slate-50 text-slate-700 text-xs px-3 py-1 rounded-md font-mono border border-slate-200 uppercase">
              Period: {selectedMonth}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#051C2C] text-white">
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase border-r border-[#ffffff]/10">Country</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Shopify Gross</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Etsy Gross</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Combined Gross</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Combined Net</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Output VAT (Theory)</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Refund VAT Recovery</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Net VAT Liability</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right border-r border-[#ffffff]/10">Platform Tax</th>
                <th className="py-3 px-4 font-bold text-[10px] tracking-wider uppercase text-right">Filing Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReconciliationMatrix.map((item) => (
                <tr key={item.countryCode} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#051C2C] border-r border-slate-100 bg-slate-50/50">
                    {item.countryCode}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 border-r border-slate-100">
                    {formatCurrency(item.shopifyGross)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 border-r border-slate-100">
                    {formatCurrency(item.etsyGross)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#051C2C] border-r border-slate-100">
                    {formatCurrency(item.totalGross)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 border-r border-slate-100">
                    {formatCurrency(item.totalNet)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 border-r border-slate-100">
                    {formatCurrency(item.totalOutputVat)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-medium border-r border-slate-100 bg-emerald-50/10">
                    -{formatCurrency(item.totalRefundVat)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#051C2C] border-r border-slate-100 bg-slate-50/30">
                    {formatCurrency(item.totalNetVat)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 border-r border-slate-100">
                    {formatCurrency(item.totalPlatformTax)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-semibold ${
                    Math.abs(item.discrepancy) > 1.00 ? 'text-[#D32F2F] bg-red-50/20' : 'text-[#00C853]'
                  }`}>
                    {item.discrepancy > 0 ? '+' : ''}{formatCurrency(item.discrepancy)}
                  </td>
                </tr>
              ))}
              {monthlyReconciliationMatrix.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic font-mono">
                    No active transactions found for period "{selectedMonth}". Check filing period controls below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inputs Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Month Selector Column */}
        <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
              Filing Period Configuration
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Define target month for active aggregations.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
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

          <div className="text-slate-500 text-xs leading-relaxed space-y-2 pt-3 border-t border-slate-100 font-sans">
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
        <div className="lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#051C2C] uppercase tracking-wider">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
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
                className="px-4 py-1.5 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 h-8 font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rate</span>
              </button>
            </form>

            {/* Rates Table */}
            <div className="overflow-y-auto max-h-[220px] rounded border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-wider border-b border-[#051C2C]/10 sticky top-0">
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
                        <div className="inline-flex items-center space-x-1 font-mono">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={(rate.vatRate * 100).toFixed(1)}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-right font-mono bg-[#FFFDE7] border border-slate-200 rounded text-xs focus:outline-none focus:border-[#2251FF]"
                          />
                          <span className="text-slate-400">%</span>
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
