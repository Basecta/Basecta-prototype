'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/lib/api';
import { Navbar } from '../components/Navbar';
import { PageLayout } from '../components/PageLayout';
import { SectionCard } from '../components/SectionCard';
import { FormInput } from '../components/FormInput';
import { AlertMessage } from '../components/AlertMessage';
import { LoadingScreen } from '../components/LoadingScreen';

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
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
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
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 500);
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
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => handleClosePasswordForm(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingScreen />;

  return (
    <PageLayout>
      <Navbar title="Account Settings" backHref="/dashboard" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <SectionCard padding="p-8">
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
              <p className="text-lg text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard padding="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Security</h2>

          <button
            onClick={() => setShowChangePassword(true)}
            className={`px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors ${showChangePassword ? 'hidden' : ''}`}
          >
            Change Password
          </button>

          <div
            className={`mt-4 overflow-hidden transition-all duration-500 ease-in-out ${
              showChangePassword && !isClosing ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Change Password</h3>
              <button onClick={handleClosePasswordForm} className="text-gray-500 hover:text-gray-700 text-2xl">
                ✕
              </button>
            </div>

            {error && <div className="mb-4"><AlertMessage type="error" message={error} /></div>}
            {success && <div className="mb-4"><AlertMessage type="success" message={success} /></div>}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <FormInput
                label="Current Password"
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <FormInput
                label="New Password"
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              />
              <FormInput
                label="Confirm New Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </SectionCard>
      </div>
    </PageLayout>
  );
}
