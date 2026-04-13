const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// In-memory access token for staff — cleared on page refresh
let staffAccessToken: string | null = null;

const STAFF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches refresh token lifetime

/** Sets a non-sensitive indicator cookie on the frontend domain so the proxy can detect a session. */
export function setStaffAuthCookie(): void {
  document.cookie = `staff_auth=1; path=/; max-age=${STAFF_COOKIE_MAX_AGE}; SameSite=Strict`;
}

/** Clears the indicator cookie on logout. */
export function clearStaffAuthCookie(): void {
  document.cookie = 'staff_auth=; path=/; max-age=0; SameSite=Strict';
}

export function getStaffAccessToken(): string | null {
  return staffAccessToken;
}

export function setStaffAccessToken(token: string | null): void {
  staffAccessToken = token;
}

// Deduplication: if a refresh is already in flight, all callers share the same promise.
// This prevents token rotation conflicts when multiple components trigger a refresh simultaneously.
let pendingRefresh: Promise<string | null> | null = null;

/**
 * Calls /api/staff/auth/refresh using the httpOnly staff refresh token cookie.
 * On success, stores and returns the new access token.
 * On failure, returns null (session expired or no cookie present).
 * Concurrent calls share a single in-flight request to avoid token rotation conflicts.
 */
export async function refreshStaffAccessToken(): Promise<string | null> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return null;
      const data = await response.json();
      staffAccessToken = data.access_token;
      return data.access_token;
    } catch {
      return null;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}

/**
 * Returns a valid staff access token, attempting a silent refresh if none is in memory.
 * Call this at the start of every protected staff page to restore the session after reload.
 */
export async function initStaffAuth(): Promise<string | null> {
  if (staffAccessToken) return staffAccessToken;
  return refreshStaffAccessToken();
}

/**
 * Clears the in-memory token and revokes the staff refresh token cookie on the server.
 */
export async function logoutStaffAuth(): Promise<void> {
  staffAccessToken = null;
  clearStaffAuthCookie();
  try {
    await fetch(`${API_URL}/api/staff/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors on logout — token is already cleared from memory
  }
}
