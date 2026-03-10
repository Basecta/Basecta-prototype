'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import { UserSectionCards } from '@/components/user-section-cards';
import { UserChartArea } from '@/components/user-chart-area';
import MapWrapper from '@/app/components/MapWrapper';
import { DetailView } from '@/app/components/DetailView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { dashboardData, uploadedCategories } = useData();
  const [user, setUser] = useState<any>(null);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  const {
    biodiversityCredits,
    income,
    reliabilityScore: gaugeValue,
    biodiversityData,
    incomeData,
    reliabilityData,
    biodiversityDetailData,
  } = dashboardData;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <UserSectionCards
        biodiversityCredits={biodiversityCredits}
        income={income}
        reliabilityScore={gaugeValue}
        uploadedCategories={uploadedCategories}
      />

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
              <MapWrapper
                imageUrl="/farm-orthophoto.png"
                boundsUrl="/farm-orthophoto-bounds.json"
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <UserChartArea
        biodiversityData={biodiversityData}
        incomeData={incomeData}
        reliabilityData={reliabilityData}
      />

      {/* Detail View Modals */}
      <DetailView
        isOpen={isReliabilityDetailOpen}
        onClose={() => setIsReliabilityDetailOpen(false)}
        value={gaugeValue}
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
        value={biodiversityCredits}
        type='biodiversity'
        dummy={false}
        showGauge={false}
        data={biodiversityDetailData}
      />

      <DetailView
        isOpen={isIncomeDetailOpen}
        onClose={() => setIsIncomeDetailOpen(false)}
        value={income}
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
