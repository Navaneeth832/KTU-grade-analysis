import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Database, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';
import { CustomQuery, QueryResult } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const CustomQueries: React.FC = () => {
  const [queries, setQueries] = useState<CustomQuery[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isAwaitingPrompt, setIsAwaitingPrompt] = useState(false);

  useEffect(() => {
    fetchCustomQueries();
  }, []);

  const fetchCustomQueries = async () => {
      setQueries([
        {
          id: '1',
          name: 'Top Performing Subject',
          description: 'Find the subject with highest average grade',
        },
        {
          id: '2',
          name: 'Lowest GPA Semester',
          description: 'Identify semester with lowest GPA',
        },
        {
          id: '3',
          name: 'Grade Distribution Analysis',
          description: 'Analyze distribution of grades across all subjects',
        },
        {
          id: '4',
          name: 'Credit Analysis',
          description: 'Analyze credits completed per semester',
        },
        { id: '5', name: 'Custom query with text', description: 'Enter your prompt in English and AI will query the table.' }
      ]);
    
  };

  const executeQuery = async (queryId: string) => {
    try {
      setLoading(true);
      const data = await apiService.executeCustomQuery(queryId,'');
      if (!data || !data.headers || !data.data) {
        setQueryResult({ query: "Empty", headers: [], data: [] });
      } else {
        setQueryResult(data);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error('Failed to execute query');
      // Mock data for demo
      const mockResults: { [key: string]: QueryResult } = {
        '1': {
          query: 'Top Performing Subject',
          headers: ['Subject', 'Average Grade', 'Total Credits'],
          data: [
            ['Computer Science', '3.9', '24'],
            ['Mathematics', '3.8', '16'],
            ['Physics', '3.6', '12'],
          ],
        },
        '2': {
          query: 'Lowest GPA Semester',
          headers: ['Semester', 'GPA', 'Credits'],
          data: [
            ['Fall 2022', '3.6', '18'],
            ['Spring 2023', '3.7', '18'],
            ['Fall 2023', '3.8', '18'],
          ],
        },
        '3': {
          query: 'Grade Distribution Analysis',
          headers: ['Grade', 'Count', 'Percentage'],
          data: [
            ['A+', '15', '35%'],
            ['A', '12', '28%'],
            ['B+', '8', '19%'],
            ['B', '5', '12%'],
            ['C+', '2', '5%'],
          ],
        },
        '4': {
          query: 'Credit Analysis',
          headers: ['Semester', 'Credits', 'Cumulative'],
          data: [
            ['Fall 2022', '18', '18'],
            ['Spring 2023', '18', '36'],
            ['Fall 2023', '18', '54'],
            ['Spring 2024', '18', '72'],
          ],
        },
      };
      setQueryResult(mockResults[queryId] || mockResults['1']);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (queryId: string) => {
    setSelectedQuery(queryId);
    setDropdownOpen(false);
    setQueryResult(null);
    setPrompt('');
    if (queryId === '5') {
      setIsAwaitingPrompt(true);
    } else {
      setIsAwaitingPrompt(false);
      executeQuery(queryId);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      toast.error('Please enter a prompt');
      return;
    }
    setIsAwaitingPrompt(false);
    setLoading(true);
    try {
      const data = await apiService.executeCustomQuery('5', prompt);
      await new Promise(res => setTimeout(res, 1500));
      /*const mockResult: QueryResult = {
        query: `Result for: "${prompt}"`,
        headers: ['Student ID', 'Course', 'Final Grade'],
        data: [
          ['101', 'Advanced Algorithms', 'A'],
          ['101', 'Machine Learning', 'A-'],
        ],
      };*/
      setQueryResult(data);
    } catch (error) {
      console.error('Error executing custom text query:', error);
      toast.error('Failed to execute custom text query');
    } finally {
      setLoading(false);
    }
  };

  const selectedQueryData = queries.find(q => q.id === selectedQuery);

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
            Custom Queries
          </h1>
          <p className="text-gray-600 text-lg">Run predefined queries to gain deeper insights</p>
        </motion.div>

        <div className="max-w-6xl mx-auto px-6 space-y-8">
          {/* Query Selector */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between w-full px-6 py-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-800">
                    {selectedQueryData?.name || 'Select Query'}
                  </span>
                </div>
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
                    className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 py-2 z-10 max-h-64 overflow-y-auto"
                  >
                    {queries.map((query) => (
                      <motion.button
                        key={query.id}
                        onClick={() => handleQueryChange(query.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                        whileHover={{ x: 5 }}
                      >
                        <div className="font-medium text-gray-800">{query.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{query.description}</div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {isAwaitingPrompt && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <form onSubmit={handlePromptSubmit}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter your custom query</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                  placeholder="e.g., 'Show my GPA in semesters where I took more than 5 courses'"
                />
                <motion.button
                  type="submit"
                  className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Execute Query
                </motion.button>
              </form>
            </motion.div>
          )}

          {loading && <LoadingSpinner />}

          {queryResult && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Query Info */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{queryResult.query}</h2>
                    <p className="text-blue-100 mt-1">
                      {selectedQueryData?.description || 'Query executed successfully'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Results Table */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Query Results
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        {queryResult.headers.map((header, index) => (
                          <th key={index} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, rowIndex) => (
                        <motion.tr
                          key={rowIndex}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * rowIndex, duration: 0.4 }}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200"
                        >
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 text-gray-800">
                              {cellIndex === 0 ? (
                                <span className="font-semibold">{cell}</span>
                              ) : (
                                <span className={cellIndex === 1 ? 'font-medium text-blue-600' : ''}>{cell}</span>
                              )}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {!selectedQuery && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 max-w-md mx-auto">
                <Search className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Query</h3>
                <p className="text-gray-600">Choose a predefined query from the dropdown above to view results</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};