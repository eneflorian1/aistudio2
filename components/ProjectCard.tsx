import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  notesCount: number;
  onClick?: () => void;
  onDeleteRequest?: (e: React.MouseEvent) => void;
  isTop?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, notesCount, onClick, onDeleteRequest, isTop }) => {
  const isMarketplace = project.id === 'de-vanzare' || project.name.toLowerCase().includes('vanzare');

  return (
    <motion.div
      layoutId={`card-${project.id}`}
      onClick={onClick}
      className="absolute inset-0 w-full h-full bg-white rounded-[1.5rem] p-5 border border-gray-100 card-shadow overflow-hidden transition-shadow cursor-pointer active:scale-[0.98]"
    >
      {/* Background Accent */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 ${project.color}`}></div>
      
      {/* Top Left: Icon & Badge */}
      <motion.div 
        layoutId={`icon-${project.id}`}
        className="absolute top-4 left-4 flex items-center gap-3"
      >
        <div className={`w-10 h-10 ${project.color} rounded-xl flex items-center justify-center text-xl shadow-sm transform -rotate-3`}>
          {project.icon}
        </div>
        {isMarketplace && (
          <div className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border border-amber-200 shadow-sm">
            Vânzare
          </div>
        )}
      </motion.div>

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {onDeleteRequest && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(e);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:text-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        
        <motion.div 
          layoutId={`count-${project.id}`}
        >
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 h-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
              {notesCount} Note
            </span>
          </div>
        </motion.div>
      </div>

      {/* Center: Project Name */}
      <div className="h-full flex flex-col items-center justify-center pt-4">
        <motion.h3 
          layoutId={`name-${project.id}`}
          className="text-2xl font-black text-gray-900 tracking-tight text-center px-4 leading-tight mb-1"
        >
          {project.name}
        </motion.h3>
        {isMarketplace && (
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Listings</p>
        )}
      </div>

      <div className="absolute bottom-3 left-0 w-full flex justify-center opacity-30">
        <div className={`w-8 h-1 rounded-full transition-colors ${isTop ? 'bg-blue-300' : 'bg-gray-200'}`}></div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;