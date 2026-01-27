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

export type DetailViewType = 'reliability' | 'biodiversity' | 'income';

interface DetailViewData {
  trendData: number[];
  peakValue: number;
  avgValue: number;
  peakLabel: string;
  avgLabel: string;
  peakTrend: number;
  avgTrend: number;
}

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  symbol?: string; // e.g., '%' (suffix), '€' (prefix), or undefined (no symbol)
  targets?: Target[]; // Optional targets for bar chart comparison
  type?: DetailViewType; // Type of detail view for proper labeling
  dummy?: boolean; // If true, generate dummy data; if false, require data prop
  data?: DetailViewData; // Real data to use when dummy is false
  showGauge?: boolean; // If true, show radial gauge; defaults to true
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

// Helper function to get title and subtitle based on type
function getViewLabels(type?: DetailViewType): { title: string; subtitle: string } {
  switch (type) {
    case 'biodiversity':
      return { title: 'Biodiversity Credits Details', subtitle: 'Credits Analysis' };
    case 'income':
      return { title: 'Income Details', subtitle: 'Revenue Analysis' };
    case 'reliability':
    default:
      return { title: 'Reliability Score Details', subtitle: 'Performance Analysis' };
  }
}

// Generate dummy data based on type
function generateDummyData(value: number, type?: DetailViewType): DetailViewData {
  switch (type) {
    case 'biodiversity':
      // Biodiversity credits: larger values, monthly trend
      return {
        trendData: Array.from({ length: 12 }, (_, i) => {
          const baseGrowth = value * (0.85 + (i * 0.025)); // Gradual growth over months
          const noise = (Math.random() - 0.5) * (value * 0.1);
          return Math.round(Math.max(0, baseGrowth + noise));
        }),
        peakValue: Math.round(value * 1.15),
        avgValue: Math.round(value * 0.88),
        peakLabel: 'Peak Credits (30d)',
        avgLabel: 'Average Credits',
        peakTrend: 15,
        avgTrend: -12,
      };
    case 'income':
      // Income: currency values with monthly variations
      return {
        trendData: Array.from({ length: 12 }, (_, i) => {
          const seasonalFactor = 1 + 0.1 * Math.sin((i / 12) * Math.PI * 2); // Seasonal variation
          const baseValue = value * seasonalFactor;
          const noise = (Math.random() - 0.5) * (value * 0.15);
          return Math.round(Math.max(0, baseValue + noise));
        }),
        peakValue: Math.round(value * 1.18),
        avgValue: Math.round(value * 0.91),
        peakLabel: 'Peak Income (30d)',
        avgLabel: 'Average Income',
        peakTrend: 18,
        avgTrend: -9,
      };
    case 'reliability':
    default:
      // Reliability score: percentage-based (0-100)
      return {
        trendData: Array.from({ length: 12 }, (_, i) => {
          const noise = (Math.random() - 0.5) * 30;
          return Math.max(0, Math.min(100, value + noise));
        }),
        peakValue: Math.min(100, Math.round(value * 1.12)),
        avgValue: Math.round(value * 0.92),
        peakLabel: 'Peak Score (24h)',
        avgLabel: 'Average Score',
        peakTrend: 12,
        avgTrend: -8,
      };
  }
}

export function DetailView({ isOpen, onClose, value, symbol, targets, type = 'reliability', dummy = true, data, showGauge = true }: DetailViewProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Use provided data or generate dummy data
  const viewData = useMemo(() => {
    if (!dummy && data) {
      return data;
    }
    return generateDummyData(value, type);
  }, [dummy, data, value, type]);

  const { title, subtitle } = getViewLabels(type);
  const { trendData, peakValue, avgValue, peakLabel, avgLabel, peakTrend, avgTrend } = viewData;

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
                    {title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {subtitle}
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
                <div className={`grid grid-cols-1 ${showGauge ? 'lg:grid-cols-3' : ''} gap-8`}>
                  {/* Left Column: Gauge (optional) */}
                  {showGauge && (
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
                  )}

                  {/* Right Column: Visualizations Grid */}
                  <div className={`${showGauge ? 'lg:col-span-2' : ''} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                    {/* Stat Cards */}
                    <StatCard
                      label={peakLabel}
                      value={formatValue(peakValue, symbol)}
                      trend={peakTrend}
                      trendLabel="vs avg"
                    />
                    <StatCard
                      label={avgLabel}
                      value={formatValue(avgValue, symbol)}
                      trend={avgTrend}
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