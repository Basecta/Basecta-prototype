'use client';

import React from 'react';

interface BarChartProps {
  current: number;
  targets: {
    label: string;
    value: number;
  }[];
  symbol?: string; // e.g., '%' (suffix), '€' (prefix), or undefined (no symbol)
}

// Helper function to format values with the appropriate symbol
function formatValue(value: number, symbol?: string): string {
  if (!symbol) return `${Math.round(value)}`;

  // Prefix symbols (currencies)
  const prefixSymbols = ['€', '$', '£', '¥', '₹'];
  if (prefixSymbols.includes(symbol)) {
    return `${symbol}${Math.round(value)}`;
  }

  // Suffix symbols (%, etc.)
  return `${Math.round(value)}${symbol}`;
}

export function BarChart({ current, targets, symbol }: BarChartProps) {
  const max = Math.max(current, ...targets.map((t) => t.value)) * 1.1;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-sm font-medium text-gray-500">
          Benchmark Comparison
        </h3>
      </div>

      <div className="space-y-4">
        {/* Current Value Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-gray-900">Current</span>
            <span className="text-gray-500">{formatValue(current, symbol)}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#77E6B4] rounded-full transition-all duration-500"
              style={{
                width: `${(current / max) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Target Bars */}
        {targets.map((target) => (
          <div key={target.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-gray-500">{target.label}</span>
              <span className="text-gray-400">{formatValue(target.value, symbol)}</span>
            </div>
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-300 rounded-full"
                style={{
                  width: `${(target.value / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
