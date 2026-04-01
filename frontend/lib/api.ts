const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

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

export async function register(username: string, email: string, password: string) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
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

export async function changePassword(currentPassword: string, newPassword: string) {
  const token = localStorage.getItem('token');
  
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function getSurveyStatus(token: string): Promise<{ submitted: boolean }> {
  return apiRequest('/api/survey/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function submitSurvey(responses: Record<string, unknown>, token: string) {
  return apiRequest('/api/survey/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ responses }),
  });
}

export async function getManagerDashboards() {
  const token = localStorage.getItem('token');
  return apiRequest('/api/dashboard/manager', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateManagerDashboardName(id: string, dashboardName: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/dashboard/manager/${id}/name`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ dashboard_name: dashboardName }),
  });
}

export async function getManagerDashboard(id: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/dashboard/manager/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getFarms() {
  const token = localStorage.getItem('token');
  return apiRequest('/api/dashboard/farms', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateDashboardName(farmId: string, dashboardName: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/dashboard/farms/${farmId}/name`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ dashboard_name: dashboardName }),
  });
}

export async function getFarmById(id: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/dashboard/farms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getNotifications() {
  const token = localStorage.getItem('token');
  return apiRequest('/api/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markNotificationRead(id: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function dismissNotification(id: string) {
  const token = localStorage.getItem('token');
  return apiRequest(`/api/notifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function uploadFile(file: File, category: string) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload/${category}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - let browser set it with boundary for FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Upload failed');
  }

  return data;
}