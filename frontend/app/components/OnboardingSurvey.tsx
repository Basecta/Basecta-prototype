'use client';

import { useState } from 'react';
import { submitSurvey } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'farmer' | 'land_manager' | 'investor' | '';

interface SurveyAnswers {
  // Q1–Q2
  how_heard: string;
  why_nature_credits: string;
  // Q3
  role: Role;
  // Farmer
  farm_size: string;
  farming_type: string;
  agri_env_schemes: string;
  hedges_wetlands: string;
  sold_credits: string;
  methodology_used: string;
  works_with_advisor: string;
  // Land manager
  num_parcels: string;
  owner_type: string;
  designated_land: string;
  reporting_obligations: string;
  // Investor
  org_type: string;
  investment_motivation: string;
  standards_needed: string;
  ticket_size: string;
  verified_or_pipeline: string;
  existing_land_contacts: string;
  // Q4–Q6
  digital_comfort: number;
  primary_goal: string;
  land_region: string;
  // Q7–Q9
  biodiversity_tracking_before: string;
  biggest_challenge: string;
  asset_owner_duration: string;
  // Q10
  interested_in_biodiversity: string;
  interest_duration: string;
  habitats_of_interest: string;
  aware_eu_nrl: string;
}

interface Props {
  token: string;
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-400'
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500'
      }`}
    >
      {label}
    </button>
  );
}

function RoleCard({
  label,
  description,
  icon,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
        selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-400'
          : 'border-gray-200 bg-white hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-indigo-500'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`font-semibold text-sm ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
      ))}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const stepTitles = [
  'Getting to know you',
  'Your role',
  'About your work',
  'Using the platform',
  'Your experience',
  'Biodiversity interest',
];

// Renders the survey as a plain card — positioning/animation is handled by the parent.
export function OnboardingSurvey({ token, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({
    how_heard: '',
    why_nature_credits: '',
    role: '',
    farm_size: '',
    farming_type: '',
    agri_env_schemes: '',
    hedges_wetlands: '',
    sold_credits: '',
    methodology_used: '',
    works_with_advisor: '',
    num_parcels: '',
    owner_type: '',
    designated_land: '',
    reporting_obligations: '',
    org_type: '',
    investment_motivation: '',
    standards_needed: '',
    ticket_size: '',
    verified_or_pipeline: '',
    existing_land_contacts: '',
    digital_comfort: 3,
    primary_goal: '',
    land_region: '',
    biodiversity_tracking_before: '',
    biggest_challenge: '',
    asset_owner_duration: '',
    interested_in_biodiversity: '',
    interest_duration: '',
    habitats_of_interest: '',
    aware_eu_nrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof SurveyAnswers) => (value: string | number) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const canProceed = (): boolean => {
    if (step === 0) return !!(answers.how_heard && answers.why_nature_credits);
    if (step === 1) return !!answers.role;
    if (step === 5) return !!answers.interested_in_biodiversity;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await submitSurvey(answers as unknown as Record<string, unknown>, token);
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save survey. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  // ── Step content ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <Question label="Q1. How did you hear about us?">
              <ChipGroup
                options={['Word of mouth', 'Social media', 'Search engine', 'Industry event', 'Partnership / referral', 'Other']}
                value={answers.how_heard}
                onChange={set('how_heard')}
              />
            </Question>
            <Question label="Q2. Why are you in the nature credits space?">
              <ChipGroup
                options={['Carbon credits', 'Biodiversity net gain', 'Habitat banking', 'Nature recovery', 'Financial opportunity', 'Regulatory compliance', 'Other']}
                value={answers.why_nature_credits}
                onChange={set('why_nature_credits')}
              />
            </Question>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Q3. Select the option that best describes you — we&apos;ll tailor the experience accordingly.
            </p>
            <RoleCard
              label="Farmer"
              description="I own or manage farmland and want to generate or track nature credits"
              icon="🌾"
              selected={answers.role === 'farmer'}
              onClick={() => set('role')('farmer')}
            />
            <RoleCard
              label="Land Manager"
              description="I manage multiple land parcels and need to report on biodiversity"
              icon="🗺️"
              selected={answers.role === 'land_manager'}
              onClick={() => set('role')('land_manager')}
            />
            <RoleCard
              label="Investor"
              description="I invest in nature-based solutions or biodiversity credits"
              icon="💼"
              selected={answers.role === 'investor'}
              onClick={() => set('role')('investor')}
            />
          </div>
        );

      case 2:
        if (answers.role === 'farmer') {
          return (
            <div className="space-y-6">
              <Question label="Farm size">
                <ChipGroup
                  options={['< 50 ha', '50–200 ha', '200–500 ha', '500–1,000 ha', '> 1,000 ha']}
                  value={answers.farm_size}
                  onChange={set('farm_size')}
                />
              </Question>
              <Question label="Farming type">
                <ChipGroup
                  options={['Arable', 'Livestock', 'Mixed', 'Horticulture', 'Organic', 'Other']}
                  value={answers.farming_type}
                  onChange={set('farming_type')}
                />
              </Question>
              <Question label="Enrolled in agri-environment schemes?">
                <ChipGroup
                  options={['Yes', 'No', 'Planning to']}
                  value={answers.agri_env_schemes}
                  onChange={set('agri_env_schemes')}
                />
              </Question>
              <Question label="Hedgerows or wetlands present on your land?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.hedges_wetlands}
                  onChange={set('hedges_wetlands')}
                />
              </Question>
              <Question label="Have you sold nature / carbon credits before?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.sold_credits}
                  onChange={set('sold_credits')}
                />
              </Question>
              {answers.sold_credits === 'Yes' && (
                <Question label="Which methodology did you use?">
                  <ChipGroup
                    options={['Verra VCS', 'Gold Standard', 'UK Woodland Carbon Code', 'Peatland Code', 'BNG', 'Other']}
                    value={answers.methodology_used}
                    onChange={set('methodology_used')}
                  />
                </Question>
              )}
              <Question label="Do you work with an advisor or consultant?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.works_with_advisor}
                  onChange={set('works_with_advisor')}
                />
              </Question>
            </div>
          );
        }

        if (answers.role === 'land_manager') {
          return (
            <div className="space-y-6">
              <Question label="Number of land parcels managed">
                <ChipGroup
                  options={['1–5', '6–20', '21–50', '51–200', '> 200']}
                  value={answers.num_parcels}
                  onChange={set('num_parcels')}
                />
              </Question>
              <Question label="Owner type">
                <ChipGroup
                  options={['Private owner', 'Public sector', 'NGO / Charity', 'Institutional', 'Tenant']}
                  value={answers.owner_type}
                  onChange={set('owner_type')}
                />
              </Question>
              <Question label="Any designated land (SSSI, NNR, etc.)?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.designated_land}
                  onChange={set('designated_land')}
                />
              </Question>
              <Question label="Do you have reporting obligations?">
                <ChipGroup
                  options={['Yes', 'No', 'Not sure']}
                  value={answers.reporting_obligations}
                  onChange={set('reporting_obligations')}
                />
              </Question>
            </div>
          );
        }

        if (answers.role === 'investor') {
          return (
            <div className="space-y-6">
              <Question label="Organisation type">
                <ChipGroup
                  options={['Family office', 'Asset manager', 'Corporate', 'Development finance', 'Other']}
                  value={answers.org_type}
                  onChange={set('org_type')}
                />
              </Question>
              <Question label="Primary investment motivation">
                <ChipGroup
                  options={['Compliance', 'Returns', 'ESG / Impact', 'Portfolio diversification', 'Other']}
                  value={answers.investment_motivation}
                  onChange={set('investment_motivation')}
                />
              </Question>
              {answers.investment_motivation === 'Compliance' && (
                <Question label="Standards you need to meet">
                  <ChipGroup
                    options={['Verra VCS', 'Gold Standard', 'TNFD', 'EU Taxonomy', 'Other']}
                    value={answers.standards_needed}
                    onChange={set('standards_needed')}
                  />
                </Question>
              )}
              <Question label="Ticket size range">
                <ChipGroup
                  options={['< £100k', '£100k–500k', '£500k–1M', '£1M–5M', '> £5M']}
                  value={answers.ticket_size}
                  onChange={set('ticket_size')}
                />
              </Question>
              <Question label="Preference">
                <ChipGroup
                  options={['Verified credits', 'Pipeline projects', 'Both']}
                  value={answers.verified_or_pipeline}
                  onChange={set('verified_or_pipeline')}
                />
              </Question>
              <Question label="Do you have existing relationships with landowners?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.existing_land_contacts}
                  onChange={set('existing_land_contacts')}
                />
              </Question>
            </div>
          );
        }
        return null;

      case 3:
        return (
          <div className="space-y-6">
            <Question label="Q4. Comfort with digital tools? (1 = not at all, 5 = very comfortable)">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">1</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={answers.digital_comfort}
                  onChange={(e) => set('digital_comfort')(Number(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">5</span>
                <span className="w-6 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {answers.digital_comfort}
                </span>
              </div>
            </Question>
            <Question label="Q5. What is your primary goal on this platform?">
              <ChipGroup
                options={['Monitor biodiversity', 'Generate credits', 'Trade credits', 'Research / learn']}
                value={answers.primary_goal}
                onChange={set('primary_goal')}
              />
            </Question>
            <Question label="Q6. Land region / country">
              <TextInput
                value={answers.land_region}
                onChange={set('land_region')}
                placeholder="e.g. Yorkshire, UK or Bavaria, Germany"
              />
            </Question>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Question label="Q7. How did you track biodiversity data before?">
              <ChipGroup
                options={['Spreadsheets', 'Paper records', 'Another platform', "Didn't track"]}
                value={answers.biodiversity_tracking_before}
                onChange={set('biodiversity_tracking_before')}
              />
            </Question>
            <Question label="Q8. What is your biggest challenge right now?">
              <ChipGroup
                options={['Data collection', 'Regulation / compliance', 'Finding buyers', 'Choosing methodology', 'Funding', 'Other']}
                value={answers.biggest_challenge}
                onChange={set('biggest_challenge')}
              />
            </Question>
            <Question label="Q9. How long have you been an asset owner?">
              <ChipGroup
                options={['< 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years']}
                value={answers.asset_owner_duration}
                onChange={set('asset_owner_duration')}
              />
            </Question>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Question label="Q10. Are you personally interested in biodiversity?">
              <ChipGroup
                options={['Yes', 'No']}
                value={answers.interested_in_biodiversity}
                onChange={set('interested_in_biodiversity')}
              />
            </Question>
            {answers.interested_in_biodiversity === 'Yes' && (
              <>
                <Question label="How long have you been interested?">
                  <ChipGroup
                    options={['< 1 year', '1–3 years', '3–5 years', '5+ years']}
                    value={answers.interest_duration}
                    onChange={set('interest_duration')}
                  />
                </Question>
                <Question label="Habitats of interest">
                  <ChipGroup
                    options={['Woodland', 'Grassland', 'Wetland', 'Coastal', 'Farmland', 'Multiple', 'Other']}
                    value={answers.habitats_of_interest}
                    onChange={set('habitats_of_interest')}
                  />
                </Question>
                <Question label="Are you aware of the EU Nature Restoration Law (EU NRL)?">
                  <ChipGroup
                    options={['Yes', 'No', 'Not sure']}
                    value={answers.aware_eu_nrl}
                    onChange={set('aware_eu_nrl')}
                  />
                </Question>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Onboarding Survey
            </p>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {stepTitles[step]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors shrink-0 ml-4"
          >
            Skip for now
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {renderStep()}
        {error && (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving…' : 'Complete survey'}
          </button>
        )}
      </div>
    </div>
  );
}
