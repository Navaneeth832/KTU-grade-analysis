import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Trophy, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';
import { OverallStats } from '../types';
import { LoadingSpinner, LoadingCard } from '../components/LoadingSpinner';
import { StatCard } from '../components/StatCard';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export const OverallAnalysis: React.FC = () => {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOverallStats(); 
      setStats(data);
    } catch (error) {
      console.error('Error fetching overall stats:', error);
      toast.error('Failed to fetch overall statistics');
      // Mock data for demo purposes
      setStats({
        cgpa: 3.75,
        totalCredits: 120,
        completedSemesters: 6,
        gradeDistribution: [
          { grade: 'A+', count: 15 },
          { grade: 'A', count: 12 },
          { grade: 'B+', count: 8 },
          { grade: 'B', count: 5 },
          { grade: 'C+', count: 2 },
        ],
        semesterGpas: [
          { semester: "1", gpa: 3.6 },
          { semester: "2", gpa: 3.8 },
          { semester: "3", gpa: 3.9 },
          { semester: "4", gpa: 3.7 },
        ],
        subjectPerformance: [
          { subject: 'Mathematics', averageGrade: 3.8 },
          { subject: 'Computer Science', averageGrade: 3.9 },
          { subject: 'Physics', averageGrade: 3.6 },
          { subject: 'English', averageGrade: 3.7 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-8">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Overall Analysis
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive view of your academic performance</p>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="CGPA"
              value={stats.cgpa.toFixed(2)}
              icon={Trophy}
              color="from-yellow-400 to-orange-500"
              delay={0}
            />
            <StatCard
              title="Total Credits"
              value={stats.totalCredits}
              icon={BookOpen}
              color="from-blue-500 to-cyan-600"
              delay={0.1}
            />
            <StatCard
              title="Completed Semesters"
              value={stats.completedSemesters}
              icon={GraduationCap}
              color="from-purple-500 to-pink-600"
              delay={0.2}
            />
            <StatCard
              title="Performance"
              value="Excellent"
              icon={TrendingUp}
              color="from-emerald-500 to-teal-600"
              delay={0.3}
            />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Grade Distribution */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                Grade Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.gradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ grade, count }) => `${grade}: ${count}`}
                  >
                    {stats.gradeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* GPA Trend */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                GPA Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.semesterGpas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="semester" 
                    tick={{ fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gpa" 
                    stroke="url(#gpaTrend)" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                  <defs>
                    <linearGradient id="gpaTrend" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Subject Performance */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              Subject Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="averageGrade" fill="url(#subjectGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="subjectGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
};