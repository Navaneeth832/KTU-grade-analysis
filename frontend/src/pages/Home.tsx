import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const features = [
    {
      title: 'Overall Analysis',
      description: 'View comprehensive statistics and performance metrics',
      icon: BarChart3,
      path: '/overall-analysis',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Semester Analysis',
      description: 'Analyze performance for specific semesters',
      icon: Calendar,
      path: '/semester-analysis',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Custom Queries',
      description: 'Run predefined queries to get insights',
      icon: Search,
      path: '/custom-queries',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analyze your academic performance with powerful insights and beautiful visualizations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <Link to={feature.path}>
                <motion.div
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-gradient-to-br ${feature.color} p-8 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm hover:shadow-3xl transition-all duration-300 group cursor-pointer`}
                >
                  <motion.div 
                    className="p-4 bg-white/20 rounded-xl backdrop-blur-sm w-fit mb-6"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <motion.div 
                    className="flex items-center mt-6 text-white font-semibold"
                    initial={{ x: 0 }}
                    whileHover={{ x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>Explore</span>
                    <TrendingUp className="ml-2 h-5 w-5" />
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};