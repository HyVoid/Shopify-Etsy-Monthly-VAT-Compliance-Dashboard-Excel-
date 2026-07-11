/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Database, Download, Upload, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lastSaved: string | null;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  pendingExceptionsCount: number;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  lastSaved,
  onExport,
  onImport,
  onReset,
  pendingExceptionsCount,
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'control-panel', label: '1. Control Panel' },
    { id: 'shopify-import', label: '2. Shopify Import' },
    { id: 'etsy-import', label: '3. Etsy Import' },
    { id: 'normalization', label: '4. Normalization Engine' },
    { id: 'calculation', label: '5. VAT Calculation' },
    { id: 'validation', label: '6. Validation Center' },
    { id: 'report', label: '7. Monthly VAT Report' },
  ];

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-white border-b border-[#E8E8E6] shadow-sm">
      <div className="max-w-[1400px] mx-auto h-full px-10 flex items-center justify-between">
        {/* Brand & Left logo */}
        <div className="flex items-center space-x-3 select-none">
          <div className="w-8 h-8 bg-[#051C2C] rounded flex items-center justify-center shadow-inner">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#051C2C] leading-none tracking-tight">
              Shopify-Etsy-Monthly-VAT-Compliance-Dashboard
            </h1>
            <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-0.5">
              VAT Compliance Portal
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <nav className="hidden xl:flex h-full items-center">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`h-full px-3.5 flex items-center text-[13px] font-medium border-b-2 relative transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-[#2251FF] text-[#2251FF] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-[#051C2C]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'validation' && pendingExceptionsCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-[#D32F2F] text-white text-[10px] font-bold rounded-full min-w-4 text-center">
                    {pendingExceptionsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & Backup control */}
        <div className="flex items-center space-x-4">
          {/* Last saved indicator */}
          {lastSaved && (
            <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-pulse"></span>
              <span>Saved: {lastSaved}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Export */}
            <button
              onClick={onExport}
              title="Export JSON Backup"
              className="p-2 text-slate-500 hover:text-[#2251FF] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON Backup"
              className="p-2 text-slate-500 hover:text-[#2251FF] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImport}
              accept=".json"
              className="hidden"
            />

            {/* Reset */}
            <button
              onClick={onReset}
              title="Reset to June 2026 Sample Data"
              className="p-2 text-slate-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Fallback */}
      <div className="xl:hidden w-full bg-white border-t border-slate-100 flex items-center overflow-x-auto no-scrollbar py-2 px-4 space-x-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#2251FF] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              {tab.id === 'validation' && pendingExceptionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.25 bg-[#D32F2F] text-white text-[9px] font-bold rounded-full">
                  {pendingExceptionsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
