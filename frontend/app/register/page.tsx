'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendVerificationCode, verifyCode, register, loginWithGoogle } from '@/lib/api';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';
import { OnboardingSurvey } from '../components/OnboardingSurvey';

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_VALIDITY_SECONDS = 600; // 10 minutes, must match backend

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function RegisterPage() {
  const router = useRouter();
  // 0 = registration form, 1 = verify code, 2 = onboarding survey
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // ── Verification state ───────────────────────────────────────────────────────
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [silentRedirectMsg, setSilentRedirectMsg] = useState('');

  // Code expiry timer
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [codeTimeLeft, setCodeTimeLeft] = useState(0);

  // Stored verified token — allows registration retry after a form-level error
  // (e.g. username taken) without requiring re-verification
  const [storedVerifiedToken, setStoredVerifiedToken] = useState('');

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [authToken, setAuthToken] = useState('');

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Code expiry countdown
  useEffect(() => {
    if (!codeExpiresAt) return;
    const tick = () => setCodeTimeLeft(Math.max(0, Math.floor((codeExpiresAt.getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [codeExpiresAt]);

  // Focus first digit box when verification panel slides in
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => digitRefs.current[0]?.focus(), 520);
    }
  }, [step]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const codeExpired = codeExpiresAt !== null && codeTimeLeft === 0;
  // Resend is available when cooldown is done OR the code has expired OR attempts are exhausted
  const canResend = !formLoading && (resendCooldown === 0 || codeExpired || attemptsLeft === 0);

  const resetVerifyPanel = (email: string) => {
    setLastSentEmail(email);
    setStoredVerifiedToken('');
    setDigits(['', '', '', '', '', '']);
    setVerifyError('');
    setSilentRedirectMsg('');
    setAttemptsLeft(3);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setCodeExpiresAt(new Date(Date.now() + CODE_VALIDITY_SECONDS * 1000));
  };

  // ── Handlers: form ───────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: false }));
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSilentRedirectMsg('');

    const errors: Record<string, boolean> = {};
    if (!formData.username.trim()) errors.username = true;
    if (!formData.email.trim()) errors.email = true;
    if (!formData.password) errors.password = true;
    if (!formData.confirmPassword) errors.confirmPassword = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: true });
      setFormError('Passwords do not match');
      return;
    }

    // If the email was already verified but registration failed (e.g. username taken),
    // attempt to register directly with the stored token before sending a new code.
    if (storedVerifiedToken && formData.email === lastSentEmail) {
      setFormLoading(true);
      try {
        const data = await register(formData.username, formData.email, formData.password, storedVerifiedToken);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthToken(data.access_token);
        setStoredVerifiedToken('');
        setStep(2);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.toLowerCase().includes('verification')) {
          // Still a form-level problem (e.g. username taken again) — show on form
          setFormError(msg);
          setFormLoading(false);
          return;
        }
        // Verified token expired — clear it and fall through to send a new code
        setStoredVerifiedToken('');
      } finally {
        setFormLoading(false);
      }
    }

    // Code already sent to this email and cooldown is still active — go back to verify panel
    if (resendCooldown > 0 && formData.email === lastSentEmail && !codeExpired) {
      setSilentRedirectMsg('A code was already sent to this email.');
      setStep(1);
      return;
    }

    setFormLoading(true);
    try {
      await sendVerificationCode(formData.email);
      resetVerifyPanel(formData.email);
      setStep(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Handlers: digit inputs ───────────────────────────────────────────────────
  const submitCode = async (code: string) => {
    setVerifyLoading(true);
    setVerifyError('');
    setSilentRedirectMsg('');
    try {
      const { verified_token } = await verifyCode(formData.email, code);
      // Code correct — attempt registration immediately
      try {
        const data = await register(formData.username, formData.email, formData.password, verified_token);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthToken(data.access_token);
        setStoredVerifiedToken('');
        setStep(2);
      } catch (registerErr: unknown) {
        // Registration failed (e.g. username taken) — store the token so the user
        // can go back, fix the issue, and retry without re-verifying their email.
        const msg = registerErr instanceof Error ? registerErr.message : 'Registration failed.';
        setStoredVerifiedToken(verified_token);
        setVerifyError(`${msg} Go back to fix the issue and try again.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setVerifyError(msg);
      setStoredVerifiedToken('');

      const match = msg.match(/(\d+) attempt/);
      if (match) {
        setAttemptsLeft(parseInt(match[1]));
      } else if (msg.includes('No attempts remaining') || msg.includes('Maximum attempts')) {
        setAttemptsLeft(0);
      }

      setDigits(['', '', '', '', '', '']);
      setTimeout(() => digitRefs.current[0]?.focus(), 0);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setVerifyError('');

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }

    if (digit && newDigits.every(d => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex(d => d === '');
    digitRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (newDigits.every(d => d !== '')) submitCode(newDigits.join(''));
  };

  const handleResend = async () => {
    if (!canResend) return;
    setVerifyError('');
    setSilentRedirectMsg('');
    setFormLoading(true);
    try {
      await sendVerificationCode(formData.email);
      resetVerifyPanel(formData.email);
      digitRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.';
      setVerifyError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Google sign-in ───────────────────────────────────────────────────────────
  useEffect(() => {
    const initGoogle = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: { credential: string }) => {
          setFormLoading(true);
          setFormError('');
          try {
            const data = await loginWithGoogle(response.credential);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.is_new_user) {
              setAuthToken(data.access_token);
              setStep(2);
            } else {
              router.push('/hub');
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
            setFormError(msg);
          } finally {
            setFormLoading(false);
          }
        },
      });
      const btn = document.getElementById('google-register-btn');
      if (btn) google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', width: btn.offsetWidth });
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      script?.addEventListener('load', initGoogle);
    }
  }, []);

  const goToHub = () => router.push('/hub');

  const panelStyle = (panelStep: number): React.CSSProperties => ({
    transform: `translateX(${(panelStep - step) * 100}%)`,
    transition: 'transform 500ms ease-in-out',
  });

  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">

      {/* ── Panel 0: Registration form ── */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 py-12"
        style={panelStyle(0)}
      >
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Create Account</h1>

          {formError && <div className="mb-4"><AlertMessage type="error" message={formError} /></div>}

          <form onSubmit={handleSendCode} className="space-y-4" noValidate>
            <FormInput
              label="Username"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
              autoComplete="off"
              error={fieldErrors.username}
            />
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email"
              autoComplete="email"
              error={fieldErrors.email}
            />
            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              helpText="Must be at least 8 characters with uppercase, lowercase, number, and a special character (e.g. !@#$_-)"
              autoComplete="new-password"
              error={fieldErrors.password}
            />
            <FormInput
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {formLoading ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>

          <div className="flex items-center gap-2 my-4">
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
          </div>

          <div id="google-register-btn" className="w-full" />

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-500 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* ── Panel 1: Verification code ── */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 py-12"
        style={panelStyle(1)}
      >
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">Check your email</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-1">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-gray-700 dark:text-gray-200">{formData.email}</span>
          </p>

          {/* Code expiry timer */}
          {codeExpiresAt && (
            <p className={`text-center text-xs mb-6 ${codeExpired ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {codeExpired ? 'Code has expired — request a new one below' : `Code expires in ${formatTime(codeTimeLeft)}`}
            </p>
          )}

          {/* Silent redirect notice */}
          {silentRedirectMsg && !verifyError && (
            <div className="mb-4">
              <AlertMessage type="info" message={silentRedirectMsg} />
            </div>
          )}

          {verifyError && <div className="mb-4"><AlertMessage type="error" message={verifyError} /></div>}

          {/* Digit boxes */}
          <div className="flex justify-center gap-3 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { digitRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={attemptsLeft === 0 || verifyLoading || codeExpired}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleDigitKeyDown(i, e)}
                onPaste={handleDigitPaste}
                className="w-11 h-14 text-center text-2xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {verifyLoading && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Verifying...</p>
          )}

          <div className="text-center mb-4">
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="text-sm text-indigo-500 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
            >
              {canResend
                ? "Didn't receive it? Resend code"
                : `Resend code in ${resendCooldown}s`}
            </button>
          </div>

          <button
            onClick={() => { setStep(0); setVerifyError(''); setSilentRedirectMsg(''); setDigits(['', '', '', '', '', '']); }}
            className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors font-medium cursor-pointer"
          >
            ← Back to registration
          </button>
        </div>
      </div>

      {/* ── Panel 2: Onboarding survey ── */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 py-12"
        style={panelStyle(2)}
      >
        <OnboardingSurvey
          token={authToken}
          onComplete={goToHub}
          onSkip={goToHub}
        />
      </div>
    </div>
  );
}
