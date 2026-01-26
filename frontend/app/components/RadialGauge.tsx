'use client';

import React, { useEffect, useState } from 'react';

interface RadialGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  symbol?: string; // e.g., '%' (suffix), '€' (prefix), or undefined (no symbol)
}

// Helper function to check if symbol is a prefix (currency)
function isPrefixSymbol(symbol?: string): boolean {
  if (!symbol) return false;
  const prefixSymbols = ['€', '$', '£', '¥', '₹'];
  return prefixSymbols.includes(symbol);
}

export function RadialGauge({
  value,
  size = 240,
  strokeWidth = 3,
  onClick,
  symbol,
}: RadialGaugeProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  // Geometry calculations
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  // Number animation state
  const [displayValue, setDisplayValue] = useState(clampedValue);

  useEffect(() => {
    // Simple animation loop for the number to match the visual transition roughly
    let startTimestamp: number | null = null;
    const duration = 800; // Match CSS transition
    const startValue = displayValue;
    const endValue = clampedValue;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Ease-in-out cubic function
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const current = startValue + (endValue - startValue) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animationId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationId);
  }, [clampedValue]);

  // Color based on value (matching existing dashboard colors)
  const getGaugeColor = (val: number) => {
    if (val >= 70) return '#77E6B4';
    if (val >= 30) return '#FFD221';
    return '#FF5353';
  };

  const gaugeColor = getGaugeColor(clampedValue);

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none group"
      style={{
        width: size,
        height: size,
      }}
      onClick={onClick}
      role="button"
      aria-label={`Gauge showing ${Math.round(displayValue)} percent. Click to view details.`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-transform duration-500"
      >
        {/* Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-[800ms] ease-in-out"
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl" style={{ color: '#030404' }}>
          {isPrefixSymbol(symbol) && (
            <span className="text-2xl text-gray-400 mr-0.5">{symbol}</span>
          )}
          {Math.round(displayValue)}
          {symbol && !isPrefixSymbol(symbol) && (
            <span className="text-2xl text-gray-400 ml-0.5">{symbol}</span>
          )}
        </span>
      </div>
    </div>
  );
}
