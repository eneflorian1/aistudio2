import React from 'react';
import { motion as m } from 'framer-motion';

// Casting motion to any to resolve property type mismatches in the current environment
const motion = m as any;

export type FilterState = 'unsolved' | 'solved' | 'all';

interface FilterSwitchProps {
  currentFilter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

const FilterSwitch: React.FC<FilterSwitchProps> = ({ currentFilter, onFilterChange }) => {
  const options: { id: FilterState; label: string }[] = [
    { id: 'unsolved', label: 'De Rezolvat' },
    { id: 'all', label: 'Toate' },
    { id: 'solved', label: 'Rezolvate' },
  ];

  const getIndex = () => options.findIndex(opt => opt.id === currentFilter);

  return (
    <div className="relative w-[280px] h-10 bg-gray-100 rounded-full p-1 flex items-center shadow-inner">
      <motion.div
        className="absolute h-8 bg-white rounded-full shadow-sm z-0"
        initial={false}
        animate={{
          width: `${100 / 3}%`,
          x: `${getIndex() * 100}%`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onFilterChange(option.id)}
          className={`relative z-10 flex-1 text-[10px] font-black uppercase tracking-tight transition-colors duration-200 ${
            currentFilter === option.id ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default FilterSwitch;