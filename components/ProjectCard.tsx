
import React from 'react';
import { motion as m } from 'framer-motion';
import { Project } from '../types';

const motion = m as any;

interface ProjectCardProps {
  project: Project;
  notesCount: number;
  onClick?: () => void;
  onDeleteRequest?: (e: React.MouseEvent) => void;
  isTop?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, notesCount, onClick, onDeleteRequest }) => {
  const isMarketplace = project.id === 'de-vanzare' || project.name.toLowerCase().includes('vanzare');

  return (
    <motion.div
      onClick={onClick}
      className={`relative w-[300px] h-[200px] rounded-[3.5rem] p-8 overflow-hidden transition-all cursor-pointer active:scale-[0.98] border shadow-[0_30px_60px_rgba(0,0,0,0.08)] flex flex-col justify-between bg-white ${
        isMarketplace ? 'border-amber-100' : 'border-gray-50'
      }`}
    >
      {/* Premium Stripe for Marketplace */}
      {isMarketplace && (
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-6 -right-8 w-32 py-1.5 bg-amber-400 text-white text-[9px] font-black uppercase tracking-widest text-center rotate-45 shadow-sm">
            Premium
          </div>
        </div>
      )}

      {/* Top Section: Icon, Notes Badge, Delete */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-[1.8rem] flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-gray-50 flex-shrink-0">
            {project.icon}
          </div>
          <div className="bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notesCount} NOTE</span>
          </div>
        </div>
        
        {onDeleteRequest && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(e);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50/50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Section: Name & Status */}
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3 truncate">
          {project.name}
        </h3>
        <div className="flex items-center gap-2">
          {isMarketplace ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Anunț Activ Marketplace</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Activ</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
