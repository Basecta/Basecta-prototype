'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initStaffAuth } from '@/lib/staff-auth-store';
import { getStaffNotifications, markStaffNotificationRead, dismissStaffNotification } from '@/lib/api';
import { BellIcon } from 'lucide-react';

interface StaffNotification {
  id: string;
  notification_key: string;
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
  read: boolean;
  dismissible: boolean;
}

export default function StaffNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = await initStaffAuth();
      if (!token) { router.replace('/staff/login'); return; }

      getStaffNotifications()
        .then(setNotifications)
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    init();
  }, [router]);

  const handleRead = async (id: string) => {
    await markStaffNotificationRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDismiss = async (id: string) => {
    await dismissStaffNotification(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="px-4 md:px-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
        {unreadCount > 0 && (
          <span className="flex items-center justify-center size-6 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Loading…</p>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
          <BellIcon className="size-10 mb-3 opacity-40" />
          <p className="text-sm">No notifications</p>
        </div>
      )}

      <ul className="space-y-3">
        {notifications.map(n => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 transition-colors ${
              n.read
                ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => handleRead(n.id)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
                {n.dismissible && (
                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
            {n.action_url && (
              <a
                href={n.action_url}
                className="mt-2 inline-block text-xs text-emerald-600 hover:underline"
              >
                Take action →
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
