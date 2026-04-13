'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { initStaffAuth } from '@/lib/staff-auth-store';
import { changeStaffPassword } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FormInput } from '@/app/components/FormInput';
import { SunIcon, MoonIcon, ChevronDown } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  ecologist: 'Ecologist',
  surveyor: 'Surveyor',
};

export default function StaffSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [staff, setStaff] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await initStaffAuth();
      if (!token) { router.push('/staff/login'); return; }
      const staffData = localStorage.getItem('staff');
      if (!staffData) { router.push('/staff/login'); return; }
      setStaff(JSON.parse(staffData));
    };
    init();
  }, [router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleTogglePasswordForm = () => {
    if (showChangePassword) {
      setShowChangePassword(false);
      setError('');
      setSuccess('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setShowChangePassword(true);
    }
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
      await changeStaffPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(handleTogglePasswordForm, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Full Name</Label>
            <p className="text-lg">{staff.full_name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-lg">{staff.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Role</Label>
            <p className="text-lg">{ROLE_LABELS[staff.role] ?? staff.role}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Account Created</Label>
            <p className="text-lg">{new Date(staff.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-muted-foreground">Theme</Label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <SunIcon className="size-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <MoonIcon className="size-4" />
              Dark
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={handleTogglePasswordForm}
            className="flex items-center gap-2 bg-yellow-400 text-amber-900 px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors font-medium cursor-pointer"
          >
            Change Password
            <ChevronDown className={`size-4 transition-transform duration-300 ${showChangePassword ? 'rotate-180' : ''}`} />
          </button>

          <div className={`transition-all duration-500 ease-in-out ${
            showChangePassword
              ? 'max-h-[800px] opacity-100 overflow-visible mt-4'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400">
                {success}
              </div>
            )}
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
                autoComplete="new-password"
                helpText="Must be at least 8 characters with uppercase, lowercase, number, and a special character (e.g. !@#$_-)"
              />
              <FormInput
                label="Confirm New Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-amber-900 py-2 rounded-md hover:bg-yellow-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium cursor-pointer"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
