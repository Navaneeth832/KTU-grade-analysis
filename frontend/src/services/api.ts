import { api, endpoints } from '../config/api';
import { OverallStats, SemesterData, CustomQuery, QueryResult } from '../types';

export const apiService = {
  // Fetch overall statistics
  getOverallStats: async (): Promise<OverallStats> => {
    const response = await api.post(endpoints.overallStats, {});
    return response.data;
  },


  // Fetch semester-specific data
  getSemesterData: async (semester: number): Promise<SemesterData> => {
    const response = await api.get(endpoints.semesterData(semester));
    return response.data;
  },

  getSemesters: async (): Promise<number[]> => {
    const response = await api.get(endpoints.semesters);
    return response.data;
  },

  // Fetch available custom queries
  getCustomQueries: async (): Promise<CustomQuery[]> => {
    const response = await api.get(endpoints.customQueries);
    return response.data;
  },

  // Execute custom query
  executeCustomQuery: async (queryId: string, prompt: string): Promise<QueryResult> => {
    const response = await api.get(endpoints.customQuery(queryId, prompt));
    return response.data;
  },

  executelogin: async (ktuId: string, password: string): Promise<string> => {
    const response = await api.post(endpoints.login, { ktuId, password });
    return response.data.token;
  },
};
