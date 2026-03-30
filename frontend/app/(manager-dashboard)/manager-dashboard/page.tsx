'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getManagerDashboards } from '@/lib/api';

export default function ManagerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }

    const savedId = localStorage.getItem('currentManagerDashboardId');
    if (savedId) { router.replace(`/manager-dashboard/${savedId}`); return; }

    getManagerDashboards()
      .then((dashboards: { manager_dashboard_id: string }[]) => {
        if (dashboards?.length > 0) {
          router.replace(`/manager-dashboard/${dashboards[0].manager_dashboard_id}`);
        } else {
          router.replace('/hub');
        }
      })
      .catch(() => router.replace('/hub'));
  }, [router]);

  return null;
}
