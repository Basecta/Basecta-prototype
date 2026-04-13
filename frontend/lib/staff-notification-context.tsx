'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getStaffNotifications } from '@/lib/api';

interface StaffNotificationContextValue {
  unreadCount: number;
  refresh: () => void;
}

const StaffNotificationContext = createContext<StaffNotificationContextValue>({
  unreadCount: 0,
  refresh: () => {},
});

export function StaffNotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    getStaffNotifications()
      .then((data: any[]) => setUnreadCount(data.filter((n: any) => !n.read).length))
      .catch(() => {});
  }, []);

  // Initial fetch + poll every 30 s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <StaffNotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </StaffNotificationContext.Provider>
  );
}

export function useStaffNotifications() {
  return useContext(StaffNotificationContext);
}
