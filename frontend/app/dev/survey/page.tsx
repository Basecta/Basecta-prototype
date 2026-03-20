'use client';

import { useState } from 'react';
import { OnboardingSurvey } from '../../components/OnboardingSurvey';

export default function SurveyDevPage() {
  const [key, setKey] = useState(0);
  const restart = () => setKey(k => k + 1);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <OnboardingSurvey
        key={key}
        token=""
        onComplete={restart}
        onSkip={restart}
        devMode
      />
    </div>
  );
}
