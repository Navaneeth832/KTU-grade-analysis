import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 100 }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className={`bg-gradient-to-br ${color} p-6 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
        </div>
        <motion.div 
          className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <Icon className="h-8 w-8 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
};