import keycloak from './keycloak.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function getAccessToken() {
  if (keycloak?.authenticated && keycloak.token) {
    try {
      await keycloak.updateToken(30);
      if (keycloak.token) {
        localStorage.setItem('token', keycloak.token);
        return keycloak.token;
      }
    } catch (error) {
      console.warn('Token refresh failed, using stored token if available.', error);
    }
  }

  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const { headers: optionHeaders = {}, ...restOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...optionHeaders
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.error || payload.message || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  health: () => request('/health'),
  getUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  getSkills: () => request('/skills'),
  getChallenges: () => request('/challenges'),
  getPrompts: () => request('/prompts'),
  createPrompt: (payload) => request('/prompts', { method: 'POST', body: JSON.stringify(payload) }),
  submitSession: (payload) => request('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  updateMentorNote: (sessionId, payload) => request(`/sessions/${sessionId}/mentor-note`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getReport: (userId) => request(`/reports/${userId}`),
  getMentorDashboard: () => request('/mentor/dashboard'),
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getQuestMap: (userId) => request(`/quest-map/user/${encodeURIComponent(userId)}`),
  updateQuestNode: (userId, nodeKey, payload) => request(`/quest-map/user/${encodeURIComponent(userId)}/nodes/${encodeURIComponent(nodeKey)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  resetQuestMap: (userId) => request(`/quest-map/user/${encodeURIComponent(userId)}`, { method: 'DELETE' })
};
