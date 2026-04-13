'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initStaffAuth } from '@/lib/staff-auth-store';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  ecologist: 'Ecologist',
  surveyor: 'Surveyor',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'You have full access to all staff features, user management, and system settings.',
  ecologist: 'You have access to biodiversity data, survey results, and ecological assessments.',
  surveyor: 'You have access to survey tools and field data submission.',
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<{ full_name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = await initStaffAuth();
      if (!token) {
        router.replace('/staff/login');
        return;
      }
      const staffData = localStorage.getItem('staff');
      if (staffData) setStaff(JSON.parse(staffData));
    };
    init();
  }, [router]);

  if (!staff) return null;

  const roleLabel = ROLE_LABELS[staff.role] ?? staff.role;
  const roleDescription = ROLE_DESCRIPTIONS[staff.role] ?? '';

  return (
    <div className="px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome back, {staff.full_name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Signed in as <span className="font-medium text-emerald-600 dark:text-emerald-400">{roleLabel}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Your Role</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{roleLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roleDescription}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Surveys</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">—</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending review</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Biodiversity Records</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">—</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total entries</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        This dashboard is under construction. More features will be added here soon.
      </div>
    </div>
  );
}
