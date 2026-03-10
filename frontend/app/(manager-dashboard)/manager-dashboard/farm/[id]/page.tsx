'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MapWrapper from '@/app/components/MapWrapper';
import { RadialGauge } from '@/app/components/RadialGauge';
import { DetailView } from '@/app/components/DetailView';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, MapPinIcon, TrendingUpIcon } from 'lucide-react';

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
  return months.map((month, index) => {
    const randomVariance = 1 + (Math.random() - 0.5) * variance * 2;
    const trendFactor = 0.85 + (index / months.length) * 0.2;
    return {
      month,
      value: Math.round(currentValue * trendFactor * randomVariance),
      current: index === currentMonth,
      future: index > currentMonth,
    };
  });
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
    const farmInfo = farmsData[farmId];
    if (!farmInfo) return null;
    return {
      biodiversityCredits: farmInfo.biodiversityCredits,
      income: farmInfo.income,
      reliabilityScore: farmInfo.reliabilityScore,
      biodiversityData: generateTrendData(farmInfo.biodiversityCredits, 0.08),
      incomeData: generateTrendData(farmInfo.income, 0.1),
      reliabilityData: generateTrendData(farmInfo.reliabilityScore, 0.05),
    };
  }, [farmId]);

  const biodiversityCredits = farmData?.biodiversityCredits ?? 0;
  const income = farmData?.income ?? 0;
  const gaugeValue = farmData?.reliabilityScore ?? 0;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/manager-login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'manager') {
      router.push('/manager-login');
      return;
    }

    setUser(parsedUser);

    const farmData = farmsData[farmId];
    if (!farmData) {
      router.push('/manager-dashboard');
      return;
    }
    setFarm(farmData);
  }, [router, farmId]);

  if (!user || !farm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Farm Header */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon" render={<Link href="/manager-dashboard" />}>
                <ArrowLeftIcon className="size-4" />
              </Button>
              <CardTitle className="text-2xl">{farm.name}</CardTitle>
            </div>
            <CardDescription className="flex items-center gap-4">
              <span>Owner: {farm.owner}</span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" />
                {farm.location}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Map Section */}
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setIsBiodiversityDetailOpen(true)}
        >
          <CardHeader>
            <CardDescription>Biodiversity Credits</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {biodiversityCredits.toLocaleString()}
            </CardTitle>
            <Badge variant="outline">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setIsIncomeDetailOpen(true)}
        >
          <CardHeader>
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              &euro;{income.toLocaleString()}
            </CardTitle>
            <Badge variant="outline">
              <TrendingUpIcon className="size-3" />
              +8.2%
            </Badge>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setIsReliabilityDetailOpen(true)}
        >
          <CardHeader>
            <CardDescription>Reliability Score</CardDescription>
            <div className="flex items-center justify-center py-4">
              <RadialGauge
                value={gaugeValue}
                size={160}
                strokeWidth={5}
                symbol='%'
              />
            </div>
          </CardHeader>
        </Card>
      </div>

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
