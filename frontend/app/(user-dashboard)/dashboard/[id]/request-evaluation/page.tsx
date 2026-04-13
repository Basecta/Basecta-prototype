'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2Icon } from 'lucide-react';
import { EvaluationRequestForm, type EvaluationAnswers } from '@/app/components/EvaluationRequestForm';
import { initAuth } from '@/lib/auth-store';
import { submitEvaluationRequest } from '@/lib/api';

type State = 'loading' | 'form' | 'done';

export default function RequestEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const init = async () => {
      const token = await initAuth();
      if (!token) {
        router.replace('/login');
        return;
      }
      setState('form');
    };
    init();
  }, [router]);

  const handleSubmit = async (answers: EvaluationAnswers) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitEvaluationRequest(assetId, answers as unknown as Record<string, unknown>);
      setState('done');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-8">
      {state === 'loading' && null}

      {state === 'form' && (
        <EvaluationRequestForm
          onComplete={handleSubmit}
          onCancel={() => router.replace(`/dashboard/${assetId}`)}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {state === 'done' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-10 max-w-md w-full text-center flex flex-col items-center gap-6">
          <CheckCircle2Icon className="size-14 text-green-500" strokeWidth={1.5} />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Request submitted
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Your responses have been recorded. An ecologist will be in touch to
              organise a meeting and arrange the on-site survey.
            </p>
          </div>
          <Link
            href={`/dashboard/${assetId}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Back to Asset Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
