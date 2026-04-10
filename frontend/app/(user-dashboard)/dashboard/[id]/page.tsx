'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFarmById } from '@/lib/api';
import { initAuth } from '@/lib/auth-store';
import { UserSectionCards } from '@/components/user-section-cards';
import { UserChartArea } from '@/components/user-chart-area';
import { DetailView } from '@/app/components/DetailView';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPinIcon } from 'lucide-react';

interface FarmData {
  id: string;
  farm_name: string;
  farm_dashboard_name: string;
  location: string;
  nature_credits: number;
  income: number;
  reliability_score: number;
}

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
const BIO_BASE   = [1050, 1120, 1180, 1247, 1310, 1380];
const INC_BASE   = [2100, 2250, 2350, 2450, 2580, 2700];
const REL_BASE   = [52,   55,   56,   58,   60,   62  ];
const TREND_BASE = [1000, 1050, 1100, 1120, 1180, 1200, 1220, 1247, 1280, 1300, 1320, 1350];

function makeMonthly(base: number[], offset: number) {
  return MONTHS.map((month, i) => ({
    month,
    value: Math.round(base[i] + offset),
    ...(i === 3 ? { current: true } : {}),
    ...(i > 3 ? { future: true } : {}),
  }));
}

function buildChartData(farm: FarmData) {
  const bioOff = farm.nature_credits  - 1247;
  const incOff = farm.income - 2450;
  const relOff = farm.reliability_score - 58;
  return {
    natureData: makeMonthly(BIO_BASE, bioOff),
    incomeData:        makeMonthly(INC_BASE, incOff),
    reliabilityData:   makeMonthly(REL_BASE, relOff),
    biodiversityDetailData: {
      trendData:  TREND_BASE.map(v => Math.round(v + bioOff)),
      peakValue:  1350 + bioOff,
      avgValue:   1180 + bioOff,
      peakLabel:  'Peak Credits (30d)',
      avgLabel:   'Average Credits',
      peakTrend:  15,
      avgTrend:   -12,
    },
  };
}

export default function FarmDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [farm, setFarm] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const token = await initAuth();
      if (!token) { router.push('/login'); return; }

      getFarmById(params.id as string)
        .then(data => { if (active) setFarm(data); })
        .catch(() => { if (active) router.push('/hub'); })
        .finally(() => { if (active) setLoading(false); });
    };
    init();
    return () => { active = false; };
  }, [params.id, router]);

  if (loading || !farm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const { natureData, incomeData, reliabilityData, biodiversityDetailData } = buildChartData(farm);
  const noUploads = { hedgerows: false, waterways: false, soil: false };

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card className="ring-0 border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-2xl">{farm.farm_dashboard_name}</CardTitle>
            <CardDescription className="flex flex-col gap-1">
              {farm.farm_dashboard_name !== farm.farm_name && (
                <span>{farm.farm_name}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {farm.location}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <UserSectionCards
        natureCredits={farm.nature_credits}
        income={farm.income}
        reliabilityScore={farm.reliability_score}
        uploadedCategories={noUploads}
      />

      <UserChartArea
        natureData={natureData}
        incomeData={incomeData}
        reliabilityData={reliabilityData}
      />

      <DetailView
        isOpen={isReliabilityDetailOpen}
        onClose={() => setIsReliabilityDetailOpen(false)}
        value={farm.reliability_score}
        symbol='%'
        type='reliability'
        dummy={true}
        targets={[
          { label: 'Optimal', value: 70 },
          { label: 'Good Threshold', value: 50 },
          { label: 'Fair Threshold', value: 30 },
        ]}
      />

      <DetailView
        isOpen={isBiodiversityDetailOpen}
        onClose={() => setIsBiodiversityDetailOpen(false)}
        value={farm.nature_credits}
        type='biodiversity'
        dummy={false}
        showGauge={false}
        data={biodiversityDetailData}
      />

      <DetailView
        isOpen={isIncomeDetailOpen}
        onClose={() => setIsIncomeDetailOpen(false)}
        value={farm.income}
        symbol='€'
        type='income'
        dummy={true}
        showGauge={false}
        targets={[
          { label: 'Target', value: 4000 },
          { label: 'Good Threshold', value: 2500 },
          { label: 'Minimum', value: 1500 },
        ]}
      />
    </>
  );
}
