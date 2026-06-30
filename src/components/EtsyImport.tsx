/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, FileSpreadsheet, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { EtsyRawRow } from '../types';

interface EtsyImportProps {
  data: EtsyRawRow[];
  setData: (data: EtsyRawRow[]) => void;
  onResetToDefault: () => void;
}

export default function EtsyImport({ data, setData, onResetToDefault }: EtsyImportProps) {
  const [csvText, setCsvText] = useState('');
  const [showCsvBox, setShowCsvBox] = useState(false);

  const handleCellChange = (index: number, field: keyof EtsyRawRow, value: string | number) => {
    const updated = [...data];
    if (field === 'grossAmount' || field === 'fees' || field === 'vatCollected' || field === 'refundAmount') {
      const num = parseFloat(value as string);
      updated[index] = { ...updated[index], [field]: isNaN(num) ? 0 : num };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setData(updated);
  };

  const handleAddRow = () => {
    const newRow: EtsyRawRow = {
      receiptId: `#ETS-${8000 + data.length + 1}`,
      date: new Date().toISOString().slice(0, 10) + ' 12:00',
      countryCode: 'GB',
      grossAmount: 50.00,
      fees: 2.50,
      vatCollected: 8.33,
      refundAmount: 0.00,
      currency: 'GBP',
    };
    setData([...data, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = data.filter((_, idx) => idx !== index);
    setData(updated);
  };

  const handleClearAll = () => {
    setData([]);
  };

  const handleParseCsv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    const parsedRows: EtsyRawRow[] = [];

    lines.forEach((line) => {
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length >= 4) {
        const receiptId = cols[0].trim();
        const date = cols[1].trim();
        const countryCode = cols[2].trim().toUpperCase();
        const grossAmount = parseFloat(cols[3]);
        const fees = cols[4] ? parseFloat(cols[4]) : 0;
        const vatCollected = cols[5] ? parseFloat(cols[5]) : 0;
        const refundAmount = cols[6] ? parseFloat(cols[6]) : 0;
        const currency = cols[7] ? cols[7].trim().toUpperCase() : 'EUR';

        if (receiptId && !isNaN(grossAmount)) {
          parsedRows.push({
            receiptId,
            date: date || new Date().toISOString().slice(0, 10),
            countryCode,
            grossAmount,
            fees: isNaN(fees) ? 0 : fees,
            vatCollected: isNaN(vatCollected) ? 0 : vatCollected,
            refundAmount: isNaN(refundAmount) ? 0 : refundAmount,
            currency: currency || 'EUR',
          });
        }
      }
    });

    if (parsedRows.length > 0) {
      setData([...data, ...parsedRows]);
      setCsvText('');
      setShowCsvBox(false);
    } else {
      alert('Could not parse any rows. Ensure format is: ReceiptID, Date, CountryCode, GrossAmount, [Fees, VatCollected, Refund, Currency]');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-heading font-semibold text-[#051C2C] tracking-tight">
            Etsy Import Dataset
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Directly modify Etsy raw transaction ledger lines. Real-time updates automatically propagate to calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCsvBox(!showCsvBox)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#051C2C] text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Paste Raw Clipboard Text</span>
          </button>

          <button
            onClick={handleAddRow}
            className="px-3.5 py-1.5 bg-[#051C2C] hover:bg-[#2251FF] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#D32F2F] text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Table</span>
          </button>

          <button
            onClick={onResetToDefault}
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset June Data</span>
          </button>
        </div>
      </div>

      {/* Accordion Clipboard Box */}
      {showCsvBox && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#051C2C] uppercase tracking-label-custom flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#2251FF]" />
              <span>Paste Excel / CSV Row Data</span>
            </h4>
            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
              <HelpCircle className="w-3 h-3" />
              <span>Format: ReceiptID | Date | Country | Gross | Fees | VAT Collected | Refund | Currency</span>
            </div>
          </div>

          <form onSubmit={handleParseCsv} className="space-y-3">
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="e.g.&#10;#ETS-9001,2026-06-15,GB,120.00,4.20,20.00,0.00,GBP&#10;#ETS-9002,2026-06-16,FR,60.00,2.10,10.00,0.00,EUR"
              className="w-full p-3 font-mono text-xs bg-[#FFFDE7] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2251FF] placeholder-slate-400"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCsvBox(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#2251FF] text-white rounded text-xs font-semibold cursor-pointer hover:bg-opacity-90"
              >
                Import Rows
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#051C2C]/[0.04] text-[#051C2C] font-semibold uppercase tracking-label-custom border-b border-[#051C2C]/10 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4 text-left w-32">Receipt ID</th>
                <th className="py-3 px-4 text-left w-40">Date</th>
                <th className="py-3 px-4 text-center w-24">Country Code</th>
                <th className="py-3 px-4 text-right w-28">Gross Amount</th>
                <th className="py-3 px-4 text-right w-24">Fees</th>
                <th className="py-3 px-4 text-right w-28">VAT Collected</th>
                <th className="py-3 px-4 text-right w-28">Refund Amount</th>
                <th className="py-3 px-4 text-center w-24">Currency</th>
                <th className="py-3 px-4 text-center w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  {/* Row index */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 font-medium">
                    {idx + 1}
                  </td>

                  {/* Receipt ID */}
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      value={row.receiptId}
                      onChange={(e) => handleCellChange(idx, 'receiptId', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white font-mono"
                    />
                  </td>

                  {/* Date */}
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:MM"
                      value={row.date}
                      onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white font-mono"
                    />
                  </td>

                  {/* Country Code */}
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="e.g. DE"
                      value={row.countryCode}
                      onChange={(e) => handleCellChange(idx, 'countryCode', e.target.value.toUpperCase().trim())}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-center font-bold"
                    />
                  </td>

                  {/* Gross Amount */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.grossAmount}
                      onChange={(e) => handleCellChange(idx, 'grossAmount', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-right font-mono"
                    />
                  </td>

                  {/* Fees */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.fees}
                      onChange={(e) => handleCellChange(idx, 'fees', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-right font-mono"
                    />
                  </td>

                  {/* VAT Collected */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.vatCollected}
                      onChange={(e) => handleCellChange(idx, 'vatCollected', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-right font-mono"
                    />
                  </td>

                  {/* Refund Amount */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.refundAmount}
                      onChange={(e) => handleCellChange(idx, 'refundAmount', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-right font-mono"
                    />
                  </td>

                  {/* Currency */}
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={row.currency}
                      onChange={(e) => handleCellChange(idx, 'currency', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 text-xs bg-[#FFFDE7] border border-transparent rounded focus:border-[#2251FF] focus:outline-none focus:bg-white text-center font-mono"
                    />
                  </td>

                  {/* Remove Button */}
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="text-slate-400 hover:text-[#D32F2F] p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer inline-flex"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    The Etsy raw dataset is empty. Click "Add Row" or "Reset June Data" to begin.
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
