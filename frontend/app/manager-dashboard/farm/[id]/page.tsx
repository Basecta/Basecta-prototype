'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MapWrapper from '@/app/components/MapWrapper';
import { RadialGauge } from '@/app/components/RadialGauge';
import { DetailView } from '@/app/components/DetailView';
import { Navbar } from '@/app/components/Navbar';
import { PageLayout } from '@/app/components/PageLayout';
import { MetricCard } from '@/app/components/MetricCard';
import { SectionCard } from '@/app/components/SectionCard';
import { LoadingScreen } from '@/app/components/LoadingScreen';

interface User {
  username: string;
  email: string;
  role?: string;
}

interface Farm {
  id: string;
  name: string;
  owner: string;
  location: string;
  biodiversityCredits: number;
  income: number;
  reliabilityScore: number;
}

const generateTrendData = (currentValue: number, variance: number = 0.1) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  return months.map((month, index) => ({
    month,
    value: Math.round(currentValue * (0.85 + (index / months.length) * 0.2) * (1 + (Math.random() - 0.5) * variance * 2)),
    current: index === currentMonth,
    future: index > currentMonth,
  }));
};

const generateBiodiversityDetailData = (credits: number) => {
  const m = credits / 1247;
  return {
    hedgerows: {
      length: Math.round(2.4 * m * 10) / 10,
      species: Math.round(12 * m),
      health: Math.min(95, Math.round(78 * (0.9 + m * 0.2))),
    },
    waterways: {
      length: Math.round(1.8 * m * 10) / 10,
      quality: Math.min(100, Math.round(82 * (0.9 + m * 0.15))),
      biodiversityIndex: Math.round(7.2 * m * 10) / 10,
    },
    soil: {
      organicMatter: Math.round(4.2 * m * 10) / 10,
      microbialActivity: Math.min(100, Math.round(68 * (0.85 + m * 0.2))),
      carbonSequestration: Math.round(12.5 * m * 10) / 10,
    },
  };
};

const farmsData: Record<string, Farm> = {
  '1': { id: '1', name: 'Green Valley Farm', owner: 'John Doe', location: 'County Cork, Ireland', biodiversityCredits: 1247, income: 2450, reliabilityScore: 58 },
  '2': { id: '2', name: 'Sunrise Meadows', owner: "Mary O'Brien", location: 'County Kerry, Ireland', biodiversityCredits: 1823, income: 3120, reliabilityScore: 72 },
  '3': { id: '3', name: 'Oakwood Estate', owner: 'Patrick Murphy', location: 'County Galway, Ireland', biodiversityCredits: 956, income: 1890, reliabilityScore: 45 },
  '4': { id: '4', name: 'Riverside Ranch', owner: 'Siobhan Kelly', location: 'County Clare, Ireland', biodiversityCredits: 2105, income: 3650, reliabilityScore: 81 },
  '5': { id: '5', name: 'Hillcrest Acres', owner: 'Declan Walsh', location: 'County Mayo, Ireland', biodiversityCredits: 1456, income: 2780, reliabilityScore: 63 },
  '6': { id: '6', name: 'Clover Fields', owner: 'Aoife Brennan', location: 'County Limerick, Ireland', biodiversityCredits: 1678, income: 2950, reliabilityScore: 69 },
  '7': { id: '7', name: 'Stonegate Farm', owner: "Liam O'Sullivan", location: 'County Tipperary, Ireland', biodiversityCredits: 892, income: 1650, reliabilityScore: 38 },
  '8': { id: '8', name: 'Willow Brook', owner: 'Niamh Fitzgerald', location: 'County Waterford, Ireland', biodiversityCredits: 1934, income: 3340, reliabilityScore: 76 },
  '9': { id: '9', name: 'Golden Harvest', owner: 'Sean McCarthy', location: 'County Wexford, Ireland', biodiversityCredits: 2256, income: 3890, reliabilityScore: 85 },
  '10': { id: '10', name: 'Meadow View', owner: 'Ciara Doyle', location: 'County Kilkenny, Ireland', biodiversityCredits: 1123, income: 2180, reliabilityScore: 52 },
  '11': { id: '11', name: 'Thornwood Farm', owner: 'Conor Ryan', location: 'County Carlow, Ireland', biodiversityCredits: 1567, income: 2890, reliabilityScore: 67 },
  '12': { id: '12', name: 'Silver Lake Estate', owner: 'Orla Nolan', location: 'County Sligo, Ireland', biodiversityCredits: 1789, income: 3100, reliabilityScore: 74 },
  '13': { id: '13', name: 'Pinewood Pastures', owner: 'Eoin Connolly', location: 'County Roscommon, Ireland', biodiversityCredits: 1045, income: 1980, reliabilityScore: 48 },
  '14': { id: '14', name: 'Hazelnut Grove', owner: 'Saoirse Quinn', location: 'County Leitrim, Ireland', biodiversityCredits: 1398, income: 2560, reliabilityScore: 61 },
  '15': { id: '15', name: 'Emerald Fields', owner: 'Cillian Burke', location: 'County Donegal, Ireland', biodiversityCredits: 2034, income: 3480, reliabilityScore: 79 },
};

export default function FarmDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  const farmData = useMemo(() => {
    const info = farmsData[farmId];
    if (!info) return null;
    return {
      biodiversityCredits: info.biodiversityCredits,
      income: info.income,
      reliabilityScore: info.reliabilityScore,
      biodiversityDetailData: generateBiodiversityDetailData(info.biodiversityCredits),
    };
  }, [farmId]);

  const biodiversityCredits = farmData?.biodiversityCredits ?? 0;
  const income = farmData?.income ?? 0;
  const gaugeValue = farmData?.reliabilityScore ?? 0;
  const biodiversityDetailData = farmData?.biodiversityDetailData ?? null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'manager') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);

    const farmInfo = farmsData[farmId];
    if (!farmInfo) {
      router.push('/manager-dashboard');
      return;
    }
    setFarm(farmInfo);
  }, [router, farmId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user || !farm) return <LoadingScreen variant="emerald" />;

  return (
    <PageLayout variant="emerald">
      <Navbar
        title="Farm Details"
        backHref="/manager-dashboard"
        menuItems={[
          { label: 'Back to Farms', href: '/manager-dashboard' },
          { label: 'Logout', onClick: handleLogout, danger: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Farm Header */}
        <SectionCard className="mb-6" padding="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{farm.name}</h2>
          <div className="flex items-center gap-4 text-gray-600">
            <span>Owner: {farm.owner}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {farm.location}
            </span>
          </div>
        </SectionCard>

        {/* Map */}
        <SectionCard className="mb-6 overflow-hidden">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Farm Overview</h3>
          <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
            <MapWrapper
              imageUrl="/farm-orthophoto.png"
              boundsUrl="/farm-orthophoto-bounds.json"
              className="w-full h-full"
            />
          </div>
        </SectionCard>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Biodiversity Credits" onClick={() => setIsBiodiversityDetailOpen(true)}>
            <div className="flex items-center gap-3">
              <span className="text-4xl" style={{ color: '#050d0a' }}>{biodiversityCredits.toLocaleString()}</span>
              <svg className="w-8 h-8" style={{ color: '#10B981' }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </MetricCard>

          <MetricCard title="Income" onClick={() => setIsIncomeDetailOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline">
                <span className="text-4xl" style={{ color: '#030404' }}>€{income.toLocaleString()}</span>
                <span className="text-xl text-gray-500 ml-1">/month</span>
              </div>
              <svg className="w-8 h-8" style={{ color: '#10B981' }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </MetricCard>

          <MetricCard title="Reliability Score" onClick={() => setIsReliabilityDetailOpen(true)}>
            <RadialGauge value={gaugeValue} size={192} strokeWidth={5} symbol="%" />
          </MetricCard>
        </div>

        <DetailView
          isOpen={isReliabilityDetailOpen}
          onClose={() => setIsReliabilityDetailOpen(false)}
          value={gaugeValue}
          symbol="%"
          type="reliability"
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
          type="biodiversity"
          dummy={true}
          showGauge={false}
          targets={[
            { label: 'Target', value: 2500 },
            { label: 'Good Threshold', value: 1500 },
            { label: 'Minimum', value: 1000 },
          ]}
        />

        <DetailView
          isOpen={isIncomeDetailOpen}
          onClose={() => setIsIncomeDetailOpen(false)}
          value={income}
          symbol="€"
          type="income"
          dummy={true}
          showGauge={false}
          targets={[
            { label: 'Target', value: 4000 },
            { label: 'Good Threshold', value: 2500 },
            { label: 'Minimum', value: 1500 },
          ]}
        />
      </div>
    </PageLayout>
  );
}
