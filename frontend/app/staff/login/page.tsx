'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { staffLogin, staffSetupPassword, staffSetupConfirmTotp, staffTotpValidate } from '@/lib/api';
import { setStaffAccessToken, setStaffAuthCookie } from '@/lib/staff-auth-store';
import { FormInput } from '@/app/components/FormInput';
import { AlertMessage } from '@/app/components/AlertMessage';

type Step = 'credentials' | 'setup_password' | 'setup_totp' | 'totp_validate';

export default function StaffLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');

  // Persisted across steps
  const [setupToken, setSetupToken] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code from qrUri when we enter setup_totp step
  useEffect(() => {
    if (step !== 'setup_totp' || !qrUri) return;
    let cancelled = false;
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(qrUri, { width: 200, margin: 2 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => { cancelled = true; };
  }, [step, qrUri]);

  const clearError = () => setError('');

  // --- Step 1: email + password ---
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const errors: Record<string, boolean> = {};
    if (!email.trim()) errors.email = true;
    if (!password) errors.password = true;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const data = await staffLogin(email, password);

      if (data.setup_required) {
        setSetupToken(data.setup_token);
        setStep('setup_password');
      } else if (data.totp_required) {
        setMfaToken(data.mfa_token);
        setStep('totp_validate');
      } else {
        // Account has no TOTP (legacy/admin) — log straight in
        setStaffAccessToken(data.access_token);
        localStorage.setItem('staff', JSON.stringify(data.staff));
        setStaffAuthCookie();
        router.push('/staff/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: set new password ---
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!newPassword) { setFieldErrors({ newPassword: true }); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const data = await staffSetupPassword(setupToken, newPassword);
      setQrUri(data.qr_uri);
      setTotpSecret(data.secret);
      setStep('setup_totp');
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3: confirm TOTP setup ---
  const handleConfirmTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!totpCode.trim()) { setFieldErrors({ totpCode: true }); return; }

    setLoading(true);
    try {
      const data = await staffSetupConfirmTotp(setupToken, totpCode);
      setStaffAccessToken(data.access_token);
      localStorage.setItem('staff', JSON.stringify(data.staff));
      setStaffAuthCookie();
      router.push('/staff/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 4: TOTP validate on returning login ---
  const handleTotpValidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!totpCode.trim()) { setFieldErrors({ totpCode: true }); return; }

    setLoading(true);
    try {
      const data = await staffTotpValidate(mfaToken, totpCode);
      setStaffAccessToken(data.access_token);
      localStorage.setItem('staff', JSON.stringify(data.staff));
      setStaffAuthCookie();
      router.push('/staff/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  const shell = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">{subtitle}</p>
        </div>
        {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}
        {children}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Staff access only. Contact your administrator if you need assistance.
        </p>
      </div>
    </div>
  );

  if (step === 'credentials') {
    return shell('Staff Portal', 'Sign in with your staff credentials', (
      <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
        <FormInput
          label="Email"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError(); setFieldErrors(p => ({ ...p, email: false })); }}
          required
          placeholder="Enter your staff email"
          autoComplete="username"
          error={fieldErrors.email}
        />
        <FormInput
          label="Password"
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearError(); setFieldErrors(p => ({ ...p, password: false })); }}
          required
          placeholder="Enter your password"
          error={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    ));
  }

  if (step === 'setup_password') {
    return shell('Set Your Password', 'Welcome! Please set a new password to secure your account.', (
      <form onSubmit={handleSetPasswordSubmit} className="space-y-4" noValidate>
        <FormInput
          label="New Password"
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); clearError(); setFieldErrors(p => ({ ...p, newPassword: false })); }}
          required
          placeholder="Choose a strong password"
          error={fieldErrors.newPassword}
        />
        <FormInput
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
          required
          placeholder="Repeat your new password"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Must be 8+ characters with uppercase, lowercase, a number, and a special character.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Saving...' : 'Set Password'}
        </button>
      </form>
    ));
  }

  if (step === 'setup_totp') {
    return shell('Set Up Two-Factor Authentication', 'Scan the QR code with an authenticator app, then enter the 6-digit code to confirm.', (
      <form onSubmit={handleConfirmTotpSubmit} className="space-y-4" noValidate>
        <div className="flex flex-col items-center gap-3">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="TOTP QR Code" className="rounded-lg border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-400">Loading QR code...</span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Can't scan? Enter this key manually:
          </p>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded font-mono tracking-widest select-all text-gray-700 dark:text-gray-300">
            {totpSecret}
          </code>
        </div>
        <FormInput
          label="Authenticator Code"
          id="totpCode"
          name="totpCode"
          type="text"
          inputMode="numeric"
          value={totpCode}
          onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); setFieldErrors(p => ({ ...p, totpCode: false })); }}
          required
          placeholder="Enter 6-digit code"
          error={fieldErrors.totpCode}
        />
        <button
          type="submit"
          disabled={loading || totpCode.length !== 6}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Verifying...' : 'Confirm & Sign In'}
        </button>
      </form>
    ));
  }

  // step === 'totp_validate'
  return shell('Two-Factor Authentication', 'Enter the 6-digit code from your authenticator app.', (
    <form onSubmit={handleTotpValidateSubmit} className="space-y-4" noValidate>
      <FormInput
        label="Authenticator Code"
        id="totpCode"
        name="totpCode"
        type="text"
        inputMode="numeric"
        value={totpCode}
        onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); setFieldErrors(p => ({ ...p, totpCode: false })); }}
        required
        placeholder="Enter 6-digit code"
        error={fieldErrors.totpCode}
      />
      <button
        type="submit"
        disabled={loading || totpCode.length !== 6}
        className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Verifying...' : 'Sign In'}
      </button>
      <button
        type="button"
        onClick={() => { setStep('credentials'); setTotpCode(''); clearError(); }}
        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Back to login
      </button>
    </form>
  ));
}
