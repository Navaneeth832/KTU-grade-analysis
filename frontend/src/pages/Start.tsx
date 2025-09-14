import React from 'react';
import { motion } from 'framer-motion';
import { FormInputIcon, LogIn, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Start: React.FC = () => {
  const features = [
    {
      title: 'Register',
      description: 'Upload your academic data to get started',
      icon:  FormInputIcon,
      path: '/Register',
      color: 'from-red-500 to-pink-600',
    },
    {
      title: 'Login',
      description: 'Login with KTU ID and password',
      icon: LogIn,
      path: '/Login',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pt-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-yellow-600 to-green-600 bg-clip-text text-transparent mb-4 leading-[1.4]">
            Register or Login
          </h1>

        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto px-6">
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
