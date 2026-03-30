'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';
import { OnboardingSurvey } from '../components/OnboardingSurvey';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [authToken, setAuthToken] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = await register(formData.username, formData.email, formData.password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthToken(data.access_token);
      setSurveyOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => router.push('/hub');

  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ── Registration panel — slides left off-screen on submit ── */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 py-12 transition-transform duration-500 ease-in-out ${
          surveyOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Account</h1>

          {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Username"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
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
              helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
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
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-500 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* ── Survey panel — starts off-screen right, slides to centre ── */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 py-12 transition-transform duration-500 ease-in-out ${
          surveyOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <OnboardingSurvey
          token={authToken}
          onComplete={goToLogin}
          onSkip={goToLogin}
        />
      </div>
    </div>
  );
}
