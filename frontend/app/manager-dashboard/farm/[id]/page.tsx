'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MapWrapper from '@/app/components/MapWrapper';
import { RadialGauge } from '@/app/components/RadialGauge';
import { DetailView } from '@/app/components/DetailView';

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

// Helper function to generate trend data based on current value
const generateTrendData = (currentValue: number, variance: number = 0.1) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();

  return months.map((month, index) => {
    const randomVariance = 1 + (Math.random() - 0.5) * variance * 2;
    const trendFactor = 0.85 + (index / months.length) * 0.2; // Gradual increase over time
    let value = Math.round(currentValue * trendFactor * randomVariance);

    return {
      month,
      value,
      current: index === currentMonth,
      future: index > currentMonth,
    };
  });
};

// Helper function to generate biodiversity detail data
const generateBiodiversityDetailData = (credits: number) => {
  const baseMultiplier = credits / 1247; // Normalize based on reference value
  return {
    hedgerows: {
      length: Math.round(2.4 * baseMultiplier * 10) / 10,
      species: Math.round(12 * baseMultiplier),
      health: Math.min(95, Math.round(78 * (0.9 + baseMultiplier * 0.2))),
    },
    waterways: {
      length: Math.round(1.8 * baseMultiplier * 10) / 10,
      quality: Math.min(100, Math.round(82 * (0.9 + baseMultiplier * 0.15))),
      biodiversityIndex: Math.round(7.2 * baseMultiplier * 10) / 10,
    },
    soil: {
      organicMatter: Math.round(4.2 * baseMultiplier * 10) / 10,
      microbialActivity: Math.min(100, Math.round(68 * (0.85 + baseMultiplier * 0.2))),
      carbonSequestration: Math.round(12.5 * baseMultiplier * 10) / 10,
    },
  };
};

// Demo farm data with full metrics
const farmsData: Record<string, Farm> = {
  '1': {
    id: '1',
    name: 'Green Valley Farm',
    owner: 'John Doe',
    location: 'County Cork, Ireland',
    biodiversityCredits: 1247,
    income: 2450,
    reliabilityScore: 58,
  },
  '2': {
    id: '2',
    name: 'Sunrise Meadows',
    owner: 'Mary O\'Brien',
    location: 'County Kerry, Ireland',
    biodiversityCredits: 1823,
    income: 3120,
    reliabilityScore: 72,
  },
  '3': {
    id: '3',
    name: 'Oakwood Estate',
    owner: 'Patrick Murphy',
    location: 'County Galway, Ireland',
    biodiversityCredits: 956,
    income: 1890,
    reliabilityScore: 45,
  },
  '4': {
    id: '4',
    name: 'Riverside Ranch',
    owner: 'Siobhan Kelly',
    location: 'County Clare, Ireland',
    biodiversityCredits: 2105,
    income: 3650,
    reliabilityScore: 81,
  },
  '5': {
    id: '5',
    name: 'Hillcrest Acres',
    owner: 'Declan Walsh',
    location: 'County Mayo, Ireland',
    biodiversityCredits: 1456,
    income: 2780,
    reliabilityScore: 63,
  },
  '6': {
    id: '6',
    name: 'Clover Fields',
    owner: 'Aoife Brennan',
    location: 'County Limerick, Ireland',
    biodiversityCredits: 1678,
    income: 2950,
    reliabilityScore: 69,
  },
  '7': {
    id: '7',
    name: 'Stonegate Farm',
    owner: 'Liam O\'Sullivan',
    location: 'County Tipperary, Ireland',
    biodiversityCredits: 892,
    income: 1650,
    reliabilityScore: 38,
  },
  '8': {
    id: '8',
    name: 'Willow Brook',
    owner: 'Niamh Fitzgerald',
    location: 'County Waterford, Ireland',
    biodiversityCredits: 1934,
    income: 3340,
    reliabilityScore: 76,
  },
  '9': {
    id: '9',
    name: 'Golden Harvest',
    owner: 'Sean McCarthy',
    location: 'County Wexford, Ireland',
    biodiversityCredits: 2256,
    income: 3890,
    reliabilityScore: 85,
  },
  '10': {
    id: '10',
    name: 'Meadow View',
    owner: 'Ciara Doyle',
    location: 'County Kilkenny, Ireland',
    biodiversityCredits: 1123,
    income: 2180,
    reliabilityScore: 52,
  },
  '11': {
    id: '11',
    name: 'Thornwood Farm',
    owner: 'Conor Ryan',
    location: 'County Carlow, Ireland',
    biodiversityCredits: 1567,
    income: 2890,
    reliabilityScore: 67,
  },
  '12': {
    id: '12',
    name: 'Silver Lake Estate',
    owner: 'Orla Nolan',
    location: 'County Sligo, Ireland',
    biodiversityCredits: 1789,
    income: 3100,
    reliabilityScore: 74,
  },
  '13': {
    id: '13',
    name: 'Pinewood Pastures',
    owner: 'Eoin Connolly',
    location: 'County Roscommon, Ireland',
    biodiversityCredits: 1045,
    income: 1980,
    reliabilityScore: 48,
  },
  '14': {
    id: '14',
    name: 'Hazelnut Grove',
    owner: 'Saoirse Quinn',
    location: 'County Leitrim, Ireland',
    biodiversityCredits: 1398,
    income: 2560,
    reliabilityScore: 61,
  },
  '15': {
    id: '15',
    name: 'Emerald Fields',
    owner: 'Cillian Burke',
    location: 'County Donegal, Ireland',
    biodiversityCredits: 2034,
    income: 3480,
    reliabilityScore: 79,
  },
};

export default function FarmDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  // Generate farm-specific data based on farm metrics
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
      biodiversityDetailData: generateBiodiversityDetailData(farmInfo.biodiversityCredits),
    };
  }, [farmId]);

  // Destructure farm data for easier access
  const biodiversityCredits = farmData?.biodiversityCredits ?? 0;
  const income = farmData?.income ?? 0;
  const gaugeValue = farmData?.reliabilityScore ?? 0;
  const biodiversityData = farmData?.biodiversityData ?? [];
  const incomeData = farmData?.incomeData ?? [];
  const reliabilityData = farmData?.reliabilityData ?? [];
  const biodiversityDetailData = farmData?.biodiversityDetailData ?? null;

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

    // Get farm data
    const farmData = farmsData[farmId];
    if (!farmData) {
      router.push('/manager-dashboard');
      return;
    }
    setFarm(farmData);
  }, [router, farmId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.current) {
      return (
        <circle cx={cx} cy={cy} r={6} fill="#10B981" stroke="#fff" strokeWidth={2} />
      );
    }
    return null;
  };

  const renderModal = () => {
    if (!selectedCard) return null;

    let title = '';
    let mainValue = '';
    let chartData: any[] = [];
    let yAxisLabel = '';

    switch (selectedCard) {
      case 'biodiversity':
        title = 'Biodiversity Credits';
        mainValue = biodiversityCredits.toLocaleString();
        chartData = biodiversityData;
        yAxisLabel = 'Credits';
        break;
      case 'income':
        title = 'Income';
        mainValue = `€${income.toLocaleString()}/month`;
        chartData = incomeData;
        yAxisLabel = 'Income (€)';
        break;
      case 'reliability':
        title = 'Reliability Score';
        mainValue = `${gaugeValue}%`;
        chartData = reliabilityData;
        yAxisLabel = 'Score (%)';
        break;
    }

    return (
      <>
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md z-40"
          onClick={() => setSelectedCard(null)}
        ></div>

        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-8 text-center">
                <p className="text-gray-600 text-lg mb-2">Current Value</p>
                <p className="text-6xl font-bold" style={{ color: '#10B981' }}>
                  {mainValue}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Trend Analysis</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => {
                        const label = props.payload.future ? `${value} (Projected)` :
                          props.payload.current ? `${value} (Current)` : value;
                        return [label, yAxisLabel];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={<CustomDot />}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                    <span className="text-sm text-gray-600">Historical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600">Current Month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                    <span className="text-sm text-gray-600">Projected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (!user || !farm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/manager-dashboard"
              className="text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Farm Details</h1>
          </div>

          {/* Burger Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-200 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                ></div>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1">
                  <Link
                    href="/manager-dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Back to Farms
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Farm Name Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {farm.name}
          </h2>
          <div className="flex items-center gap-4 text-gray-600">
            <span>Owner: {farm.owner}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
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
            </span>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Farm Overview</h3>
          <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
            <MapWrapper
              imageUrl="/farm-orthophoto.png"
              boundsUrl="/farm-orthophoto-bounds.json"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Biodiversity Credits */}
          <div
            className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setIsBiodiversityDetailOpen(true)}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Biodiversity Credits</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="text-4xl" style={{ color: '#050d0a' }}>{biodiversityCredits.toLocaleString()}</span>
                <svg
                  className="w-8 h-8"
                  style={{ color: '#10B981' }}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 15l7-7 7 7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Income */}
          <div
            className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setIsIncomeDetailOpen(true)}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Income</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline">
                  <span className="text-4xl" style={{ color: '#030404' }}>€{income.toLocaleString()}</span>
                  <span className="text-xl text-gray-500 ml-1">/month</span>
                </div>
                <svg
                  className="w-8 h-8"
                  style={{ color: '#10B981' }}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 15l7-7 7 7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Reliability Score */}
          <div
            className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setIsReliabilityDetailOpen(true)}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Reliability Score</h3>
            <div className="flex-1 flex items-center justify-center">
              <RadialGauge
                value={gaugeValue}
                size={192}
                strokeWidth={5}
                symbol='%'
              />
            </div>
          </div>
        </div>

        {/* Render Modal */}
        {renderModal()}

        {/* Reliability Score Detail View */}
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

        {/* Biodiversity Credits Detail View */}
        <DetailView
          isOpen={isBiodiversityDetailOpen}
          onClose={() => setIsBiodiversityDetailOpen(false)}
          value={biodiversityCredits}
          type='biodiversity'
          dummy={false}
          showGauge={false}
          data={biodiversityDetailData}
        />

        {/* Income Detail View */}
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
      </div>
    </div>
  );
}
