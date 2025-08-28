import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className="w-12 h-12 border-4 border-blue-200 rounded-full"
        style={{
          borderTopColor: 'transparent',
          background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export const LoadingCard: React.FC = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="animate-pulse">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4"></div>
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
};