'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RadialGauge } from './RadialGauge';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { StatCard } from './StatCard';

interface Target {
  label: string;
  value: number;
}

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  symbol?: string; // e.g., '%' (suffix), '€' (prefix), or undefined (no symbol)
  targets?: Target[]; // Optional targets for bar chart comparison
}

// Helper function to format values with the appropriate symbol
function formatValue(value: number, symbol?: string): string {
  if (!symbol) return `${value}`;
  
  // Prefix symbols (currencies)
  const prefixSymbols = ['€', '$', '£', '¥', '₹'];
  if (prefixSymbols.includes(symbol)) {
    return `${symbol}${value}`;
  }
  
  // Suffix symbols (%, etc.)
  return `${value}${symbol}`;
}

export function DetailView({ isOpen, onClose, value, symbol, targets }: DetailViewProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Mock data generation based on current value
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      // Generate somewhat random data around the current value
      const noise = (Math.random() - 0.5) * 30;
      return Math.max(0, Math.min(100, value + noise));
    });
  }, [value]);

  const peakValue = Math.min(100, Math.round(value * 1.12));
  const avgValue = Math.round(value * 0.92);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reliability Score Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    Performance Analysis
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Gauge */}
                  <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="mb-6">
                      <RadialGauge value={value} size={200} strokeWidth={2.5} symbol={symbol} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        Current Score
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated just now
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Visualizations Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Stat Cards */}
                    <StatCard
                      label="Peak Score (24h)"
                      value={formatValue(peakValue, symbol)}
                      trend={12}
                      trendLabel="vs avg"
                    />
                    <StatCard
                      label="Average Score"
                      value={formatValue(avgValue, symbol)}
                      trend={-8}
                      trendLabel="vs peak"
                    />

                    {/* Charts */}
                    <div className="sm:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <LineChart data={trendData} />
                    </div>

                    {targets && targets.length > 0 && (
                      <div className="sm:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <BarChart
                          current={value}
                          targets={targets}
                          symbol={symbol}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}