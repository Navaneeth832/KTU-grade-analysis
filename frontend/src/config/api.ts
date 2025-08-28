import axios from 'axios';

// Replace with your actual backend URL
export const BACKEND_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const endpoints = {
  overallStats: '/overall-stats',
  semesterData: (id: number) => `/semester/${id}`,
  semesters: '/semesters',
  customQuery: (queryId: string) => `/custom-query/${queryId}`,
  customQueries: '/custom-queries',
};