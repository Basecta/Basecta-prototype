'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getFarmById, updateFarm } from '@/lib/api';
import { initAuth } from '@/lib/auth-store';
import { UserSectionCards } from '@/components/user-section-cards';
import { UserChartArea } from '@/components/user-chart-area';
import { DetailView } from '@/app/components/DetailView';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  MapPinIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  SparklesIcon,
  CheckCircle2Icon,
  RulerIcon,
  TagIcon,
  GlobeIcon,
} from 'lucide-react';

interface FarmData {
  farm_id: string;
  farm_name: string;
  farm_dashboard_name: string;
  location: string;
  nature_credits: number;
  income: number;
  reliability_score: number;
  asset_type?: string | null;
  size_hectares?: number | null;
  region?: string | null;
  description?: string | null;
  has_evaluation_request?: boolean;
}

const ASSET_TYPES = ['Farm', 'Woodland', 'Wetland', 'Grassland', 'Mixed', 'Other'];

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
const BIO_BASE   = [1050, 1120, 1180, 1247, 1310, 1380];
const INC_BASE   = [2100, 2250, 2350, 2450, 2580, 2700];
const REL_BASE   = [52,   55,   56,   58,   60,   62  ];
const TREND_BASE = [1000, 1050, 1100, 1120, 1180, 1200, 1220, 1247, 1280, 1300, 1320, 1350];

function makeMonthly(base: number[], offset: number) {
  return MONTHS.map((month, i) => ({
    month,
    value: Math.round(base[i] + offset),
    ...(i === 3 ? { current: true } : {}),
    ...(i > 3 ? { future: true } : {}),
  }));
}

function buildChartData(farm: FarmData) {
  const bioOff = farm.nature_credits  - 1247;
  const incOff = farm.income - 2450;
  const relOff = farm.reliability_score - 58;
  return {
    natureData: makeMonthly(BIO_BASE, bioOff),
    incomeData:        makeMonthly(INC_BASE, incOff),
    reliabilityData:   makeMonthly(REL_BASE, relOff),
    biodiversityDetailData: {
      trendData:  TREND_BASE.map(v => Math.round(v + bioOff)),
      peakValue:  1350 + bioOff,
      avgValue:   1180 + bioOff,
      peakLabel:  'Peak Credits (30d)',
      avgLabel:   'Average Credits',
      peakTrend:  15,
      avgTrend:   -12,
    },
  };
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditState {
  farm_name: string;
  location: string;
  asset_type: string;
  region: string;
  size_hectares: string;
  description: string;
}

function toEditState(farm: FarmData): EditState {
  return {
    farm_name: farm.farm_name,
    location: farm.location,
    asset_type: farm.asset_type ?? '',
    region: farm.region ?? '',
    size_hectares: farm.size_hectares != null ? String(farm.size_hectares) : '',
    description: farm.description ?? '',
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FarmDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [farm, setFarm] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [isReliabilityDetailOpen, setIsReliabilityDetailOpen] = useState(false);
  const [isBiodiversityDetailOpen, setIsBiodiversityDetailOpen] = useState(false);
  const [isIncomeDetailOpen, setIsIncomeDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const token = await initAuth();
      if (!token) { router.push('/login'); return; }

      getFarmById(params.id as string)
        .then(data => { if (active) setFarm(data); })
        .catch(() => { if (active) router.push('/hub'); })
        .finally(() => { if (active) setLoading(false); });
    };
    init();
    return () => { active = false; };
  }, [params.id, router]);

  if (loading || !farm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const startEdit = () => {
    setEditForm(toEditState(farm));
    setEditError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editForm || saving) return;
    setSaving(true);
    setEditError('');
    try {
      const sizeNum = editForm.size_hectares ? parseFloat(editForm.size_hectares) : null;
      const updated = await updateFarm(farm.farm_id, {
        farm_name: editForm.farm_name.trim(),
        location: editForm.location.trim(),
        asset_type: editForm.asset_type || null,
        size_hectares: Number.isFinite(sizeNum as number) ? sizeNum : null,
        region: editForm.region.trim() || null,
        description: editForm.description.trim() || null,
      });
      setFarm(updated);
      setEditing(false);
      setEditForm(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const { natureData, incomeData, reliabilityData, biodiversityDetailData } = buildChartData(farm);
  const noUploads = { hedgerows: false, waterways: false, soil: false };

  // Once an evaluation exists, the dashboard metrics / charts become meaningful.
  // Before then we keep the focus on the asset overview + the call-to-action.
  const showMetrics = !!farm.has_evaluation_request;

  return (
    <>
      {/* Header */}
      <div className="px-4 lg:px-6">
        <Card className="ring-0 border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-2xl">{farm.farm_dashboard_name}</CardTitle>
            <CardDescription className="flex flex-col gap-1">
              {farm.farm_dashboard_name !== farm.farm_name && (
                <span>{farm.farm_name}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {farm.location}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Overview / Edit card */}
      <div className="px-4 lg:px-6">
        <Card className="ring-0">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Asset overview</CardTitle>
              <CardDescription>
                {editing
                  ? 'Update any details that were entered incorrectly.'
                  : 'Basic information about this asset.'}
              </CardDescription>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <PencilIcon className="size-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XIcon className="size-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving || !editForm?.farm_name.trim() || !editForm?.location.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SaveIcon className="size-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OverviewItem icon={<TagIcon className="size-4" />} label="Asset name" value={farm.farm_name} />
                <OverviewItem icon={<TagIcon className="size-4" />} label="Type" value={farm.asset_type ?? '—'} />
                <OverviewItem icon={<MapPinIcon className="size-4" />} label="Location" value={farm.location} />
                <OverviewItem icon={<GlobeIcon className="size-4" />} label="Region" value={farm.region ?? '—'} />
                <OverviewItem
                  icon={<RulerIcon className="size-4" />}
                  label="Size"
                  value={farm.size_hectares != null ? `${farm.size_hectares} ha` : '—'}
                />
                <OverviewItem
                  icon={<TagIcon className="size-4" />}
                  label="Description"
                  value={farm.description ?? '—'}
                  full
                />
              </div>
            ) : editForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Asset name">
                    <input
                      type="text"
                      value={editForm.farm_name}
                      onChange={(e) => setEditForm({ ...editForm, farm_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </EditField>
                  <EditField label="Asset type">
                    <select
                      value={editForm.asset_type}
                      onChange={(e) => setEditForm({ ...editForm, asset_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    >
                      <option value="">—</option>
                      {ASSET_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </EditField>
                  <EditField label="Location">
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </EditField>
                  <EditField label="Region">
                    <input
                      type="text"
                      value={editForm.region}
                      onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </EditField>
                  <EditField label="Size (hectares)">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editForm.size_hectares}
                      onChange={(e) => setEditForm({ ...editForm, size_hectares: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    />
                  </EditField>
                </div>
                <EditField label="Description">
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 resize-none"
                  />
                </EditField>
                {editError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                    {editError}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Request Evaluation CTA — big yellow button */}
      <div className="px-4 lg:px-6">
        {!farm.has_evaluation_request ? (
          <Link
            href={`/dashboard/${farm.farm_id}/request-evaluation`}
            className="group block w-full rounded-2xl border-2 border-yellow-400 dark:border-yellow-500 bg-gradient-to-r from-yellow-300 to-amber-300 dark:from-yellow-500 dark:to-amber-500 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 px-6 py-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 rounded-xl bg-yellow-500/20 dark:bg-yellow-900/30 p-3">
                  <SparklesIcon className="size-7 text-yellow-900 dark:text-yellow-50" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-50">
                    Request Evaluation and Analysis of Asset for Nature Credits
                  </h3>
                  <p className="text-sm text-yellow-900/80 dark:text-yellow-50/90">
                    Send this asset to an ecologist for on-site survey and nature-credit assessment.
                  </p>
                </div>
              </div>
              <div className="shrink-0 hidden sm:flex items-center gap-1 text-sm font-semibold text-yellow-900 dark:text-yellow-50">
                Start
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="w-full rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Evaluation request submitted
                </p>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                  An ecologist will be in touch to organise an on-site survey.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics + charts — only once an evaluation exists */}
      {showMetrics && (
        <>
          <UserSectionCards
            natureCredits={farm.nature_credits}
            income={farm.income}
            reliabilityScore={farm.reliability_score}
            uploadedCategories={noUploads}
          />
          <UserChartArea
            natureData={natureData}
            incomeData={incomeData}
            reliabilityData={reliabilityData}
          />
        </>
      )}

      <DetailView
        isOpen={isReliabilityDetailOpen}
        onClose={() => setIsReliabilityDetailOpen(false)}
        value={farm.reliability_score}
        symbol='%'
        type='reliability'
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
        value={farm.nature_credits}
        type='biodiversity'
        dummy={false}
        showGauge={false}
        data={biodiversityDetailData}
      />

      <DetailView
        isOpen={isIncomeDetailOpen}
        onClose={() => setIsIncomeDetailOpen(false)}
        value={farm.income}
        symbol='€'
        type='income'
        dummy={true}
        showGauge={false}
        targets={[
          { label: 'Target', value: 4000 },
          { label: 'Good Threshold', value: 2500 },
          { label: 'Minimum', value: 1500 },
        ]}
      />
    </>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function OverviewItem({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-100 break-words">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
