'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';
import { createFarm } from '@/lib/api';
import { initAuth } from '@/lib/auth-store';

const ASSET_TYPES = ['Farm', 'Woodland', 'Wetland', 'Grassland', 'Mixed', 'Other'];

interface FormState {
  farm_name: string;
  asset_type: string;
  location: string;
  region: string;
  size_hectares: string;
  description: string;
}

const EMPTY: FormState = {
  farm_name: '',
  asset_type: '',
  location: '',
  region: '',
  size_hectares: '',
  description: '',
};

// ─── Shared inputs (match the styling used elsewhere in the app) ────────────

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-primary/20 text-gray-900'
          : 'border-gray-200 bg-white text-gray-700 hover:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary'
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CreateAssetOwnerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const update = (k: keyof FormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canSubmit =
    form.farm_name.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.asset_type.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    try {
      const sizeNum = form.size_hectares ? parseFloat(form.size_hectares) : null;
      const created = await createFarm({
        farm_name: form.farm_name.trim(),
        location: form.location.trim(),
        asset_type: form.asset_type || null,
        size_hectares: Number.isFinite(sizeNum as number) ? sizeNum : null,
        region: form.region.trim() || null,
        description: form.description.trim() || null,
      });
      // Land the user on the new asset's dashboard.
      router.replace(`/dashboard/${created.farm_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create asset.');
      setSaving(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link
          href="/hub/create"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950 shrink-0">
            <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
              Describe your asset
            </h1>
            <p className="text-muted-foreground">
              Tell us about the land you&apos;d like to set up a dashboard for. You can
              edit these details later from the asset overview.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 border-emerald-100 dark:border-emerald-900/50 p-6 md:p-8 space-y-6">
          <Field label="Asset name" required>
            <input
              type="text"
              value={form.farm_name}
              onChange={(e) => update('farm_name')(e.target.value)}
              placeholder="e.g. Meadowbrook Farm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </Field>

          <Field label="Asset type" required>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={form.asset_type === t}
                  onClick={() => update('asset_type')(form.asset_type === t ? '' : t)}
                />
              ))}
            </div>
          </Field>

          <Field label="Location / address" required hint="Where is the asset located?">
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location')(e.target.value)}
              placeholder="e.g. Yorkshire Dales, nr. Hawes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Region / country">
              <input
                type="text"
                value={form.region}
                onChange={(e) => update('region')(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </Field>

            <Field label="Size (hectares)">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.size_hectares}
                onChange={(e) => update('size_hectares')(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </Field>
          </div>

          <Field
            label="Short description"
            hint="Anything that would help an ecologist understand this asset at a glance."
          >
            <textarea
              value={form.description}
              onChange={(e) => update('description')(e.target.value)}
              placeholder="e.g. 120 ha mixed arable and pasture with a stream along the northern boundary…"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 resize-none"
            />
          </Field>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/hub/create"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {saving ? 'Creating…' : 'Create asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
