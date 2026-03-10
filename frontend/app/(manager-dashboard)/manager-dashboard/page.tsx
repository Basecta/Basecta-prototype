'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ManagerSectionCards } from '@/components/manager-section-cards';
import { ManagerChartArea } from '@/components/manager-chart-area';
import { FarmsDataTable } from '@/components/farms-data-table';

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

const managedFarms: Farm[] = [
  { id: '1', name: 'Green Valley Farm', owner: 'John Doe', location: 'County Cork, Ireland', biodiversityCredits: 1247, income: 2450, reliabilityScore: 58 },
  { id: '2', name: 'Sunrise Meadows', owner: "Mary O'Brien", location: 'County Kerry, Ireland', biodiversityCredits: 1823, income: 3120, reliabilityScore: 72 },
  { id: '3', name: 'Oakwood Estate', owner: 'Patrick Murphy', location: 'County Galway, Ireland', biodiversityCredits: 956, income: 1890, reliabilityScore: 45 },
  { id: '4', name: 'Riverside Ranch', owner: 'Siobhan Kelly', location: 'County Clare, Ireland', biodiversityCredits: 2105, income: 3650, reliabilityScore: 81 },
  { id: '5', name: 'Hillcrest Acres', owner: 'Declan Walsh', location: 'County Mayo, Ireland', biodiversityCredits: 1456, income: 2780, reliabilityScore: 63 },
  { id: '6', name: 'Clover Fields', owner: 'Aoife Brennan', location: 'County Limerick, Ireland', biodiversityCredits: 1678, income: 2950, reliabilityScore: 69 },
  { id: '7', name: 'Stonegate Farm', owner: "Liam O'Sullivan", location: 'County Tipperary, Ireland', biodiversityCredits: 892, income: 1650, reliabilityScore: 38 },
  { id: '8', name: 'Willow Brook', owner: 'Niamh Fitzgerald', location: 'County Waterford, Ireland', biodiversityCredits: 1934, income: 3340, reliabilityScore: 76 },
  { id: '9', name: 'Golden Harvest', owner: 'Sean McCarthy', location: 'County Wexford, Ireland', biodiversityCredits: 2256, income: 3890, reliabilityScore: 85 },
  { id: '10', name: 'Meadow View', owner: 'Ciara Doyle', location: 'County Kilkenny, Ireland', biodiversityCredits: 1123, income: 2180, reliabilityScore: 52 },
  { id: '11', name: 'Thornwood Farm', owner: 'Conor Ryan', location: 'County Carlow, Ireland', biodiversityCredits: 1567, income: 2890, reliabilityScore: 67 },
  { id: '12', name: 'Silver Lake Estate', owner: 'Orla Nolan', location: 'County Sligo, Ireland', biodiversityCredits: 1789, income: 3100, reliabilityScore: 74 },
  { id: '13', name: 'Pinewood Pastures', owner: 'Eoin Connolly', location: 'County Roscommon, Ireland', biodiversityCredits: 1045, income: 1980, reliabilityScore: 48 },
  { id: '14', name: 'Hazelnut Grove', owner: 'Saoirse Quinn', location: 'County Leitrim, Ireland', biodiversityCredits: 1398, income: 2560, reliabilityScore: 61 },
  { id: '15', name: 'Emerald Fields', owner: 'Cillian Burke', location: 'County Donegal, Ireland', biodiversityCredits: 2034, income: 3480, reliabilityScore: 79 },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const generateAvgBiodiversityData = () => {
  const avgCredits = managedFarms.reduce((sum, f) => sum + f.biodiversityCredits, 0) / managedFarms.length;
  return months.map((month, index) => ({
    month,
    value: Math.round(avgCredits * (0.85 + (index / 12) * 0.2) * (1 + Math.sin(index * 0.8) * 0.08)),
  }));
};

const generateAvgReliabilityData = () => {
  const avgReliability = managedFarms.reduce((sum, f) => sum + f.reliabilityScore, 0) / managedFarms.length;
  return months.map((month, index) => ({
    month,
    value: Math.round(avgReliability * (0.9 + (index / 12) * 0.15) * (1 + Math.cos(index * 0.6) * 0.05)),
  }));
};

const generateTotalIncomeData = () => {
  const totalIncome = managedFarms.reduce((sum, f) => sum + f.income, 0);
  return months.map((month, index) => ({
    month,
    value: Math.round(totalIncome * (0.88 + (index / 12) * 0.18) * (1 + Math.sin(index * 0.7) * 0.06)),
  }));
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const totalCredits = useMemo(() =>
    managedFarms.reduce((sum, farm) => sum + farm.biodiversityCredits, 0), []);

  const totalRevenue = useMemo(() =>
    managedFarms.reduce((sum, farm) => sum + farm.income, 0), []);

  const avgReliability = useMemo(() =>
    Math.round(managedFarms.reduce((sum, farm) => sum + farm.reliabilityScore, 0) / managedFarms.length), []);

  const avgBiodiversityData = useMemo(() => generateAvgBiodiversityData(), []);
  const avgReliabilityData = useMemo(() => generateAvgReliabilityData(), []);
  const totalIncomeData = useMemo(() => generateTotalIncomeData(), []);

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
      <ManagerSectionCards
        totalCredits={totalCredits}
        totalRevenue={totalRevenue}
        avgReliability={avgReliability}
        totalFarms={managedFarms.length}
      />

      <ManagerChartArea
        avgBiodiversityData={avgBiodiversityData}
        avgReliabilityData={avgReliabilityData}
        totalIncomeData={totalIncomeData}
      />

      <FarmsDataTable farms={managedFarms} />
    </>
  );
}
