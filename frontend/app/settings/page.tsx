'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { changePassword } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleClosePasswordForm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowChangePassword(false);
      setIsClosing(false);
      setError('');
      setSuccess('');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }, 500); // Match the animation duration
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        handleClosePasswordForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="w-full px-4 py-4">
            <div className="flex items-center justify-center relative">
            <Link href="/dashboard" className="absolute left-0 text-blue-500 hover:text-blue-700">
                ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
            </div>
        </div>
       </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
              <p className="text-lg text-gray-900">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Created</label>
              <p className="text-lg text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Security</h2>
            </div>

            <button
                onClick={() => setShowChangePassword(true)}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${showChangePassword ? 'hidden' : ''}`}
            >
                Change Password
            </button>

            <div className={`mt-4 overflow-hidden transition-all duration-500 ease-in-out ${
                showChangePassword && !isClosing 
                ? 'max-h-[800px] opacity-100' 
                : 'max-h-0 opacity-0'
            }`}>
                <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Change Password</h3>
                <button
                    onClick={handleClosePasswordForm}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                    ✕
                </button>
                </div>

                {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
                )}

                {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                    </label>
                    <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                </div>

                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                    </label>
                    <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                    </label>
                    <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Changing Password...' : 'Change Password'}
                </button>
                </form>
            </div>
            </div>
      </div>
    </div>
  );
}