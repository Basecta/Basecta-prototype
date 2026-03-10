'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../components/Navbar';
import { PageLayout } from '../components/PageLayout';
import { LoadingScreen } from '../components/LoadingScreen';

export default function InvestorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'investor') {
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
        title="Investor Dashboard"
        menuItems={[{ label: 'Logout', onClick: handleLogout, danger: true }]}
      />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-gray-400 text-lg">Coming soon</p>
      </div>
    </PageLayout>
  );
}
