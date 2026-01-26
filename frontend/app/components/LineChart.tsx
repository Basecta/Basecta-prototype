'use client';
import React from 'react';

interface LineChartProps {
  data: number[];
  height?: number;
  color?: string;
}

export function LineChart({
  data,
  height = 120,
  color = '#77E6B4',
}: LineChartProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Add some padding to the range so points aren't on the very edge
  const padding = range * 0.1;
  const plotMin = min - padding;
  const plotMax = max + padding;
  const plotRange = plotMax - plotMin;

  const width = 100; // percentages
  const step = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * step;
      // Invert Y because SVG coordinates go down
      const y = 100 - ((val - plotMin) / plotRange) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  // Generate month labels for the last 12 months ending in January
  const monthNames = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-sm font-medium text-gray-500">12-Month Trend</h3>
        <span className="text-xs text-gray-400">Last 12 Months</span>
      </div>
      <div className="relative flex-1 w-full" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="0"
            stroke="#f3f4f6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="#f3f4f6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="100"
            stroke="#f3f4f6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {/* Trend line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {/* X-axis month labels */}
      <div className="flex justify-between mt-2">
        {monthNames.map((month, i) => (
          <span
            key={month + i}
            className="text-sm font-medium text-gray-500"
            style={{ width: `${100 / monthNames.length}%`, textAlign: 'center' }}
          >
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}