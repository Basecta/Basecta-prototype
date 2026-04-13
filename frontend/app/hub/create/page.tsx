'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sprout, BarChart3, TrendingUp } from 'lucide-react';
import { initAuth } from '@/lib/auth-store';

type Role = 'asset_owner' | 'manager' | 'investor';

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string; // border + hover colour classes
  iconBg: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'asset_owner',
    label: 'Asset Owner',
    description:
      'Set up a dashboard for land you own or manage directly. Track biodiversity, income, and nature credits for each asset.',
    icon: <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    accent:
      'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    id: 'manager',
    label: 'Land Manager',
    description:
      'Oversee multiple land parcels and roll up reporting across farms you manage on behalf of others.',
    icon: <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    accent:
      'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    id: 'investor',
    label: 'Investor',
    description:
      'Track investment performance, explore pipeline projects, and monitor nature credit markets.',
    icon: <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
    accent:
      'border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600',
    iconBg: 'bg-violet-50 dark:bg-violet-950',
  },
];

export default function CreateDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = await initAuth();
      if (!token) {
        router.replace('/login');
        return;
      }
      setReady(true);
    };
    init();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="px-4 lg:px-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <Link
          href="/hub"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Create a new dashboard
          </h1>
          <p className="text-muted-foreground">
            Choose the type of dashboard you&apos;d like to set up.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : role.id)}
                className={`group text-left flex flex-col gap-5 p-6 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : role.accent
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.iconBg}`}
                >
                  {role.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {role.label}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Link
            href="/hub"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (selected === 'asset_owner') {
                router.push('/hub/create/asset-owner');
                return;
              }
              // Land-manager and investor setup flows aren't built yet.
              console.log('Selected role for new dashboard:', selected);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Continue
          </button>
        </div>

        {selected && selected !== 'asset_owner' && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Setup flow for <span className="font-medium">{ROLES.find(r => r.id === selected)?.label}</span> is coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
