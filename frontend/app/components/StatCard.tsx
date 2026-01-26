'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number; // percentage change
  trendLabel?: string;
}

export function StatCard({ label, value, trend, trendLabel }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-light text-gray-900 tracking-tight tabular-nums">
          {value}
        </span>
        {trend !== undefined && (
          <div
            className={`flex items-center text-sm font-medium ${
              isPositive
                ? 'text-emerald-600'
                : isNegative
                ? 'text-rose-600'
                : 'text-gray-500'
            }`}
          >
            {isPositive ? (
              <ArrowUp className="w-4 h-4 mr-1" />
            ) : isNegative ? (
              <ArrowDown className="w-4 h-4 mr-1" />
            ) : (
              <Minus className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend)}%
            {trendLabel && (
              <span className="ml-1 text-gray-400 font-normal">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
