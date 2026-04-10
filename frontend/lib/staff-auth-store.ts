const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// In-memory access token for staff — cleared on page refresh
let staffAccessToken: string | null = null;

export function getStaffAccessToken(): string | null {
  return staffAccessToken;
}

export function setStaffAccessToken(token: string | null): void {
  staffAccessToken = token;
}

/**
 * Calls /api/staff/auth/refresh using the httpOnly staff refresh token cookie.
 * On success, stores and returns the new access token.
 * On failure, returns null (session expired or no cookie present).
 */
export async function refreshStaffAccessToken(): Promise<string | null> {
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
  }
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
  try {
    await fetch(`${API_URL}/api/staff/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors on logout — token is already cleared from memory
  }
}
