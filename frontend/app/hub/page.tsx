'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sprout, BarChart3, TrendingUp, Plus, Pencil, Check, X, RotateCcw } from 'lucide-react';
import { getFarms, getManagerDashboards, updateDashboardName, updateManagerDashboardName } from '@/lib/api';
import { initAuth } from '@/lib/auth-store';
import { useHubFilter } from './hub-filter-context';

interface Farm {
  farm_id: string;
  farm_name: string;
  farm_dashboard_name: string;
  location: string;
  nature_credits: number;
  income: number;
  reliability_score: number;
}

interface ManagerDashboard {
  manager_dashboard_id: string;
  manager_dashboard_name: string;
  total_nature_credits: number;
  total_income: number;
  avg_reliability: number;
}

export default function HubPage() {
  const router = useRouter();
  const { search, activeFilter } = useHubFilter();
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [managerDashboards, setManagerDashboards] = useState<ManagerDashboard[]>([]);
  const [managerLoading, setManagerLoading] = useState(true);

  const gridRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const farmEditContainerRef = useRef<HTMLDivElement>(null);

  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [draftManagerName, setDraftManagerName] = useState('');
  const [savingManagerId, setSavingManagerId] = useState<string | null>(null);
  const managerInputRef = useRef<HTMLInputElement>(null);
  const managerEditContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const token = await initAuth();
      const userData = localStorage.getItem('user');
      if (!token || !userData) {
        router.push('/login');
        setFarmsLoading(false);
        return;
      }
      setUser(JSON.parse(userData));
      getFarms()
        .then(data => { if (active) setFarms(data); })
        .catch(() => {})
        .finally(() => { if (active) setFarmsLoading(false); });

      getManagerDashboards()
        .then(data => { if (active) setManagerDashboards(data); })
        .catch(() => {})
        .finally(() => { if (active) setManagerLoading(false); });
    };
    init();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (editingManagerId) managerInputRef.current?.focus();
  }, [editingManagerId]);

  useEffect(() => {
    if (!editingId && !editingManagerId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (editingId && farmEditContainerRef.current && !farmEditContainerRef.current.contains(e.target as Node)) {
        setEditingId(null);
        setDraftName('');
      }
      if (editingManagerId && managerEditContainerRef.current && !managerEditContainerRef.current.contains(e.target as Node)) {
        setEditingManagerId(null);
        setDraftManagerName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, editingManagerId]);

  // Equalize tile heights based on the tallest visible tile
  useEffect(() => {
    const equalize = () => {
      if (!gridRef.current) return;
      const tiles = gridRef.current.querySelectorAll<HTMLElement>('[data-hub-tile]');
      // Reset so we can measure natural heights
      tiles.forEach(t => t.style.minHeight = 'auto');
      // Force reflow before measuring
      void gridRef.current.offsetHeight;
      let max = 0;
      tiles.forEach(t => {
        max = Math.max(max, t.scrollHeight);
      });
      // Apply the tallest height to all tiles
      tiles.forEach(t => t.style.minHeight = max > 0 ? `${max}px` : '');
    };
    equalize();
    window.addEventListener('resize', equalize);
    return () => window.removeEventListener('resize', equalize);
  }, [farms, managerDashboards, farmsLoading, managerLoading, activeFilter, search]);

  const startEdit = (e: React.MouseEvent, farm: Farm) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(farm.farm_id);
    setDraftName(farm.farm_dashboard_name);
  };

  const cancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setDraftName('');
  };

  const saveEdit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editingId || !draftName.trim()) return;
    const farmId = editingId;
    setSavingId(farmId);
    setEditingId(null);
    try {
      await updateDashboardName(farmId, draftName.trim());
      setFarms(prev =>
        prev.map(f => f.farm_id === farmId ? { ...f, farm_dashboard_name: draftName.trim() } : f)
      );
    } catch {
      setFarms(prev => [...prev]);
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit(e);
    if (e.key === 'Escape') cancelEdit(e);
  };

  const startEditManager = (e: React.MouseEvent, md: ManagerDashboard) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingManagerId(md.manager_dashboard_id);
    setDraftManagerName(md.manager_dashboard_name);
  };

  const cancelEditManager = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingManagerId(null);
    setDraftManagerName('');
  };

  const saveEditManager = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editingManagerId || !draftManagerName.trim()) return;
    const dashboardId = editingManagerId;
    setSavingManagerId(dashboardId);
    setEditingManagerId(null);
    try {
      await updateManagerDashboardName(dashboardId, draftManagerName.trim());
      setManagerDashboards(prev =>
        prev.map(md => md.manager_dashboard_id === dashboardId ? { ...md, manager_dashboard_name: draftManagerName.trim() } : md)
      );
    } catch {
      setManagerDashboards(prev => [...prev]);
    } finally {
      setSavingManagerId(null);
    }
  };

  const handleManagerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditManager(e);
    if (e.key === 'Escape') cancelEditManager(e);
  };

  function matchSearch(name: string) {
    if (!search) return true;
    const n = name.toLowerCase();
    const q = search.toLowerCase();
    if (q.length === 1 || q.length === 2) return n.startsWith(q);
    return n.includes(q);
  }

  const showFarms    = activeFilter === 'all' || activeFilter === 'farm';
  const showManagers = activeFilter === 'all' || activeFilter === 'manager';
  const showInvestor = activeFilter === 'all' || activeFilter === 'investor';

  const showInvestorTile = showInvestor && matchSearch('Investor Dashboard');

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 flex flex-col items-center">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Welcome{user.username ? `, ${user.username}` : ''}
        </h1>
        <p className="text-muted-foreground">Select a dashboard to get started.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full" ref={gridRef}>

        {/* Farm loading skeleton */}
        {farmsLoading && showFarms && (
          <div data-hub-wrapper className="transition-all duration-300 ease-in-out opacity-100 scale-100 h-full">
            <div className="rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 bg-white dark:bg-gray-900 shadow-sm min-h-48 p-8 flex flex-col gap-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        )}

        {/* Farm tiles */}
        {!farmsLoading && farms.map((farm) => {
          const isEditing = editingId === farm.farm_id;
          const isSaving  = savingId  === farm.farm_id;
          if (!(showFarms && matchSearch(farm.farm_dashboard_name))) return null;

          return (
            <div key={farm.farm_id} data-hub-wrapper className="h-full">
              <div data-hub-tile className="group relative flex flex-col gap-6 p-8 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md h-full">
                <Link
                  href={`/dashboard/${farm.farm_id}`}
                  className="absolute inset-0 rounded-2xl"
                  tabIndex={isEditing ? -1 : 0}
                  aria-label={`Open ${farm.farm_dashboard_name}`}
                />

                <div className="relative z-10 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950">
                    <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <div className="relative z-10 pointer-events-none flex flex-col gap-1">
                  {isEditing ? (
                    <div ref={farmEditContainerRef} className="flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="text-lg font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-emerald-400 outline-none w-full"
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0"
                        aria-label="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                        aria-label="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {draftName !== farm.farm_name && (
                        <button
                          onClick={e => { e.stopPropagation(); setDraftName(farm.farm_name); }}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                          aria-label="Reset to farm name"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {isSaving ? draftName : farm.farm_dashboard_name}
                      </h2>
                      <button
                        onClick={e => startEdit(e, farm)}
                        className="pointer-events-auto p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        aria-label="Rename dashboard"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <ul className="text-sm text-muted-foreground leading-relaxed list-none m-0 p-0 flex flex-col lg:flex-row gap-1.5">
                    <li className="rounded-md border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Credits</span>
                      <span>{farm.nature_credits.toLocaleString()}</span>
                    </li>
                    <li className="rounded-md border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Income</span>
                      <span>&euro;{farm.income.toLocaleString()}</span>
                    </li>
                    <li className="rounded-md border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Reliability</span>
                      <span>{farm.reliability_score}%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })}

        {/* Manager loading skeleton */}
        {managerLoading && showManagers && (
          <div data-hub-wrapper className="transition-all duration-300 ease-in-out opacity-100 scale-100 h-full">
            <div className="rounded-2xl border-2 border-blue-100 dark:border-blue-900 bg-white dark:bg-gray-900 shadow-sm min-h-48 p-8 flex flex-col gap-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        )}

        {/* Manager dashboard tiles */}
        {!managerLoading && managerDashboards.map((md) => {
          const isEditing = editingManagerId === md.manager_dashboard_id;
          const isSaving  = savingManagerId  === md.manager_dashboard_id;
          if (!(showManagers && matchSearch(md.manager_dashboard_name))) return null;

          return (
            <div key={md.manager_dashboard_id} data-hub-wrapper className="h-full">
              <div data-hub-tile className="group relative flex flex-col gap-6 p-8 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md h-full">
                <Link
                  href={`/manager-dashboard/${md.manager_dashboard_id}`}
                  className="absolute inset-0 rounded-2xl"
                  tabIndex={isEditing ? -1 : 0}
                  aria-label={`Open ${md.manager_dashboard_name}`}
                />

                <div className="relative z-10 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="relative z-10 pointer-events-none flex flex-col gap-1">
                  {isEditing ? (
                    <div ref={managerEditContainerRef} className="flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                      <input
                        ref={managerInputRef}
                        value={draftManagerName}
                        onChange={e => setDraftManagerName(e.target.value)}
                        onKeyDown={handleManagerKeyDown}
                        className="text-lg font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-blue-400 outline-none w-full"
                      />
                      <button
                        onClick={saveEditManager}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 shrink-0"
                        aria-label="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditManager}
                        className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                        aria-label="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {isSaving ? draftManagerName : md.manager_dashboard_name}
                      </h2>
                      <button
                        onClick={e => startEditManager(e, md)}
                        className="pointer-events-auto p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        aria-label="Rename dashboard"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <ul className="text-sm text-muted-foreground leading-relaxed list-none m-0 p-0 flex flex-col lg:flex-row gap-1.5">
                    <li className="rounded-md border border-blue-200/50 dark:border-blue-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Credits</span>
                      <span>{md.total_nature_credits.toLocaleString()}</span>
                    </li>
                    <li className="rounded-md border border-blue-200/50 dark:border-blue-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Income</span>
                      <span>&euro;{md.total_income.toLocaleString()}</span>
                    </li>
                    <li className="rounded-md border border-blue-200/50 dark:border-blue-800/50 px-2.5 py-1.5 flex flex-col">
                      <span className="text-xs text-muted-foreground/70">Reliability</span>
                      <span>{md.avg_reliability}%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })}

        {/* Investor tile */}
        {showInvestorTile && <div data-hub-wrapper className="h-full">
          <Link
            href="/investor-dashboard"
            data-hub-tile
            className="group flex flex-col gap-6 p-8 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md h-full"
                     >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950">
              <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Investor Dashboard</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Track investment performance and nature credit markets.</p>
            </div>
          </Link>
        </div>}

        {/* Create new dashboard — always visible */}
        <div className="h-full">
          <button
            disabled
            data-hub-tile
            className="group flex flex-col gap-6 p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm opacity-60 cursor-not-allowed text-left w-full h-full"
                     >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Create New Dashboard</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Set up a new farm, manager, or investor dashboard.</p>
            </div>
          </button>
        </div>

      </div>

    </div>
  );
}
