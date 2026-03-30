'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';

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
  natureData: MonthlyDataPoint[];
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

// Static bases used for chart shape — offsets are applied from the DB values
const BIODIVERSITY_BASE_VALUE = 1247;
const INCOME_BASE_VALUE = 2450;
const RELIABILITY_BASE_VALUE = 58;

const biodiversityMonthlyBase = [1050, 1120, 1180, 1247, 1310, 1380];
const incomeMonthlyBase = [2100, 2250, 2350, 2450, 2580, 2700];
const reliabilityMonthlyBase = [52, 55, 56, 58, 60, 62];
const trendBase = [1000, 1050, 1100, 1120, 1180, 1200, 1220, 1247, 1280, 1300, 1320, 1350];

function generateMonthlyData(baseValues: number[], offset: number): MonthlyDataPoint[] {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  return months.map((month, index) => ({
    month,
    value: Math.round(baseValues[index] + offset),
    ...(index === 3 ? { current: true } : {}),
    ...(index > 3 ? { future: true } : {}),
  }));
}

function buildDashboardData(
  biodiversityCredits: number,
  income: number,
  reliabilityScore: number,
): DashboardData {
  const bioOffset = biodiversityCredits - BIODIVERSITY_BASE_VALUE;
  const incOffset = income - INCOME_BASE_VALUE;
  const relOffset = reliabilityScore - RELIABILITY_BASE_VALUE;

  return {
    biodiversityCredits,
    income,
    reliabilityScore,
    natureData: generateMonthlyData(biodiversityMonthlyBase, bioOffset),
    incomeData: generateMonthlyData(incomeMonthlyBase, incOffset),
    reliabilityData: generateMonthlyData(reliabilityMonthlyBase, relOffset),
    biodiversityDetailData: {
      trendData: trendBase.map(v => Math.round(v + bioOffset)),
      peakValue: 1350 + bioOffset,
      avgValue: 1180 + bioOffset,
      peakLabel: 'Peak Credits (30d)',
      avgLabel: 'Average Credits',
      peakTrend: 15,
      avgTrend: -12,
    },
  };
}

const defaultDashboardData = buildDashboardData(
  BIODIVERSITY_BASE_VALUE,
  INCOME_BASE_VALUE,
  RELIABILITY_BASE_VALUE,
);

interface DataContextType {
  dashboardData: DashboardData;
  uploadedCategories: UploadedCategories;
  triggerCategoryUpload: (category: UploadCategory) => void;
  resetData: () => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dashboardData] = useState<DashboardData>(defaultDashboardData);
  const [isLoading] = useState(false);
  const [uploadedCategories, setUploadedCategories] = useState<UploadedCategories>({
    hedgerows: false,
    waterways: false,
    soil: false,
  });

  const triggerCategoryUpload = (category: UploadCategory) => {
    setUploadedCategories(prev => ({ ...prev, [category]: true }));
  };

  const resetData = () => {
    setUploadedCategories({ hedgerows: false, waterways: false, soil: false });
  };

  return (
    <DataContext.Provider value={{ dashboardData, uploadedCategories, triggerCategoryUpload, resetData, isLoading }}>
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
