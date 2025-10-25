const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

// Threads API
export const threadsAPI = {
  // Get all threads
  getAll: async () => {
    const response = await fetch(`${API_BASE}/threads`);
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },

  // Create a new thread
  create: async (threadData: {
    seedTrackId: string;
    tags: string[];
    createdBy: string;
    trackData: any;
  }) => {
    const response = await fetch(`${API_BASE}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threadData),
    });
    if (!response.ok) throw new Error('Failed to create thread');
    return response.json();
  },
};

// Suggestions API
export const suggestionsAPI = {
  // Get all suggestions
  getAll: async () => {
    const response = await fetch(`${API_BASE}/suggestions`);
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return response.json();
  },

  // Create a new suggestion
  create: async (suggestionData: {
    threadId: string;
    trackId: string;
    reason: string;
    tags: string[];
    createdBy: string;
    trackData: any;
  }) => {
    const response = await fetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suggestionData),
    });
    if (!response.ok) throw new Error('Failed to create suggestion');
    return response.json();
  },

  // Upvote a suggestion
  upvote: async (suggestionId: string) => {
    const response = await fetch(`${API_BASE}/suggestions/${suggestionId}/upvote`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to upvote suggestion');
    return response.json();
  },
};

// Authentication API
export const authAPI = {
  // Sign up
  signup: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }
    return response.json();
  },

  // Login
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to login');
    }
    return response.json();
  },

  // Get current user
  me: async (userId: string) => {
    const response = await fetch(`${API_BASE}/auth/me?userId=${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }
    return response.json();
  },
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('API is not responding');
  return response.json();
};