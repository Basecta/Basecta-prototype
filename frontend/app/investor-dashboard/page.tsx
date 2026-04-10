'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initAuth } from '@/lib/auth-store';
import { LoadingScreen } from '../components/LoadingScreen';

export default function InvestorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const token = await initAuth();
      const userData = localStorage.getItem('user');
      if (!token || !userData) { router.push('/login'); return; }
      setUser(JSON.parse(userData));
    };
    init();
  }, [router]);

  if (!user) return <LoadingScreen />;

  return (
    <div className="flex items-center justify-center min-h-[calc(100svh-var(--header-height,0px))]">
      <p className="text-muted-foreground text-lg">Coming soon</p>
    </div>
  );
}
