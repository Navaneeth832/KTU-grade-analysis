import { api, endpoints } from '../config/api';
import { OverallStats, SemesterData, CustomQuery, QueryResult } from '../types';

export const apiService = {
  // Fetch overall statistics
  getOverallStats: async (): Promise<OverallStats> => {
    const response = await api.get(endpoints.overallStats);
    return response.data;
  },


  // Fetch semester-specific data
  getSemesterData: async (semester: number): Promise<SemesterData> => {
    const response = await api.get(endpoints.semesterData(semester));
    console.log("API Response:", response.data); // 👈 Check here
    return response.data;
  },

  // Fetch available custom queries
  getCustomQueries: async (): Promise<CustomQuery[]> => {
    const response = await api.get(endpoints.customQueries);
    return response.data;
  },

  // Execute custom query
  executeCustomQuery: async (queryId: string): Promise<QueryResult> => {
    const response = await api.get(endpoints.customQuery(queryId));
    return response.data;
  },
};