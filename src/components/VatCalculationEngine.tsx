/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Percent, TrendingUp, Info } from 'lucide-react';
import { CalculatedRow } from '../types';

interface VatCalculationEngineProps {
  calculatedData: CalculatedRow[];
  selectedMonth: string;
}

export default function VatCalculationEngine({ calculatedData, selectedMonth }: VatCalculationEngineProps) {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Shopify' | 'Etsy'>('All');

  // Filter based on platform and active month
  const activeMonthData = useMemo(() => {
    return calculatedData.filter((row) => {
      const matchPlat = platformFilter === 'All' || row.platform === platformFilter;
      const matchMonth = row.date.startsWith(selectedMonth);
      return matchPlat && matchMonth;
    });
  }, [calculatedData, selectedMonth, platformFilter]);

  // Find max values in active columns for the data bars scaling
  const maxValues = useMemo(() => {
    let maxGross = 0.01;
    let maxOutput = 0.01;
    let maxRefund = 0.01;
    let maxPayable = 0.01;

    activeMonthData.forEach((row) => {
      if (Math.abs(row.grossSales) > maxGross) maxGross = Math.abs(row.grossSales);
      if (Math.abs(row.outputVat) > maxOutput) maxOutput = Math.abs(row.outputVat);
      if (Math.abs(row.refundVat) > maxRefund) maxRefund = Math.abs(row.refundVat);
      if (Math.abs(row.netVatPayable) > maxPayable) maxPayable = Math.abs(row.netVatPayable);
    });

    return { maxGross, maxOutput, maxRefund, maxPayable };
  }, [activeMonthData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Helper to render inline data bar
  const renderDataBar = (value: number, maxValue: number) => {
    const percentage = Math.min(100, Math.max(0, (Math.abs(value) / maxValue) * 100));
    return (
      <div className="w-16 h-1.5 bg-[#051C2C]/10 rounded-full overflow-hidden shrink-0">
        <div
          className="h-full bg-[#2251FF] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
            VAT Calculation Engine
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time theoretical tax mapping, net extraction, refund offsets, and net payables.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 self-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Display Channel:
          </span>
          {['All', 'Shopify', 'Etsy'].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p as any)}
              className={`px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                platformFilter === p
                  ? 'bg-[#2251FF] text-white'
                  : 'text-slate-500 hover:text-[#051C2C] hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Info notification */}
      <div className="bg-[#2251FF]/[0.04] border-l-3 border-[#2251FF] p-4 rounded-r-xl flex items-start space-x-3">
        <Info className="w-4 h-4 text-[#2251FF] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <strong>Filing Month Filter:</strong> Showing {activeMonthData.length} records for active tax period <strong>{selectedMonth}</strong>.
          Formula: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-[#051C2C]">Net Sales = Gross / (1 + VAT Rate)</code> | <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-[#051C2C]">Refund VAT = Refund * Rate / (1 + Rate)</code>.
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 text-left w-24">Transaction ID</th>
                <th className="py-3 px-3 text-center w-16">Platform</th>
                <th className="py-3 px-3 text-center w-16">Country</th>
                <th className="py-3 px-3 text-right w-16">VAT Rate</th>
                <th className="py-3 px-3 text-right w-36">Gross Sales</th>
                <th className="py-3 px-3 text-right w-32">Net Sales (Pre-Tax)</th>
                <th className="py-3 px-3 text-right w-36">Output VAT</th>
                <th className="py-3 px-3 text-right w-36">Refund VAT Credits</th>
                <th className="py-3 px-3 text-right w-36">Net VAT Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeMonthData.map((row, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`${isEven ? 'bg-[#F5F5F2]/20' : 'bg-white'} hover:bg-slate-50/50 transition-colors`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#051C2C]">
                      {row.id}
                    </td>

                    {/* Platform */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.25 rounded text-[9px] font-bold ${
                        row.platform === 'Shopify'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {row.platform}
                      </span>
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-3 text-center font-bold text-[#051C2C]">
                      {row.countryCode || (
                        <span className="text-[#D32F2F] text-[9px] font-bold px-1.5 py-0.25 bg-red-50 rounded">
                          MISSING
                        </span>
                      )}
                    </td>

                    {/* VAT Rate */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                      {(row.vatRate * 100).toFixed(1)}%
                    </td>

                    {/* Gross Sales */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{formatCurrency(row.grossSales)}</span>
                        {renderDataBar(row.grossSales, maxValues.maxGross)}
                      </div>
                    </td>

                    {/* Net Sales */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      {formatCurrency(row.netSales)}
                    </td>

                    {/* Output VAT */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{formatCurrency(row.outputVat)}</span>
                        {renderDataBar(row.outputVat, maxValues.maxOutput)}
                      </div>
                    </td>

                    {/* Refund VAT */}
                    <td className="py-2.5 px-3 text-right font-mono text-[#D32F2F]">
                      {row.refundVat > 0 ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span>-{formatCurrency(row.refundVat)}</span>
                          {renderDataBar(row.refundVat, maxValues.maxRefund)}
                        </div>
                      ) : (
                        <span className="text-slate-300">£0.00</span>
                      )}
                    </td>

                    {/* Net VAT Payable */}
                    <td className="py-2.5 px-3 text-right font-mono text-[#2251FF] font-semibold">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{formatCurrency(row.netVatPayable)}</span>
                        {renderDataBar(row.netVatPayable, maxValues.maxPayable)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeMonthData.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    No transactions recorded for selected month {selectedMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
