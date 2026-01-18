
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const ViewToggle = ({ currentView, onToggle }) => {
  return (
    <div className="flex items-center bg-surface border border-border rounded-lg p-1 gap-1">
      <button
        onClick={() => onToggle('client')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          currentView === 'client'
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Eye className="h-4 w-4" />
        Visão Cliente
      </button>
      <button
        onClick={() => onToggle('admin')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          currentView === 'admin'
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <EyeOff className="h-4 w-4" />
        Visão Admin
      </button>
    </div>
  );
};

export default ViewToggle;
