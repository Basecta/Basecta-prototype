'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { SegmentedControl } from '../components/SegmentedControl';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';

type UserRole = 'asset_owner' | 'manager' | 'investor';

const ROLE_OPTIONS = [
  { value: 'asset_owner', label: 'Asset Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'investor', label: 'Investor' },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  asset_owner: '/dashboard',
  manager: '/manager-dashboard',
  investor: '/investor-dashboard',
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('asset_owner');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRoleChange = (value: string) => {
    setRole(value as UserRole);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, role }));
      router.push(ROLE_REDIRECT[role]);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeLabel = ROLE_OPTIONS.find((o) => o.value === role)?.label ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Select your role to continue</p>

        <div className="mb-6">
          <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={handleRoleChange} />
        </div>

        {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Logging in...' : `Login as ${activeLabel}`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
