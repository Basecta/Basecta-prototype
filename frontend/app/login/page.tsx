'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, loginWithGoogle } from '@/lib/api';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initGoogle = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: { credential: string }) => {
          setLoading(true);
          setError('');
          try {
            const data = await loginWithGoogle(response.credential);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/hub');
          } catch (err: any) {
            setError(err.message || 'Google sign-in failed. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      });
      const btn = document.getElementById('google-signin-btn');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors: Record<string, boolean> = {};
    if (!formData.email.trim()) errors.email = true;
    if (!formData.password) errors.password = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/hub');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to your account</p>

        {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter email"
            autoComplete="username"
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
            error={fieldErrors.password}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <hr className="flex-1 border-gray-300 dark:border-gray-600" />
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-1 border-gray-300 dark:border-gray-600" />
        </div>

        <div id="google-signin-btn" className="w-full" />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
