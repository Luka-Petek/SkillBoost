const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.error || message;
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
  getReport: (userId) => request(`/reports/${userId}`)
};
