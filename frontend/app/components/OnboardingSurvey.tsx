'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  onComplete: () => void;
  onSkip: () => void;
  devMode?: boolean;
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
          ? 'border-primary bg-primary/20 text-gray-900'
          : 'border-gray-200 bg-white text-gray-700 hover:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary'
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
          ? 'border-primary bg-primary/20'
          : 'border-gray-200 bg-white hover:border-primary dark:bg-gray-800 dark:border-gray-600 dark:hover:border-primary'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`font-semibold text-sm ${selected ? 'text-gray-900' : 'text-gray-800 dark:text-gray-200'}`}>
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
  otherValue,
  onOtherChange,
  otherTrigger = 'Other',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
  otherTrigger?: string;
}) {
  const showOther = value === otherTrigger && onOtherChange !== undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={value === opt}
            onClick={() => {
              const next = value === opt ? '' : opt;
              onChange(next);
              if (next !== otherTrigger) onOtherChange?.('');
            }}
          />
        ))}
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showOther ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pt-2"><div className="p-[3px]">
          <TextInput
            value={otherValue ?? ''}
            onChange={onOtherChange ?? (() => {})}
            placeholder="Please specify…"
          />
        </div></div>
      </div>
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
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
    />
  );
}


function ThumbDigit({ value }: { value: number }) {
  const [state, setState] = useState<{ current: number; prev: number | null; dir: 1 | -1 }>({
    current: value,
    prev: null,
    dir: 1,
  });
  const currentRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevValue = currentRef.current;
    if (value === prevValue) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    currentRef.current = value;
    setState({ current: value, prev: prevValue, dir: value > prevValue ? 1 : -1 });
    timerRef.current = setTimeout(() => setState(s => ({ ...s, prev: null })), 200);
  }, [value]);

  const { current, prev, dir } = state;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {prev !== null && (
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 leading-none ${dir === 1 ? 'digit-out-left' : 'digit-out-right'}`}>
          {prev}
        </span>
      )}
      <span
        key={current}
        className={`absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 leading-none ${prev !== null ? (dir === 1 ? 'digit-in-from-right' : 'digit-in-from-left') : ''}`}
      >
        {current}
      </span>
    </div>
  );
}

function RatingSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);

  const isDragging = dragRatio !== null;
  const displayPercent = isDragging ? dragRatio * 100 : ((value - 1) / 4) * 100;
  const displayValue = isDragging ? Math.round(dragRatio * 4) + 1 : value;

  const snapTransition = 'left 200ms ease-out, width 200ms ease-out';

  const getRatioFromX = (clientX: number) => {
    if (!trackRef.current) return null;
    const { left, width } = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - left) / width));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const ratio = getRatioFromX(e.clientX);
    if (ratio === null) return;

    const snappedValue = Math.round(ratio * 4) + 1;
    const snappedRatio = (snappedValue - 1) / 4;

    let hasDragged = false;
    let snapTimeout: ReturnType<typeof setTimeout> | null = null;

    // Enable transition first, then move to snapped position next frame
    // so the browser commits the transition property before the position changes.
    setIsSnapping(true);
    requestAnimationFrame(() => {
      if (!hasDragged) {
        setDragRatio(snappedRatio);
        onChange(snappedValue);
        snapTimeout = setTimeout(() => {
          setDragRatio(null);
          setIsSnapping(false);
        }, 200);
      }
    });

    const onMove = (e: MouseEvent) => {
      if (!hasDragged) {
        hasDragged = true;
        if (snapTimeout) clearTimeout(snapTimeout);
        setIsSnapping(false); // switch to immediate-follow mode
      }
      const r = getRatioFromX(e.clientX);
      if (r !== null) setDragRatio(r);
    };

    const onUp = (e: MouseEvent) => {
      if (hasDragged) {
        const r = getRatioFromX(e.clientX);
        const sv = r !== null ? Math.round(r * 4) + 1 : value;
        const sr = (sv - 1) / 4;
        onChange(sv);
        setIsSnapping(true);
        setDragRatio(sr);
        setTimeout(() => { setDragRatio(null); setIsSnapping(false); }, 200);
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">1</span>
      <div
        className="relative flex-1 flex items-center py-3 px-3 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
      >
        <div
          ref={trackRef}
          className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full"
        >
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full pointer-events-none"
            style={{
              width: `${displayPercent}%`,
              transition: isSnapping ? 'width 200ms ease-out' : 'none',
            }}
          />
          {/* Step dots */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-400 border border-gray-300 dark:border-gray-600 pointer-events-none z-10"
              style={{ left: `${(i / 4) * 100}%` }}
            />
          ))}
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-primary border-[3px] border-white dark:border-gray-900 shadow-md pointer-events-none z-20 overflow-hidden"
            style={{
              left: `${displayPercent}%`,
              transition: isSnapping ? snapTransition : 'none',
            }}
          >
            <ThumbDigit value={displayValue} />
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">5</span>
    </div>
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
export function OnboardingSurvey({ onComplete, onSkip, devMode = false }: Props) {
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [slideIn, setSlideIn] = useState(true);
  const incomingScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkScroll = useCallback(() => {
    const el = incomingScrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight > el.clientHeight + el.scrollTop + 4);
    setCanScrollUp(el.scrollTop > 4);
  }, []);

  useEffect(() => {
    const el = incomingScrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [step, checkScroll]);

  const goTo = (n: number) => {
    setPrevStep(step);
    setDir(n > step ? 1 : -1);
    setStep(n);
    setSlideIn(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setSlideIn(true)));
    setTimeout(() => setPrevStep(null), 350);
  };

  useEffect(() => {
    if (incomingScrollRef.current) incomingScrollRef.current.scrollTop = 0;
  }, [step]);
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
  const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setOther = (key: string) => (value: string) =>
    setOtherAnswers((prev) => ({ ...prev, [key]: value }));

  const cleanupTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleCleanup = (key: string, fn: () => void) => {
    clearTimeout(cleanupTimers.current[key]);
    cleanupTimers.current[key] = setTimeout(fn, 500);
  };
  const cancelCleanup = (key: string) => {
    clearTimeout(cleanupTimers.current[key]);
    delete cleanupTimers.current[key];
  };

  const set = (key: keyof SurveyAnswers) => (value: string | number) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(answers.how_heard && answers.why_nature_credits);
      case 1:
        return !!answers.role;
      case 2:
        if (answers.role === 'farmer') {
          const base = !!(answers.farm_size && answers.farming_type && answers.agri_env_schemes && answers.hedges_wetlands && answers.sold_credits && answers.works_with_advisor);
          return answers.sold_credits === 'Yes' ? base && !!answers.methodology_used : base;
        }
        if (answers.role === 'land_manager')
          return !!(answers.num_parcels && answers.owner_type && answers.designated_land && answers.reporting_obligations);
        if (answers.role === 'investor') {
          const base = !!(answers.org_type && answers.investment_motivation && answers.ticket_size && answers.verified_or_pipeline && answers.existing_land_contacts);
          return answers.investment_motivation === 'Compliance' ? base && !!answers.standards_needed : base;
        }
        return true;
      case 3:
        return !!(answers.primary_goal && answers.land_region);
      case 4: {
        const isAssetOwner = answers.role === 'farmer' || answers.role === 'land_manager';
        return !!(answers.biodiversity_tracking_before && answers.biggest_challenge && (!isAssetOwner || answers.asset_owner_duration));
      }
      case 5:
        if (answers.interested_in_biodiversity === 'Yes')
          return !!(answers.interest_duration && answers.habitats_of_interest && answers.aware_eu_nrl);
        return !!answers.interested_in_biodiversity;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (devMode) { onComplete(); return; }
    setLoading(true);
    setError('');
    try {
      await submitSurvey(answers as unknown as Record<string, unknown>);
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

  const renderStep = (s: number = step) => {
    switch (s) {
      case 0:
        return (
          <div className="space-y-6">
            <Question label="Q1. How did you hear about us?">
              <ChipGroup
                options={['Word of mouth', 'Social media', 'Search engine', 'Industry event', 'Partnership / referral', 'Other']}
                value={answers.how_heard}
                onChange={set('how_heard')}
                otherValue={otherAnswers['how_heard']}
                onOtherChange={setOther('how_heard')}
              />
            </Question>
            <Question label="Q2. Why are you in the nature credits space?">
              <ChipGroup
                options={['Carbon credits', 'Biodiversity net gain', 'Habitat banking', 'Nature recovery', 'Financial opportunity', 'Regulatory compliance', 'Other']}
                value={answers.why_nature_credits}
                onChange={set('why_nature_credits')}
                otherValue={otherAnswers['why_nature_credits']}
                onOtherChange={setOther('why_nature_credits')}
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
              onClick={() => set('role')(answers.role === 'farmer' ? '' : 'farmer')}
            />
            <RoleCard
              label="Land Manager"
              description="I manage multiple land parcels and need to report on biodiversity"
              icon="🗺️"
              selected={answers.role === 'land_manager'}
              onClick={() => set('role')(answers.role === 'land_manager' ? '' : 'land_manager')}
            />
            <RoleCard
              label="Investor"
              description="I invest in nature-based solutions or biodiversity credits"
              icon="💼"
              selected={answers.role === 'investor'}
              onClick={() => set('role')(answers.role === 'investor' ? '' : 'investor')}
            />
          </div>
        );

      case 2:
        if (answers.role === 'farmer') {
          return (
            <div className="space-y-6">
              <Question label="Farm size (hectares)">
                <ChipGroup
                  options={['< 50', '50–200', '200–500', '500–1,000', '> 1,000']}
                  value={answers.farm_size}
                  onChange={set('farm_size')}
                />
              </Question>
              <Question label="Farming type">
                <ChipGroup
                  options={['Arable', 'Livestock', 'Mixed', 'Horticulture', 'Organic', 'Other']}
                  value={answers.farming_type}
                  onChange={set('farming_type')}
                  otherValue={otherAnswers['farming_type']}
                  onOtherChange={setOther('farming_type')}
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
              <div>
                <Question label="Have you sold nature / carbon credits before?">
                  <ChipGroup
                    options={['Yes', 'No']}
                    value={answers.sold_credits}
                    onChange={(v) => {
                      set('sold_credits')(v);
                      if (v !== 'Yes') scheduleCleanup('methodology', () => { set('methodology_used')(''); setOtherAnswers(p => ({ ...p, methodology_used: '' })); });
                      else cancelCleanup('methodology');
                    }}
                  />
                </Question>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${answers.sold_credits === 'Yes' ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pt-6">
                    <Question label="Which methodology did you use?">
                      <ChipGroup
                        options={['Verra VCS', 'Gold Standard', 'UK Woodland Carbon Code', 'Peatland Code', 'BNG', 'Other']}
                        value={answers.methodology_used}
                        onChange={set('methodology_used')}
                        otherValue={otherAnswers['methodology_used']}
                        onOtherChange={setOther('methodology_used')}
                      />
                    </Question>
                  </div>
                </div>
              </div>
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
                  otherValue={otherAnswers['org_type']}
                  onOtherChange={setOther('org_type')}
                />
              </Question>
              <div>
                <Question label="Primary investment motivation">
                  <ChipGroup
                    options={['Compliance', 'Returns', 'ESG / Impact', 'Portfolio diversification', 'Other']}
                    value={answers.investment_motivation}
                    onChange={(v) => {
                      set('investment_motivation')(v);
                      if (v !== 'Compliance') scheduleCleanup('standards', () => { set('standards_needed')(''); setOtherAnswers(p => ({ ...p, standards_needed: '' })); });
                      else cancelCleanup('standards');
                    }}
                    otherValue={otherAnswers['investment_motivation']}
                    onOtherChange={setOther('investment_motivation')}
                  />
                </Question>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${answers.investment_motivation === 'Compliance' ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pt-6">
                    <Question label="Standards you need to meet">
                      <ChipGroup
                        options={['Verra VCS', 'Gold Standard', 'TNFD', 'EU Taxonomy', 'Other']}
                        value={answers.standards_needed}
                        onChange={set('standards_needed')}
                        otherValue={otherAnswers['standards_needed']}
                        onOtherChange={setOther('standards_needed')}
                      />
                    </Question>
                  </div>
                </div>
              </div>
              <Question label="Ticket size range">
                <ChipGroup
                  options={['< €100k', '€100k–500k', '€500k–1M', '€1M–5M', '> €5M']}
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
              <RatingSlider
                value={answers.digital_comfort}
                onChange={(v) => set('digital_comfort')(v)}
              />
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
                otherTrigger="Another platform"
                otherValue={otherAnswers['biodiversity_tracking_before']}
                onOtherChange={setOther('biodiversity_tracking_before')}
              />
            </Question>
            <div>
              <Question label="Q8. What is your biggest challenge right now?">
                <ChipGroup
                  options={['Data collection', 'Regulation / compliance', 'Finding buyers', 'Choosing methodology', 'Funding', 'Other']}
                  value={answers.biggest_challenge}
                  onChange={set('biggest_challenge')}
                  otherValue={otherAnswers['biggest_challenge']}
                  onOtherChange={setOther('biggest_challenge')}
                />
              </Question>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${answers.role === 'farmer' || answers.role === 'land_manager' ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-6">
                  <Question label="Q9. How long have you been an asset owner?">
                    <ChipGroup
                      options={['< 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years']}
                      value={answers.asset_owner_duration}
                      onChange={set('asset_owner_duration')}
                    />
                  </Question>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Question label="Q10. Are you personally interested in biodiversity?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.interested_in_biodiversity}
                  onChange={(v) => {
                    set('interested_in_biodiversity')(v);
                    if (v !== 'Yes') scheduleCleanup('biodiversity', () => {
                      set('interest_duration')('');
                      set('habitats_of_interest')('');
                      set('aware_eu_nrl')('');
                      setOtherAnswers(p => ({ ...p, habitats_of_interest: '' }));
                    });
                    else cancelCleanup('biodiversity');
                  }}
                />
              </Question>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${answers.interested_in_biodiversity === 'Yes' ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-6 pt-6">
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
                    otherValue={otherAnswers['habitats_of_interest']}
                    onOtherChange={setOther('habitats_of_interest')}
                  />
                </Question>
                <Question label="Are you aware of the EU Nature Restoration Law (EU NRL)?">
                  <ChipGroup
                    options={['Yes', 'No', 'Not sure']}
                    value={answers.aware_eu_nrl}
                    onChange={set('aware_eu_nrl')}
                  />
                </Question>
              </div>
            </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-2xl flex flex-col h-[700px] max-h-[90vh]">
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
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors shrink-0 ml-4 cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-hidden relative">
        {/* Outgoing panel */}
        {prevStep !== null && (
          <div
            className="absolute inset-0 overflow-y-auto px-6 py-6 survey-scroll"
            style={{
              transform: slideIn ? `translateX(${dir === 1 ? '-100%' : '100%'})` : 'translateX(0)',
              transition: 'transform 350ms ease-in-out',
            }}
          >
            {renderStep(prevStep)}
          </div>
        )}
        {/* Incoming panel */}
        <div
          ref={incomingScrollRef}
          className="absolute inset-0 overflow-y-auto px-6 py-6 survey-scroll"
          style={{
            transform: slideIn ? 'translateX(0)' : `translateX(${dir === 1 ? '100%' : '-100%'})`,
            transition: slideIn ? 'transform 350ms ease-in-out' : 'none',
          }}
        >
          {renderStep()}
          {error && (
            <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Scroll-up indicator */}
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-300 ${canScrollUp ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="animate-bounce text-gray-400 dark:text-gray-500">
            <ChevronUp className="w-5 h-5" />
          </div>
        </div>

        {/* Scroll-down indicator */}
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-300 ${canScrollDown ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="animate-bounce text-gray-400 dark:text-gray-500">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center shrink-0">
        <div className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${step > 0 ? 'max-w-[120px] opacity-100 mr-3' : 'max-w-0 opacity-0 mr-0'}`}>
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            Back
          </button>
        </div>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            disabled={!canProceed()}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {loading ? 'Saving…' : 'Complete survey'}
          </button>
        )}
      </div>
    </div>
  );
}
