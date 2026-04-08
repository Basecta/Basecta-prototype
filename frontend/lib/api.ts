import { getAccessToken, refreshAccessToken, setAccessToken } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function buildHeaders(overrides?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...overrides,
  };
}

async function doFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: buildHeaders(options?.headers),
  });
}

export async function apiRequest(endpoint: string, options?: RequestInit) {
  let response = await doFetch(endpoint, options);

  // On 401, attempt a silent token refresh and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(endpoint, options);
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e: any) => e.msg?.replace(/^Value error, /, '') ?? 'Validation error').join('. ')
      : detail || 'An error occurred';
    throw new Error(message);
  }

  return data;
}

export async function sendVerificationCode(email: string) {
  return apiRequest('/api/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(email: string, code: string) {
  return apiRequest('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function register(username: string, email: string, password: string, verificationToken: string) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, verification_token: verificationToken }),
  });
}

export async function login(email: string, password: string) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(idToken: string) {
  return apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function logoutUser() {
  setAccessToken(null);
  return apiRequest('/api/auth/logout', { method: 'POST' });
}

export async function forgotPassword(email: string) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function getSurveyStatus(): Promise<{ submitted: boolean }> {
  return apiRequest('/api/survey/status');
}

export async function submitSurvey(responses: Record<string, unknown>) {
  return apiRequest('/api/survey/submit', {
    method: 'POST',
    body: JSON.stringify({ responses }),
  });
}

export async function getManagerDashboards() {
  return apiRequest('/api/dashboard/manager');
}

export async function updateManagerDashboardName(id: string, dashboardName: string) {
  return apiRequest(`/api/dashboard/manager/${id}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ dashboard_name: dashboardName }),
  });
}

export async function getManagerDashboard(id: string) {
  return apiRequest(`/api/dashboard/manager/${id}`);
}

export async function getFarms() {
  return apiRequest('/api/dashboard/farms');
}

export async function updateDashboardName(farmId: string, dashboardName: string) {
  return apiRequest(`/api/dashboard/farms/${farmId}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ dashboard_name: dashboardName }),
  });
}

export async function getFarmById(id: string) {
  return apiRequest(`/api/dashboard/farms/${id}`);
}

export async function getNotifications() {
  return apiRequest('/api/notifications');
}

export async function markNotificationRead(id: string) {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function dismissNotification(id: string) {
  return apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
}

export async function uploadFile(file: File, category: string) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const doUpload = (authToken: string) =>
    fetch(`${API_URL}/api/upload/${category}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData,
    });

  let response = await doUpload(token);

  // On 401, attempt silent refresh and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doUpload(newToken);
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Upload failed');
  }

  return data;
}
