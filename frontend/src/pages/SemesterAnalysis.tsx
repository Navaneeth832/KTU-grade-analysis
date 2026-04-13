import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Trophy, ChevronDown, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { SemesterData } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatCard } from '../components/StatCard';
import toast from 'react-hot-toast';

export const SemesterAnalysis: React.FC = () => {
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const data = await apiService.getSemesters();
      setSemesters(data.map((sem: number) => `semester${sem}`));
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to fetch semesters');
    }
  };

  const fetchSemesterData = async (semester: string) => {
    try {
      setLoading(true);
      const sem_id = parseInt(semester.replace('semester', ''));

      const data = await apiService.getSemesterData(sem_id);
      setSemesterData(data);
    } catch (error) {
      console.error('Error fetching semester data:', error);
      toast.error('Failed to fetch semester data');
      // Mock fallback data
      setSemesterData({
        semester,
        sgpa: 3.8,
        totalCredits: 18,
        grades: [
          { subject: 'Advanced Mathematics', grade: 'A', points: 4.0, credits: 4 },
          { subject: 'Computer Networks', grade: 'A-', points: 3.7, credits: 3 },
          { subject: 'Database Systems', grade: 'B+', points: 3.3, credits: 3 },
          { subject: 'Software Engineering', grade: 'A', points: 4.0, credits: 4 },
          { subject: 'Data Structures', grade: 'A+', points: 4.0, credits: 4 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setDropdownOpen(false);
    fetchSemesterData(semester);
  };

  const handleDeleteSemester = async () => {
    if (!selectedSemester) {
      toast.error('Select a semester first');
      return;
    }

    const semId = parseInt(selectedSemester.replace('semester', ''));
    if (!Number.isFinite(semId)) {
      toast.error('Invalid semester selected');
      return;
    }

    const confirmed = window.confirm(`Delete semester ${semId}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const message = await apiService.deleteSemester(semId);
      toast.success(message || 'Semester deleted successfully');
      setSelectedSemester('');
      setSemesterData(null);
      await fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast.error('Failed to delete semester');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeColors: { [key: string]: string } = {
      'A+': 'text-green-600',
      'A': 'text-green-500',
      'A-': 'text-green-400',
      'B+': 'text-blue-500',
      'B': 'text-blue-400',
      'B-': 'text-blue-300',
      'C+': 'text-yellow-500',
      'C': 'text-yellow-400',
      'C-': 'text-orange-400',
      'D': 'text-red-400',
      'F': 'text-red-600',
    };
    return gradeColors[grade] || 'text-gray-500';
  };

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
            Semester Analysis
          </h1>
          <p className="text-gray-600 text-lg">Detailed performance analysis by semester</p>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Semester Selector */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 min-w-64"
              >
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-800">
                  {selectedSemester || 'Select Semester'}
                </span>
                <motion.div
                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 py-2 z-10"
                  >
                    {semesters.map((semester) => (
                      <motion.button
                        key={semester}
                        onClick={() => handleSemesterChange(semester)}
                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-gray-800 font-medium"
                        whileHover={{ x: 5 }}
                      >
                        {semester}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleDeleteSemester}
              disabled={!selectedSemester || loading}
              className="ml-3 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </motion.div>

          {loading && <LoadingSpinner />}

          {semesterData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <StatCard
                  title="Semester GPA"
                  value={semesterData.sgpa !== undefined ? semesterData.sgpa.toFixed(2) : "N/A"}
                  icon={Trophy}
                  color="from-yellow-400 to-orange-500"
                  delay={0}
                />
                <StatCard
                  title="Courses Taken"
                  value={semesterData.grades ? semesterData.grades.length : 0}
                  icon={Calendar}
                  color="from-purple-500 to-pink-600"
                  delay={0.2}
                />
              </div>

              {/* Grades Table */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
                  <h3 className="text-xl font-semibold text-white">Course Grades</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grade</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">GPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterData.grades?.map((grade, index) => (
                        <motion.tr
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index, duration: 0.4 }}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200"
                        >
                          <td className="px-6 py-4 text-gray-800 font-medium">{grade.subject}</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold text-lg ${getGradeColor(grade.grade)}`}>
                              {grade.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {grade.points !== undefined ? grade.points.toFixed(1) : "N/A"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Performance Chart */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3">
                    <BarChart className="h-5 w-5 text-white" />
                  </div>
                  Grade Points Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={semesterData.grades || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="subject" tick={{ fill: '#666' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: '#666' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="points" fill="url(#gradeGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>
          )}

          {!selectedSemester && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 max-w-md mx-auto">
                <Calendar className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Semester</h3>
                <p className="text-gray-600">Choose a semester from the dropdown above to view detailed analysis</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
