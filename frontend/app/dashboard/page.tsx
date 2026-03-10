'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MapWrapper from '../components/MapWrapper';
import { RadialGauge } from '../components/RadialGauge';
import { DetailView } from '../components/DetailView';
import { Navbar } from '../components/Navbar';
import { PageLayout } from '../components/PageLayout';
import { MetricCard } from '../components/MetricCard';
import { SectionCard } from '../components/SectionCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { useData } from '@/lib/DataContext';

export default function DashboardPage() {
  const router = useRouter();
  const { dashboardData } = useData();
  const [user, setUser] = useState<any>(null);
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  const {
    biodiversityCredits,
    income,
    reliabilityScore: gaugeValue,
    biodiversityDetailData,
  } = dashboardData;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'asset_owner') {
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

  if (!user) return <LoadingScreen />;

  return (
    <PageLayout>
      <Navbar
        title="Dashboard"
        menuItems={[
          { label: 'Data Upload', href: '/data-upload' },
          { label: 'Account Settings', href: '/settings' },
          { label: 'Logout', onClick: handleLogout, danger: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <SectionCard className="mb-6" padding="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome, {user.username}!
          </h2>
          <p className="text-gray-600 text-lg">
            You&apos;re successfully logged in to your dashboard.
          </p>
        </SectionCard>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Biodiversity Credits" onClick={() => setIsBiodiversityDetailOpen(true)}>
            <div className="flex items-center gap-3">
              <span className="text-4xl" style={{ color: '#050d0a' }}>
                {biodiversityCredits.toLocaleString()}
              </span>
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
                <path d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </MetricCard>

          <MetricCard title="Income" onClick={() => setIsIncomeDetailOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline">
                <span className="text-4xl" style={{ color: '#030404' }}>
                  €{income.toLocaleString()}
                </span>
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
          dummy={false}
          showGauge={false}
          data={biodiversityDetailData}
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
