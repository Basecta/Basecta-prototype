'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotifications, markNotificationRead, dismissNotification } from '@/lib/api';
import { initAuth } from '@/lib/auth-store';
import { BellIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  notification_key: string;
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
  read: boolean;
  dismissible: boolean;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const token = await initAuth();
      if (!token) { router.replace('/login'); return; }

      getNotifications()
        .then((data: Notification[]) => {
          if (!active) return;
          setNotifications(data);
          // Mark as read only notifications that are dismissible (action-locked ones get marked read by completing the action)
          data.filter(n => !n.read && n.dismissible).forEach(n => markNotificationRead(n.id).catch(() => {}));
        })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false); });
    };
    init();
    return () => { active = false; };
  }, [router]);

  const handleDismiss = (id: string) => {
    dismissNotification(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <BellIcon className="size-6 text-foreground" />
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BellIcon className="size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">You&apos;re all caught up — no notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`border-l-4 ${n.read ? 'border-l-border' : 'border-l-blue-500'}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  {!n.read && (
                    <span className="mt-1.5 shrink-0 size-2 rounded-full bg-blue-500" />
                  )}
                  <div className={`flex-1 space-y-1 ${n.read ? '' : ''}`}>
                    <p className={`text-sm ${n.read ? 'font-normal text-muted-foreground' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    {n.action_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        nativeButton={false}
                        render={<Link href={n.action_url} />}
                      >
                        Complete
                        <ChevronRightIcon className="size-3.5" />
                      </Button>
                    )}
                    {n.dismissible && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleDismiss(n.id)}
                        aria-label="Dismiss"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
