
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
      className={`absolute inset-0 w-full h-full rounded-[2rem] p-6 overflow-hidden transition-all cursor-pointer active:scale-[0.97] border shadow-2xl ${
        isMarketplace 
          ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-100' 
          : 'bg-white border-gray-100'
      }`}
    >
      {/* Premium Badge for de-vanzare */}
      {isMarketplace && (
        <div className="absolute top-0 right-0">
          <div className="bg-amber-500 text-white text-[7px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rotate-45 translate-x-4 translate-y-2 shadow-sm">
            Premium
          </div>
        </div>
      )}

      {/* Decorative Gradient Blob */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${project.color}`}></div>
      
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <motion.div 
            layoutId={`icon-${project.id}`}
            className={`w-12 h-12 ${project.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-100 transform -rotate-3`}
          >
            {project.icon}
          </motion.div>

          <div className="flex items-center gap-2">
             <motion.div layoutId={`count-${project.id}`} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notesCount} Note</span>
             </motion.div>
             
             {onDeleteRequest && isTop && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(e);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 active:bg-rose-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Ofertă Activă Marketplace</span>
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Workspace Activ</p>
          )}
        </div>
      </div>

      {/* Visual Indicator for Stack */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-100 rounded-full opacity-50"></div>
    </motion.div>
  );
};

export default ProjectCard;
