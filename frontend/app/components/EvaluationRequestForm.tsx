'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationAnswers {
  // Step 0 — Eligibility
  can_provide_folio_numbers: string;
  folio_notes: string;
  landowner_confirmed: string;
  // Step 1 — Timing
  preferred_month: string;
  flexibility: string;
  time_commitment: string;
  // Step 2 — Access
  access_type: string;
  access_notes: string;
  site_hazards: string;
  // Step 3 — Activities & livestock
  planned_activities: string;
  activity_notes: string;
  livestock_present: string;
  livestock_management: string;
  additional_notes: string;
}

interface Props {
  onComplete: (answers: EvaluationAnswers) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitError?: string;
}

// ─── Sub-components (match OnboardingSurvey look & feel) ─────────────────────

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

function Question({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{hint}</p>}
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
        <Chip
          key={opt}
          label={opt}
          selected={value === opt}
          onClick={() => onChange(value === opt ? '' : opt)}
        />
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
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 resize-none"
    />
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400 min-w-[140px] shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-100 font-medium break-words">
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const stepTitles = [
  'Eligibility',
  'Timing & availability',
  'Site access',
  'Land use & livestock',
  'Review & submit',
];

const FIELD_SEASON_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October'];
const OFF_SEASON_MONTHS = ['November', 'December', 'January', 'February', 'March'];

export function EvaluationRequestForm({ onComplete, onCancel, submitting = false, submitError = '' }: Props) {
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [slideIn, setSlideIn] = useState(true);
  const incomingScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const [answers, setAnswers] = useState<EvaluationAnswers>({
    can_provide_folio_numbers: '',
    folio_notes: '',
    landowner_confirmed: '',
    preferred_month: '',
    flexibility: '',
    time_commitment: '',
    access_type: '',
    access_notes: '',
    site_hazards: '',
    planned_activities: '',
    activity_notes: '',
    livestock_present: '',
    livestock_management: '',
    additional_notes: '',
  });

  const cleanupTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleCleanup = (key: string, fn: () => void) => {
    clearTimeout(cleanupTimers.current[key]);
    cleanupTimers.current[key] = setTimeout(fn, 500);
  };
  const cancelCleanup = (key: string) => {
    clearTimeout(cleanupTimers.current[key]);
    delete cleanupTimers.current[key];
  };

  const set = (key: keyof EvaluationAnswers) => (value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

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

  useEffect(() => {
    if (incomingScrollRef.current) incomingScrollRef.current.scrollTop = 0;
  }, [step]);

  const goTo = (n: number) => {
    setPrevStep(step);
    setDir(n > step ? 1 : -1);
    setStep(n);
    setSlideIn(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setSlideIn(true)));
    setTimeout(() => setPrevStep(null), 350);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(answers.can_provide_folio_numbers && answers.landowner_confirmed);
      case 1:
        return !!(answers.preferred_month && answers.flexibility && answers.time_commitment);
      case 2:
        return !!answers.access_type;
      case 3: {
        const base = !!(answers.planned_activities && answers.livestock_present);
        return answers.livestock_present === 'Yes'
          ? base && !!answers.livestock_management
          : base;
      }
      case 4:
        return true;
      default:
        return true;
    }
  };

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  // ── Step content ────────────────────────────────────────────────────────────

  const renderStep = (s: number = step) => {
    switch (s) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                A few eligibility checks before we send your request to an ecologist.
              </p>
            </div>
            <Question
              label="Q1. Are you the landowner, or do you have explicit permission from the landowner to request this survey?"
            >
              <ChipGroup
                options={['I am the landowner', 'I have written permission', 'Not yet']}
                value={answers.landowner_confirmed}
                onChange={set('landowner_confirmed')}
              />
            </Question>
            <Question
              label="Q2. To receive nature credits, you'll need to be able to produce folio (title) numbers on demand. Are you willing and able to do that?"
              hint="Folio / title numbers are how the ecologist can verify the land parcel ownership."
            >
              <ChipGroup
                options={['Yes', 'Not sure — need help', 'No']}
                value={answers.can_provide_folio_numbers}
                onChange={set('can_provide_folio_numbers')}
              />
            </Question>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                answers.can_provide_folio_numbers && answers.can_provide_folio_numbers !== 'Yes'
                  ? 'max-h-[200px] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pt-2">
                <Question label="Add a note (optional)" hint="What's blocking you? We'll pass this along.">
                  <TextArea
                    value={answers.folio_notes}
                    onChange={set('folio_notes')}
                    placeholder="e.g. Awaiting probate, parcel split, etc."
                  />
                </Question>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                The field season runs <strong>April–October</strong>. Surveys during this
                window give the most accurate identification of plant species and habitats.
              </p>
            </div>
            <Question label="Q3. Preferred month for the evaluation">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Field season</p>
                <ChipGroup
                  options={FIELD_SEASON_MONTHS}
                  value={answers.preferred_month}
                  onChange={set('preferred_month')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">Off-season</p>
                <ChipGroup
                  options={OFF_SEASON_MONTHS}
                  value={answers.preferred_month}
                  onChange={set('preferred_month')}
                />
              </div>
            </Question>
            <Question label="Q4. How flexible is this date?">
              <ChipGroup
                options={['Fixed', '± 1 week', '± 1 month', 'Fully flexible']}
                value={answers.flexibility}
                onChange={set('flexibility')}
              />
            </Question>
            <Question
              label="Q5. How much time can you commit during the visit?"
              hint="Time you (or a representative) can spend on-site with the ecologist."
            >
              <ChipGroup
                options={[
                  '< 1 hour',
                  '1–2 hours',
                  'Half day',
                  'Full day',
                  'Available as needed',
                ]}
                value={answers.time_commitment}
                onChange={set('time_commitment')}
              />
            </Question>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Question label="Q6. How will the ecologist access the land?">
              <ChipGroup
                options={[
                  'Open access',
                  'Gated — key provided',
                  'Escorted by owner / manager',
                  'Restricted — prior permission needed',
                ]}
                value={answers.access_type}
                onChange={set('access_type')}
              />
            </Question>
            <Question
              label="Q7. Access instructions or meeting point"
              hint="Optional — gate codes, parking, who to meet, etc."
            >
              <TextInput
                value={answers.access_notes}
                onChange={set('access_notes')}
                placeholder="e.g. Park at the farmhouse, meet by the barn at 9am"
              />
            </Question>
            <Question
              label="Q8. Any site hazards the ecologist should know about?"
              hint="Optional — steep terrain, bulls, electric fences, machinery, etc."
            >
              <TextArea
                value={answers.site_hazards}
                onChange={set('site_hazards')}
                placeholder="Describe any hazards or restricted areas…"
              />
            </Question>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Question
              label="Q9. Planned agricultural activities during the evaluation window?"
              hint="Activities can disturb habitats and affect survey accuracy."
            >
              <ChipGroup
                options={[
                  'None planned',
                  'Mowing / cutting',
                  'Ploughing',
                  'Spraying',
                  'Harvesting',
                  'Grazing rotation',
                  'Other',
                ]}
                value={answers.planned_activities}
                onChange={set('planned_activities')}
              />
            </Question>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                answers.planned_activities && answers.planned_activities !== 'None planned'
                  ? 'max-h-[200px] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pt-2">
                <Question label="Details (dates, fields affected)">
                  <TextInput
                    value={answers.activity_notes}
                    onChange={set('activity_notes')}
                    placeholder="e.g. Silage cut planned first week of June"
                  />
                </Question>
              </div>
            </div>
            <div>
              <Question label="Q10. Is livestock present on the land?">
                <ChipGroup
                  options={['Yes', 'No']}
                  value={answers.livestock_present}
                  onChange={(v) => {
                    set('livestock_present')(v);
                    if (v !== 'Yes')
                      scheduleCleanup('livestock', () => set('livestock_management')(''));
                    else cancelCleanup('livestock');
                  }}
                />
              </Question>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  answers.livestock_present === 'Yes'
                    ? 'max-h-[260px] opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pt-6">
                  <Question
                    label="Q11. Can livestock be moved or contained during the survey?"
                    hint="Ideally livestock should be moved off or contained so the ecologist can safely survey the habitat."
                  >
                    <ChipGroup
                      options={[
                        'Yes — can be moved',
                        'Yes — can be contained / fenced',
                        'Partial — some fields only',
                        'No — free-roaming',
                      ]}
                      value={answers.livestock_management}
                      onChange={set('livestock_management')}
                    />
                  </Question>
                </div>
              </div>
            </div>
            <Question label="Q12. Anything else the ecologist should know?" hint="Optional">
              <TextArea
                value={answers.additional_notes}
                onChange={set('additional_notes')}
                placeholder="Recent land management changes, species sightings, concerns…"
              />
            </Question>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review your answers before sending the request to an ecologist.
            </p>

            <ReviewSection title="Eligibility">
              <ReviewRow label="Landowner status" value={answers.landowner_confirmed} />
              <ReviewRow label="Can provide folio numbers" value={answers.can_provide_folio_numbers} />
              {answers.folio_notes && <ReviewRow label="Folio note" value={answers.folio_notes} />}
            </ReviewSection>

            <ReviewSection title="Timing & availability">
              <ReviewRow label="Preferred month" value={answers.preferred_month} />
              <ReviewRow label="Flexibility" value={answers.flexibility} />
              <ReviewRow label="Time commitment" value={answers.time_commitment} />
            </ReviewSection>

            <ReviewSection title="Site access">
              <ReviewRow label="Access type" value={answers.access_type} />
              {answers.access_notes && <ReviewRow label="Meeting point" value={answers.access_notes} />}
              {answers.site_hazards && <ReviewRow label="Hazards" value={answers.site_hazards} />}
            </ReviewSection>

            <ReviewSection title="Land use & livestock">
              <ReviewRow label="Planned activities" value={answers.planned_activities} />
              {answers.activity_notes && <ReviewRow label="Activity details" value={answers.activity_notes} />}
              <ReviewRow label="Livestock present" value={answers.livestock_present} />
              {answers.livestock_present === 'Yes' && (
                <ReviewRow label="Livestock management" value={answers.livestock_management} />
              )}
              {answers.additional_notes && (
                <ReviewRow label="Additional notes" value={answers.additional_notes} />
              )}
            </ReviewSection>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-2xl flex flex-col h-[700px] max-h-[90vh]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Request Ecologist Evaluation
            </p>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
              {stepTitles[step]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors shrink-0 ml-4 cursor-pointer"
          >
            Cancel
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
        <div
          ref={incomingScrollRef}
          className="absolute inset-0 overflow-y-auto px-6 py-6 survey-scroll"
          style={{
            transform: slideIn ? 'translateX(0)' : `translateX(${dir === 1 ? '100%' : '-100%'})`,
            transition: slideIn ? 'transform 350ms ease-in-out' : 'none',
          }}
        >
          {renderStep()}
        </div>

        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-300 ${
            canScrollUp ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="animate-bounce text-gray-400 dark:text-gray-500">
            <ChevronUp className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-opacity duration-300 ${
            canScrollDown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="animate-bounce text-gray-400 dark:text-gray-500">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center shrink-0">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${
            step > 0 ? 'max-w-[120px] opacity-100 mr-3' : 'max-w-0 opacity-0 mr-0'
          }`}
        >
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
            {step === TOTAL_STEPS - 2 ? 'Review answers' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(answers)}
            disabled={!canProceed() || submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <CheckIcon className="size-4" />
            {submitting ? 'Sending…' : 'Finalise & send to ecologist'}
          </button>
        )}
      </div>

      {submitError && (
        <div className="px-6 pb-4 shrink-0">
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
            {submitError}
          </div>
        </div>
      )}
    </div>
  );
}
