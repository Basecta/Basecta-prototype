'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setFieldError(true);
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">Forgot Password</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <AlertMessage
              type="success"
              message="If that email is registered, you'll receive a reset link shortly. Check your inbox."
            />
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              <Link href="/login" className="text-indigo-500 hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        ) : (
          <>
            {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormInput
                label="Email"
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setFieldError(false);
                }}
                required
                placeholder="Enter your email"
                autoComplete="email"
                error={fieldError}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              <Link href="/login" className="text-indigo-500 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
