export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface Grade {
  subject: string;
  grade: string;
  points: number;
  credits: number;
}

export interface SemesterData {
  semester: string;
  sgpa: number;
  grades: Grade[];
  totalCredits: number;
}

export interface OverallStats {
  cgpa: number;
  totalCredits: number;
  completedSemesters: number;
  gradeDistribution: {
    grade: string;
    count: number;
  }[];
  semesterGpas: {
    semester: string;
    gpa: number;
  }[];
  subjectPerformance: {
    subject: string;
    averageGrade: number;
  }[];
}

export interface CustomQuery {
  id: string;
  name: string;
  description: string;
}

export interface QueryResult {
  query: string;
  data: Record<string, unknown>[];
  headers: string[];
}