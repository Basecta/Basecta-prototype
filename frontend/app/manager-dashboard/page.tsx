'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  {
    id: '1',
    name: 'Green Valley Farm',
    owner: 'John Doe',
    location: 'County Cork, Ireland',
    biodiversityCredits: 1247,
    income: 2450,
    reliabilityScore: 58,
  },
  {
    id: '2',
    name: 'Sunrise Meadows',
    owner: 'Mary O\'Brien',
    location: 'County Kerry, Ireland',
    biodiversityCredits: 1823,
    income: 3120,
    reliabilityScore: 72,
  },
  {
    id: '3',
    name: 'Oakwood Estate',
    owner: 'Patrick Murphy',
    location: 'County Galway, Ireland',
    biodiversityCredits: 956,
    income: 1890,
    reliabilityScore: 45,
  },
  {
    id: '4',
    name: 'Riverside Ranch',
    owner: 'Siobhan Kelly',
    location: 'County Clare, Ireland',
    biodiversityCredits: 2105,
    income: 3650,
    reliabilityScore: 81,
  },
  {
    id: '5',
    name: 'Hillcrest Acres',
    owner: 'Declan Walsh',
    location: 'County Mayo, Ireland',
    biodiversityCredits: 1456,
    income: 2780,
    reliabilityScore: 63,
  },
  {
    id: '6',
    name: 'Clover Fields',
    owner: 'Aoife Brennan',
    location: 'County Limerick, Ireland',
    biodiversityCredits: 1678,
    income: 2950,
    reliabilityScore: 69,
  },
  {
    id: '7',
    name: 'Stonegate Farm',
    owner: 'Liam O\'Sullivan',
    location: 'County Tipperary, Ireland',
    biodiversityCredits: 892,
    income: 1650,
    reliabilityScore: 38,
  },
  {
    id: '8',
    name: 'Willow Brook',
    owner: 'Niamh Fitzgerald',
    location: 'County Waterford, Ireland',
    biodiversityCredits: 1934,
    income: 3340,
    reliabilityScore: 76,
  },
  {
    id: '9',
    name: 'Golden Harvest',
    owner: 'Sean McCarthy',
    location: 'County Wexford, Ireland',
    biodiversityCredits: 2256,
    income: 3890,
    reliabilityScore: 85,
  },
  {
    id: '10',
    name: 'Meadow View',
    owner: 'Ciara Doyle',
    location: 'County Kilkenny, Ireland',
    biodiversityCredits: 1123,
    income: 2180,
    reliabilityScore: 52,
  },
  {
    id: '11',
    name: 'Thornwood Farm',
    owner: 'Conor Ryan',
    location: 'County Carlow, Ireland',
    biodiversityCredits: 1567,
    income: 2890,
    reliabilityScore: 67,
  },
  {
    id: '12',
    name: 'Silver Lake Estate',
    owner: 'Orla Nolan',
    location: 'County Sligo, Ireland',
    biodiversityCredits: 1789,
    income: 3100,
    reliabilityScore: 74,
  },
  {
    id: '13',
    name: 'Pinewood Pastures',
    owner: 'Eoin Connolly',
    location: 'County Roscommon, Ireland',
    biodiversityCredits: 1045,
    income: 1980,
    reliabilityScore: 48,
  },
  {
    id: '14',
    name: 'Hazelnut Grove',
    owner: 'Saoirse Quinn',
    location: 'County Leitrim, Ireland',
    biodiversityCredits: 1398,
    income: 2560,
    reliabilityScore: 61,
  },
  {
    id: '15',
    name: 'Emerald Fields',
    owner: 'Cillian Burke',
    location: 'County Donegal, Ireland',
    biodiversityCredits: 2034,
    income: 3480,
    reliabilityScore: 79,
  },
];

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-600">Manager Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome, {user.username}!
              </h2>
              <p className="text-gray-600">
                You are logged in as a <span className="font-semibold text-emerald-600">Manager</span>
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top 5 Reliable Farms */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Reliable Farms</h3>
            <div className="space-y-3">
              {[...managedFarms]
                .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
                .slice(0, 5)
                .map((farm, index) => (
                  <div key={farm.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{farm.name}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">{farm.reliabilityScore}%</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Total Credits */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Biodiversity Credits</h3>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <span className="text-5xl font-bold text-emerald-600">
                {managedFarms.reduce((sum, farm) => sum + farm.biodiversityCredits, 0).toLocaleString()}
              </span>
              <span className="text-gray-500 mt-2">credits across {managedFarms.length} farms</span>
            </div>
          </div>
        </div>

        {/* Managed Farms Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Managed Farms</h3>

          <div className="space-y-4">
            {managedFarms.map((farm) => (
              <Link
                key={farm.id}
                href={`/manager-dashboard/farm/${farm.id}`}
                className="block"
              >
                <div className="border border-gray-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-1">
                        {farm.name}
                      </h4>
                      <p className="text-gray-500 text-sm mb-2">
                        Owner: {farm.owner}
                      </p>
                      <p className="text-gray-500 text-sm">
                        <svg
                          className="w-4 h-4 inline-block mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {farm.location}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-6 text-right">
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
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {managedFarms.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No farms currently under your management.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
