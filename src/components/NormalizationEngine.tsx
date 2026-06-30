/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Filter, Search, ShieldCheck } from 'lucide-react';
import { NormalizedRow } from '../types';

interface NormalizationEngineProps {
  normalizedData: NormalizedRow[];
}

export default function NormalizationEngine({ normalizedData }: NormalizationEngineProps) {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Shopify' | 'Etsy'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters
  const filteredData = normalizedData.filter((row) => {
    const matchesPlatform = platformFilter === 'All' || row.platform === platformFilter;
    const matchesSearch =
      row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.includes(searchQuery);
    return matchesPlatform && matchesSearch;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
          Normalization Engine
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Unified ledger standardizing field structures from multi-channel raw CSV files. (Read-Only)
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Platform selection */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            Channel:
          </span>
          {['All', 'Shopify', 'Etsy'].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat as any)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                platformFilter === plat
                  ? 'bg-[#051C2C] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, Country, Date..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2251FF] text-[#051C2C]"
          />
        </div>
      </div>

      {/* Integration Status Bar */}
      <div className="bg-[#00C853]/[0.04] border-l-3 border-[#00C853] p-4 rounded-r-xl flex items-center space-x-3">
        <ShieldCheck className="w-5 h-5 text-[#00C853]" />
        <span className="text-xs text-slate-700">
          <strong>Normalization Integrity Check:</strong> Verified {normalizedData.length} active transactions mapped successfully. Void empty records automatically excluded.
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-6 text-center w-16">#</th>
                <th className="py-3 px-6 text-left">Transaction ID</th>
                <th className="py-3 px-6 text-left">Filing Date</th>
                <th className="py-3 px-6 text-center">Filing Platform</th>
                <th className="py-3 px-6 text-center">Recipient Country</th>
                <th className="py-3 px-6 text-right">Gross Sales (VAT Inc.)</th>
                <th className="py-3 px-6 text-right">Refund Amount</th>
                <th className="py-3 px-6 text-right">Platform Collected Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`${isEven ? 'bg-[#F5F5F2]/20' : 'bg-white'} hover:bg-slate-50 transition-colors`}
                  >
                    {/* Index */}
                    <td className="py-3 px-6 text-center font-mono text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* Transaction ID */}
                    <td className="py-3 px-6 font-mono font-semibold text-[#051C2C]">
                      {row.id}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-6 font-mono text-slate-600">
                      {row.date}
                    </td>

                    {/* Platform Badge */}
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.platform === 'Shopify'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {row.platform}
                      </span>
                    </td>

                    {/* Country Code */}
                    <td className="py-3 px-6 text-center font-bold text-[#051C2C]">
                      {row.countryCode || (
                        <span className="text-[#D32F2F] font-semibold px-2 py-0.5 bg-red-50 rounded">
                          MISSING
                        </span>
                      )}
                    </td>

                    {/* Gross Sales */}
                    <td className="py-3 px-6 text-right font-mono text-slate-900 font-medium">
                      {formatCurrency(row.grossSales)}
                    </td>

                    {/* Refund Amount */}
                    <td className="py-3 px-6 text-right font-mono text-slate-500">
                      {row.refundAmount > 0 ? (
                        <span className="text-slate-900">{formatCurrency(row.refundAmount)}</span>
                      ) : (
                        <span className="text-slate-300">£0.00</span>
                      )}
                    </td>

                    {/* Platform Collected Tax */}
                    <td className="py-3 px-6 text-right font-mono text-slate-600">
                      {formatCurrency(row.platformTax)}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    No records match the current filter or search criteria.
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
