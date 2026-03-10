'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Navbar } from '../components/Navbar';
import { PageLayout } from '../components/PageLayout';
import { SectionCard } from '../components/SectionCard';
import { LoadingScreen } from '../components/LoadingScreen';

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

// Demo data - 15 farms
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
  const avg = managedFarms.reduce((s, f) => s + f.biodiversityCredits, 0) / managedFarms.length;
  return months.map((month, i) => ({
    month,
    value: Math.round(avg * (0.85 + (i / 12) * 0.2) * (1 + Math.sin(i * 0.8) * 0.08)),
  }));
};

const generateAvgReliabilityData = () => {
  const avg = managedFarms.reduce((s, f) => s + f.reliabilityScore, 0) / managedFarms.length;
  return months.map((month, i) => ({
    month,
    value: Math.round(avg * (0.9 + (i / 12) * 0.15) * (1 + Math.cos(i * 0.6) * 0.05)),
  }));
};

const generateTotalIncomeData = () => {
  const total = managedFarms.reduce((s, f) => s + f.income, 0);
  return months.map((month, i) => ({
    month,
    value: Math.round(total * (0.88 + (i / 12) * 0.18) * (1 + Math.sin(i * 0.7) * 0.06)),
  }));
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const totalCredits = useMemo(() => managedFarms.reduce((s, f) => s + f.biodiversityCredits, 0), []);
  const totalRevenue = useMemo(() => managedFarms.reduce((s, f) => s + f.income, 0), []);
  const avgBiodiversity = useMemo(() => Math.round(totalCredits / managedFarms.length), [totalCredits]);
  const avgReliability = useMemo(
    () => Math.round(managedFarms.reduce((s, f) => s + f.reliabilityScore, 0) / managedFarms.length),
    []
  );

  const avgBiodiversityData = useMemo(() => generateAvgBiodiversityData(), []);
  const avgReliabilityData = useMemo(() => generateAvgReliabilityData(), []);
  const totalIncomeData = useMemo(() => generateTotalIncomeData(), []);

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
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return <LoadingScreen variant="emerald" />;

  return (
    <PageLayout variant="emerald">
      <Navbar
        title="Manager Dashboard"
        menuItems={[{ label: 'Logout', onClick: handleLogout, danger: true }]}
      />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome */}
        <SectionCard className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.username}!</h2>
              <p className="text-gray-600">
                You are logged in as a <span className="font-semibold text-emerald-600">Manager</span>
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Row 1: Top 5 | Total Credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SectionCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Reliable Farms</h3>
            <div className="space-y-3">
              {[...managedFarms]
                .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
                .slice(0, 5)
                .map((farm, i) => (
                  <div key={farm.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{farm.name}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">{farm.reliabilityScore}%</span>
                  </div>
                ))}
            </div>
          </SectionCard>

          <SectionCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Biodiversity Credits</h3>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <span className="text-5xl font-bold text-emerald-600">{totalCredits.toLocaleString()}</span>
              <span className="text-gray-500 mt-2">credits across {managedFarms.length} farms</span>
            </div>
          </SectionCard>
        </div>

        {/* Row 2: Avg Reliability | Avg Biodiversity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SectionCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Average Reliability Score</h3>
              <span className="text-2xl font-bold text-emerald-600">{avgReliability}%</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgReliabilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(v) => [`${v}%`, 'Reliability']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={2} dot={{ fill: '#14B8A6', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Average Biodiversity Credits</h3>
              <span className="text-2xl font-bold text-emerald-600">{avgBiodiversity.toLocaleString()}</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgBiodiversityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(v) => [Number(v).toLocaleString(), 'Credits']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Row 3: Total Revenue */}
        <SectionCard className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">Total Revenue from Credits Sold</h3>
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl font-bold text-emerald-600">€{totalRevenue.toLocaleString()}</span>
            <span className="text-gray-500">/month across {managedFarms.length} farms</span>
          </div>
        </SectionCard>

        {/* Row 4: Income Bar Chart */}
        <SectionCard className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Income Per Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalIncomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(v) => [`€${Number(v).toLocaleString()}`, 'Income']}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Managed Farms */}
        <SectionCard>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Managed Farms ({managedFarms.length})</h3>
          <div className={`space-y-4 ${managedFarms.length > 5 ? 'max-h-[600px] overflow-y-auto pr-2' : ''}`}>
            {managedFarms.map((farm) => (
              <Link key={farm.id} href={`/manager-dashboard/farm/${farm.id}`} className="block">
                <div className="border border-gray-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-1">{farm.name}</h4>
                      <p className="text-gray-500 text-sm mb-2">Owner: {farm.owner}</p>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {farm.location}
                      </p>
                    </div>
                    <div className="flex gap-6 text-right items-center">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Credits</p>
                        <p className="text-lg font-semibold text-gray-800">{farm.biodiversityCredits.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Income</p>
                        <p className="text-lg font-semibold text-gray-800">€{farm.income.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Reliability</p>
                        <p className="text-lg font-semibold text-gray-800">{farm.reliabilityScore}%</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {managedFarms.length === 0 && (
            <p className="text-gray-500 text-center py-8">No farms currently under your management.</p>
          )}
        </SectionCard>
      </main>
    </PageLayout>
  );
}
