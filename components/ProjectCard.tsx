
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
      className={`absolute inset-0 w-full h-full rounded-[2.5rem] p-6 overflow-hidden transition-all cursor-pointer active:scale-[0.97] border shadow-2xl ${
        isMarketplace 
          ? 'bg-gradient-to-br from-white via-white to-amber-50/40 border-amber-200' 
          : 'bg-white border-gray-100'
      }`}
    >
      {/* Premium Badge for marketplace projects */}
      {isMarketplace && (
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
          <div className="absolute top-5 -right-7 bg-amber-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-10 py-1.5 rotate-45 shadow-sm">
            Premium
          </div>
        </div>
      )}

      {/* Decorative Gradient Blob */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${project.color}`}></div>
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex justify-between items-start">
          <motion.div 
            layoutId={`icon-${project.id}`}
            className={`w-14 h-14 ${project.color} rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl transform -rotate-3 border-4 border-white`}
          >
            {project.icon}
          </motion.div>

          <div className="flex items-center gap-2">
             <motion.div layoutId={`count-${project.id}`} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notesCount} Note</span>
             </motion.div>
             
             {onDeleteRequest && isTop && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(e);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 active:bg-rose-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <motion.h3 
            layoutId={`name-${project.id}`}
            className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1"
          >
            {project.name}
          </motion.h3>
          {isMarketplace ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.1em]">Anunț Activ Marketplace</span>
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Workspace de lucru activ</p>
          )}
        </div>
      </div>

      {/* Visual Indicator for Stack (Mobile UX) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full opacity-60"></div>
    </motion.div>
  );
};

export default ProjectCard;
