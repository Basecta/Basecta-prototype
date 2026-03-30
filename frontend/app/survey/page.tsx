'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OnboardingSurvey } from '@/app/components/OnboardingSurvey';
import { getSurveyStatus } from '@/lib/api';
import { CheckCircle2Icon } from 'lucide-react';

type State = 'loading' | 'survey' | 'done';

export default function SurveyPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    getSurveyStatus(t)
      .then(({ submitted }) => setState(submitted ? 'done' : 'survey'))
      .catch(() => setState('survey'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      {state === 'loading' && null}

      {state === 'survey' && token && (
        <OnboardingSurvey
          token={token}
          onComplete={() => setState('done')}
          onSkip={() => router.replace('/hub')}
        />
      )}

      {state === 'done' && (
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center flex flex-col items-center gap-6">
          <CheckCircle2Icon className="size-14 text-green-500" strokeWidth={1.5} />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">Thank you!</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your responses have been recorded. They help us tailor Basecta to your needs.
            </p>
          </div>
          <Link
            href="/hub"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Return to Hub
          </Link>
        </div>
      )}
    </div>
  );
}
