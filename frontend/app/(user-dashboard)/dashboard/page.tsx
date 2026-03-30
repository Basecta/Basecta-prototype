'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFarms } from '@/lib/api';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }

    getFarms()
      .then((farms: { farm_id: string }[]) => {
        if (!active) return;
        if (farms?.length > 0) {
          router.replace(`/dashboard/${farms[0].farm_id}`);
        } else {
          router.replace('/hub');
        }
      })
      .catch(() => { if (active) router.replace('/hub'); });
    return () => { active = false; };
  }, [router]);

  return null;
}
