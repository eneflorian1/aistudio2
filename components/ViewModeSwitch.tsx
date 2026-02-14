
import React from 'react';
import { motion } from 'framer-motion';

export type ViewMode = 'single' | 'merge';

interface ViewModeSwitchProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const ViewModeSwitch: React.FC<ViewModeSwitchProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="relative w-[200px] h-9 bg-gray-100/80 rounded-full p-1 flex items-center shadow-inner border border-gray-100">
      <motion.div
        className="absolute h-7 bg-white rounded-full shadow-sm z-0"
        initial={false}
        animate={{
          width: 'calc(50% - 4px)',
          x: currentMode === 'single' ? 0 : '100%',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      <button
        onClick={() => onModeChange('single')}
        className={`relative z-10 flex-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-200 ${
          currentMode === 'single' ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        Individual
      </button>
      <button
        onClick={() => onModeChange('merge')}
        className={`relative z-10 flex-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-200 ${
          currentMode === 'merge' ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        Merge
      </button>
    </div>
  );
};

export default ViewModeSwitch;
