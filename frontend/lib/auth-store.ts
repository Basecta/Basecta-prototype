const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// In-memory access token — cleared on page refresh, intentionally not in localStorage
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Calls /api/auth/refresh using the httpOnly refresh token cookie.
 * On success, stores and returns the new access token.
 * On failure, returns null (session expired or no cookie present).
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    accessToken = data.access_token;
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Returns a valid access token, attempting a silent refresh if none is in memory.
 * Call this at the start of every protected page to restore the session after a
 * full page reload.
 */
export async function initAuth(): Promise<string | null> {
  if (accessToken) return accessToken;
  return refreshAccessToken();
}

/**
 * Clears the in-memory token and revokes the refresh token cookie on the server.
 */
export async function logoutAuth(): Promise<void> {
  accessToken = null;
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors on logout — token is already cleared from memory
  }
}
