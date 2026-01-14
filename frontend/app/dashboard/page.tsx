'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [gaugeValue, setGaugeValue] = useState(87);

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
        <div className="w-full px-4 py-4 flex justify-between items-center">
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

      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome, {user.username}! 🎉
          </h2>
          <p className="text-gray-600 text-lg">
            You're successfully logged in to your dashboard.
          </p>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 h-[500px] flex items-center justify-center">
          <h3 className="text-4xl font-bold text-gray-400">Map</h3>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6">
          {/* Biodiversity Credits */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-400 mb-4">Biodiversity Credits</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold" style={{ color: '#77E6B4' }}>1,247</span>
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
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-400 mb-4">Income</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold" style={{ color: '#77E6B4' }}>€2,450</span>
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
          <div className="bg-white rounded-lg shadow-lg p-8 h-80 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-400 mb-4">Reliability Score</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-48 h-48 relative">
                <CircularProgressbar
                  value={gaugeValue}
                  strokeWidth={12}
                  styles={buildStyles({
                    pathColor: getGaugeColor(gaugeValue),
                    trailColor: '#E5E7EB',
                    strokeLinecap: 'round',
                  })}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">{getGaugeLabel(gaugeValue)}</span>
                  <span className="text-3xl font-bold text-gray-800">{gaugeValue}%</span>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}