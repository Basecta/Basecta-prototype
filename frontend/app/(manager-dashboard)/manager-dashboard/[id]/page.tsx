'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getManagerDashboard, getFarms } from '@/lib/api';
import { ManagerSectionCards } from '@/components/manager-section-cards';
import { ManagerChartArea } from '@/components/manager-chart-area';
import { FarmsDataTable } from '@/components/farms-data-table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface Farm {
  farm_id: string;
  farm_name: string;
  owner: string;
  location: string;
  natureCredits: number;
  income: number;
  reliabilityScore: number;
}

interface ManagerDashboardData {
  manager_dashboard_id: string;
  manager_dashboard_name: string;
  farm_ids: string[];
  total_nature_credits: number;
  total_income: number;
  avg_reliability: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateAvgNatureData(farms: Farm[]) {
  if (!farms.length) return months.map(month => ({ month, value: 0 }));
  const avg = farms.reduce((sum, f) => sum + f.natureCredits, 0) / farms.length;
  return months.map((month, i) => ({
    month,
    value: Math.round(avg * (0.85 + (i / 12) * 0.2) * (1 + Math.sin(i * 0.8) * 0.08)),
  }));
}

function generateAvgReliabilityData(farms: Farm[]) {
  if (!farms.length) return months.map(month => ({ month, value: 0 }));
  const avg = farms.reduce((sum, f) => sum + f.reliabilityScore, 0) / farms.length;
  return months.map((month, i) => ({
    month,
    value: Math.round(avg * (0.9 + (i / 12) * 0.15) * (1 + Math.cos(i * 0.6) * 0.05)),
  }));
}

function generateTotalIncomeData(farms: Farm[]) {
  if (!farms.length) return months.map(month => ({ month, value: 0 }));
  const total = farms.reduce((sum, f) => sum + f.income, 0);
  return months.map((month, i) => ({
    month,
    value: Math.round(total * (0.88 + (i / 12) * 0.18) * (1 + Math.sin(i * 0.7) * 0.06)),
  }));
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [dashboard, setDashboard] = useState<ManagerDashboardData | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const id = params.id as string;

    Promise.all([getManagerDashboard(id), getFarms()])
      .then(([md, allFarms]) => {
        if (!active) return;
        setDashboard(md);
        const farmIdSet = new Set<string>(md.farm_ids.map((fid: any) => String(fid)));
        setFarms(
          allFarms
            .filter((f: any) => farmIdSet.has(String(f.farm_id)))
            .map((f: any) => ({
              farm_id: String(f.farm_id),
              farm_name: f.farm_name,
              owner: '',
              location: f.location,
              natureCredits: f.nature_credits,
              income: f.income,
              reliabilityScore: f.reliability_score,
            }))
        );
      })
      .catch(() => { if (active) router.push('/hub'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id, router]);

  const totalCredits = useMemo(() => farms.reduce((sum, f) => sum + f.natureCredits, 0), [farms]);
  const totalRevenue = useMemo(() => farms.reduce((sum, f) => sum + f.income, 0), [farms]);
  const avgReliability = useMemo(() =>
    farms.length ? Math.round(farms.reduce((sum, f) => sum + f.reliabilityScore, 0) / farms.length) : 0,
    [farms]);

  const avgNatureData = useMemo(() => generateAvgNatureData(farms), [farms]);
  const avgReliabilityData = useMemo(() => generateAvgReliabilityData(farms), [farms]);
  const totalIncomeData = useMemo(() => generateTotalIncomeData(farms), [farms]);

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card className="ring-0 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-2xl">{dashboard.manager_dashboard_name}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ManagerSectionCards
        totalCredits={totalCredits}
        totalRevenue={totalRevenue}
        avgReliability={avgReliability}
        totalFarms={farms.length}
      />

      <ManagerChartArea
        avgBiodiversityData={avgNatureData}
        avgReliabilityData={avgReliabilityData}
        totalIncomeData={totalIncomeData}
      />

      <FarmsDataTable farms={farms} />
    </>
  );
}
