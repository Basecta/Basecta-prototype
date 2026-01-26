'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from 'recharts';
import { RadialGauge } from '../components/RadialGauge';
import { DetailView } from '../components/DetailView';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gaugeValue, setGaugeValue] = useState(58);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  // Mock data for charts
  const biodiversityData = [
    { month: 'Aug', value: 1050 },
    { month: 'Sep', value: 1120 },
    { month: 'Oct', value: 1180 },
    { month: 'Nov', value: 1247, current: true },
    { month: 'Dec', value: 1310, future: true },
    { month: 'Jan', value: 1380, future: true },
  ];

  const incomeData = [
    { month: 'Aug', value: 2100 },
    { month: 'Sep', value: 2250 },
    { month: 'Oct', value: 2350 },
    { month: 'Nov', value: 2450, current: true },
    { month: 'Dec', value: 2580, future: true },
    { month: 'Jan', value: 2700, future: true },
  ];

  const reliabilityData = [
    { month: 'Aug', value: 52 },
    { month: 'Sep', value: 55 },
    { month: 'Oct', value: 56 },
    { month: 'Nov', value: 58, current: true },
    { month: 'Dec', value: 60, future: true },
    { month: 'Jan', value: 62, future: true },
  ];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getGaugeColor = (value: number) => {
    if (value >= 70) return '#77E6B4';
    if (value >= 30) return '#FFD221';
    return '#FF5353';
  };

  const getGaugeLabel = (value: number) => {
    if (value >= 70) return 'Great!';
    if (value >= 30) return 'Good';
    return 'Fair';
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.current) {
      return (
        <circle cx={cx} cy={cy} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
      );
    }
    return null;
  };

  const renderModal = () => {
    if (!selectedCard) return null;

    let title = '';
    let mainValue = '';
    let chartData: any[] = [];
    let dataKey = 'value';
    let yAxisLabel = '';

    switch (selectedCard) {
      case 'biodiversity':
        title = 'Biodiversity Credits';
        mainValue = '1,247';
        chartData = biodiversityData;
        yAxisLabel = 'Credits';
        break;
      case 'income':
        title = 'Income';
        mainValue = '€2,450/month';
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
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md z-40"
          onClick={() => setSelectedCard(null)}
        ></div>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Current Value */}
              <div className="mb-8 text-center">
                <p className="text-gray-600 text-lg mb-2">Current Value</p>
                <p className="text-6xl font-bold" style={{ color: '#77E6B4' }}>
                  {mainValue}
                </p>
              </div>

              {/* Chart */}
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
                      stroke="#77E6B4" 
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
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          
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

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                ></div>
                
                {/* Menu Items */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1">
                  <Link
                    href="/data-upload"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Data Upload
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account Settings
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

      {/* Main Content with max-width container for white space */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome, {user.username}! 🎉
          </h2>
          <p className="text-gray-600 text-lg">
            You're successfully logged in to your dashboard.
          </p>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Farm Overview</h3>
          <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
            <Image
              src="/farm_map.png"
              alt="Farm Map"
              fill
              className="object-cover rounded-lg"
              priority
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
                <span className="text-4xl" style={{ color: '#050d0a' }}>1,247</span>
                <svg 
                  className="w-8 h-8" 
                  style={{ color: '#77E6B4' }}
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
                  <span className="text-4xl" style={{ color: '#030404' }}>€2,450</span>
                  <span className="text-xl text-gray-500 ml-1">/month</span>
                </div>
                <svg 
                  className="w-8 h-8" 
                  style={{ color: '#77E6B4' }}
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
          value={1247}
          targets={[
            { label: 'Optimal', value: 70 },
            { label: 'Good Threshold', value: 50 },
            { label: 'Fair Threshold', value: 30 },
          ]}
        />

        {/* Income Detail View */}
        <DetailView
          isOpen={isIncomeDetailOpen}
          onClose={() => setIsIncomeDetailOpen(false)}
          value={2450}
          symbol='€'
          targets={[
            { label: 'Optimal', value: 70 },
            { label: 'Good Threshold', value: 50 },
            { label: 'Fair Threshold', value: 30 },
          ]}
        />
      </div>
    </div>
  );
}