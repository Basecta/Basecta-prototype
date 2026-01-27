'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// Define the data structure types
interface MonthlyDataPoint {
  month: string;
  value: number;
  current?: boolean;
  future?: boolean;
}

interface DetailData {
  trendData: number[];
  peakValue: number;
  avgValue: number;
  peakLabel: string;
  avgLabel: string;
  peakTrend: number;
  avgTrend: number;
}

interface DashboardData {
  biodiversityCredits: number;
  income: number;
  reliabilityScore: number;
  biodiversityData: MonthlyDataPoint[];
  incomeData: MonthlyDataPoint[];
  reliabilityData: MonthlyDataPoint[];
  biodiversityDetailData: DetailData;
}

type UploadCategory = 'hedgerows' | 'waterways' | 'soil';

interface UploadedCategories {
  hedgerows: boolean;
  waterways: boolean;
  soil: boolean;
}

// Base data values
const baseData = {
  biodiversityCredits: 1247,
  income: 2450,
  reliabilityScore: 58,
  biodiversityTrend: [1000, 1050, 1100, 1120, 1180, 1200, 1220, 1247, 1280, 1300, 1320, 1350],
  peakValue: 1350,
  avgValue: 1180,
  peakTrend: 15,
  avgTrend: -12,
};

// Incremental changes per category
const categoryIncrements = {
  hedgerows: {
    biodiversityCredits: 280,
    income: 320,
    reliabilityScore: 12,
    trendMultiplier: 1.15,
    peakBonus: 180,
    avgBonus: 120,
    peakTrendBonus: 4,
    avgTrendBonus: 5,
  },
  waterways: {
    biodiversityCredits: 195,
    income: 240,
    reliabilityScore: 12,
    trendMultiplier: 1.10,
    peakBonus: 140,
    avgBonus: 100,
    peakTrendBonus: 3,
    avgTrendBonus: 4,
  },
  soil: {
    biodiversityCredits: 170,
    income: 170,
    reliabilityScore: 12,
    trendMultiplier: 1.08,
    peakBonus: 130,
    avgBonus: 80,
    peakTrendBonus: 2,
    avgTrendBonus: 3,
  },
};

// Helper to generate monthly data with proper flags
function generateMonthlyData(baseValues: number[], offset: number): MonthlyDataPoint[] {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  return months.map((month, index) => ({
    month,
    value: Math.round(baseValues[index] + offset),
    ...(index === 3 ? { current: true } : {}),
    ...(index > 3 ? { future: true } : {}),
  }));
}

// Calculate dashboard data based on uploaded categories
function calculateDashboardData(uploaded: UploadedCategories): DashboardData {
  let biodiversityCredits = baseData.biodiversityCredits;
  let income = baseData.income;
  let reliabilityScore = baseData.reliabilityScore;
  let trendMultiplier = 1;
  let peakValue = baseData.peakValue;
  let avgValue = baseData.avgValue;
  let peakTrend = baseData.peakTrend;
  let avgTrend = baseData.avgTrend;

  // Apply increments for each uploaded category
  const categories: UploadCategory[] = ['hedgerows', 'waterways', 'soil'];
  for (const category of categories) {
    if (uploaded[category]) {
      const inc = categoryIncrements[category];
      biodiversityCredits += inc.biodiversityCredits;
      income += inc.income;
      reliabilityScore += inc.reliabilityScore;
      trendMultiplier *= inc.trendMultiplier;
      peakValue += inc.peakBonus;
      avgValue += inc.avgBonus;
      peakTrend += inc.peakTrendBonus;
      avgTrend += inc.avgTrendBonus;
    }
  }

  // Cap reliability score at 100
  reliabilityScore = Math.min(reliabilityScore, 100);

  // Generate scaled trend data
  const scaledTrendData = baseData.biodiversityTrend.map(v =>
    Math.round(v * trendMultiplier)
  );

  // Base monthly values for charts
  const biodiversityBase = [1050, 1120, 1180, 1247, 1310, 1380];
  const incomeBase = [2100, 2250, 2350, 2450, 2580, 2700];
  const reliabilityBase = [52, 55, 56, 58, 60, 62];

  // Calculate offsets
  const bioOffset = biodiversityCredits - baseData.biodiversityCredits;
  const incOffset = income - baseData.income;
  const relOffset = reliabilityScore - baseData.reliabilityScore;

  return {
    biodiversityCredits,
    income,
    reliabilityScore,
    biodiversityData: generateMonthlyData(biodiversityBase, bioOffset),
    incomeData: generateMonthlyData(incomeBase, incOffset),
    reliabilityData: generateMonthlyData(reliabilityBase, relOffset),
    biodiversityDetailData: {
      trendData: scaledTrendData,
      peakValue,
      avgValue,
      peakLabel: 'Peak Credits (30d)',
      avgLabel: 'Average Credits',
      peakTrend,
      avgTrend,
    },
  };
}

interface DataContextType {
  dashboardData: DashboardData;
  uploadedCategories: UploadedCategories;
  triggerCategoryUpload: (category: UploadCategory) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [uploadedCategories, setUploadedCategories] = useState<UploadedCategories>({
    hedgerows: false,
    waterways: false,
    soil: false,
  });

  const triggerCategoryUpload = (category: UploadCategory) => {
    setUploadedCategories(prev => ({
      ...prev,
      [category]: true,
    }));
  };

  const resetData = () => {
    setUploadedCategories({
      hedgerows: false,
      waterways: false,
      soil: false,
    });
  };

  const dashboardData = useMemo(
    () => calculateDashboardData(uploadedCategories),
    [uploadedCategories]
  );

  return (
    <DataContext.Provider value={{ dashboardData, uploadedCategories, triggerCategoryUpload, resetData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
