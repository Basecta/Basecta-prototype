'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initStaffAuth } from '@/lib/staff-auth-store';
import { getStaffUsers, createStaffUser } from '@/lib/api';
import { FormInput } from '@/app/components/FormInput';
import { AlertMessage } from '@/app/components/AlertMessage';
import { UserPlusIcon, ShieldCheckIcon, ShieldAlertIcon } from 'lucide-react';

interface StaffMember {
  staff_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  account_setup_complete: boolean;
  totp_enabled: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  ecologist: 'Ecologist',
  surveyor: 'Surveyor',
};

const ROLE_COLOURS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  ecologist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  surveyor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

export default function StaffUsersPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'ecologist' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const init = async () => {
      const token = await initStaffAuth();
      if (!token) { router.replace('/staff/login'); return; }

      const me = localStorage.getItem('staff');
      if (!me || JSON.parse(me).role !== 'admin') {
        router.replace('/staff/dashboard');
        return;
      }

      loadUsers();
    };
    init();
  }, [router]);

  const loadUsers = () => {
    setLoading(true);
    getStaffUsers()
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
    setFieldErrors(prev => ({ ...prev, [e.target.name]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const errors: Record<string, boolean> = {};
    if (!formData.email.trim()) errors.email = true;
    if (!formData.full_name.trim()) errors.full_name = true;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setSubmitting(true);
    try {
      await createStaffUser(formData.email.trim(), formData.full_name.trim(), formData.role);
      setFormSuccess(`Account created for ${formData.email}. Login credentials have been sent to their email.`);
      setFormData({ email: '', full_name: '', role: 'ecologist' });
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Staff Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage staff accounts for the portal</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm cursor-pointer"
        >
          <UserPlusIcon className="size-4" />
          Add Staff Member
        </button>
      </div>

      {formSuccess && (
        <div className="mb-4">
          <AlertMessage type="success" message={formSuccess} />
        </div>
      )}

      {/* Add staff form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">New Staff Member</h2>
          {formError && <div className="mb-4"><AlertMessage type="error" message={formError} /></div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormInput
                label="Full Name"
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="e.g. Jane Smith"
                error={fieldErrors.full_name}
              />
              <FormInput
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jane@example.com"
                error={fieldErrors.email}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full sm:w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ecologist">Ecologist</option>
                <option value="surveyor">Surveyor</option>
                <option value="admin">Administrator</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A temporary password will be auto-generated and emailed to the new staff member.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create Account & Send Email'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No staff accounts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {staff.map(member => (
                <tr key={member.staff_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                    {member.full_name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{member.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOURS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {member.account_setup_complete ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheckIcon className="size-4" />
                        <span className="text-xs font-medium">Active</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <ShieldAlertIcon className="size-4" />
                        <span className="text-xs font-medium">Awaiting setup</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
