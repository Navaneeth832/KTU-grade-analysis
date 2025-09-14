import axios from 'axios';

// Replace with your actual backend URL
export const BACKEND_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  overallStats: `/overall-stats`,
  semesterData: (id: number) => `/semester/${id}`,
  semesters: '/semesters',
  customQuery: (queryId: string,prompt: string) => `/custom-query/${queryId}?prompt=${encodeURIComponent(prompt)}`,
  customQueries: '/custom-queries',
  login: '/login',
  register: '/register',
};
