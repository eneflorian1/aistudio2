
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion as m, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import NotesInterface from '../components/NotesInterface';
import FilterSwitch, { FilterState } from '../components/FilterSwitch';
import ViewModeSwitch, { ViewMode } from '../components/ViewModeSwitch';
import NeuronNetwork from '../components/NeuronNetwork';
import InteractiveNoteNetwork from '../components/InteractiveNoteNetwork';
import { Project, ProjectNotes, ProjectConnections, ProjectPaths, Note } from '../types';

// Casting motion to any to resolve property type mismatches in the current environment
const motion = m as any;

interface ProjectsPageProps {
  projects: Project[];
  notes: ProjectNotes;
  connections: ProjectConnections;
  paths: ProjectPaths;
  onSelectProject: (project: Project | null) => void;
  selectedProject: Project | null;
  addNote: (projectId: string, text: string) => void;
  deleteNote: (projectId: string, noteId: string) => void;
  toggleNoteCompletion: (projectId: string, noteId: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  updatePath: (projectId: string, newPath: string[]) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onReorderProjects: (projects: Project[]) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ 
  projects, 
  notes, 
  connections,
  paths,
  onSelectProject, 
  selectedProject,
  addNote,
  deleteNote,
  toggleNoteCompletion,
  addConnection,
  updatePath,
  onAddProject,
  onDeleteProject,
  onReorderProjects
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [checkpointMode, setCheckpointMode] = useState(false);
  const [showPathList, setShowPathList] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const offset = 80; 
  const dragX = useMotionValue(0);
  const x = useSpring(dragX, { stiffness: 300, damping: 35 });

  const activeProject = projects[activeIndex];

  const networkData = useMemo(() => {
    let baseNotes: any[] = [];
    if (viewMode === 'merge') {
      baseNotes = projects.flatMap(p => 
        (notes[p.id] || []).map(n => ({ ...n, projectId: p.id, projectColor: p.color }))
      );
    } else {
      if (!activeProject) return { notes: [], connections: [], fullPath: [] };
      baseNotes = (notes[activeProject.id] || []).map(n => ({ 
        ...n, 
        projectId: activeProject.id, 
        projectColor: activeProject.color 
      }));
    }

    const filteredNotes = baseNotes.filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unsolved') return !n.completed;
      if (filter === 'solved') return n.completed;
      return true;
    });

    const noteIds = new Set(filteredNotes.map(n => n.id));
    const filteredConnections = connections.filter(c => 
      noteIds.has(c.fromId) && noteIds.has(c.toId)
    );
    const fullPath = activeProject ? (paths[activeProject.id] || []) : [];

    return { 
      notes: filteredNotes, 
      connections: filteredConnections,
      fullPath: fullPath
    };
  }, [viewMode, filter, projects, notes, activeProject, connections, paths]);

  const pathNotes = useMemo(() => {
    if (!activeProject) return [];
    const allNotes = notes[activeProject.id] || [];
    return networkData.fullPath.map(id => allNotes.find(n => n.id === id)).filter((n): n is Note => !!n);
  }, [networkData.fullPath, notes, activeProject]);

  useEffect(() => {
    if (!isReordering) {
      dragX.set(-activeIndex * offset);
    }
  }, [activeIndex, dragX, offset, isReordering]);

  const handleDragEnd = (_: any, info: any) => {
    if (isReordering) return;
    const currentX = dragX.get();
    const velocity = info.velocity.x;
    const targetX = currentX + velocity * 0.15;
    let newIndex = Math.round(targetX / -offset);
    newIndex = Math.max(0, Math.min(newIndex, projects.length - 1));
    setActiveIndex(newIndex);
    dragX.set(-newIndex * offset);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsModalOpen(false);
      setActiveIndex(projects.length);
    }
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleReorderProjects = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(fromIndex, 1);
    newProjects.splice(toIndex, 0, movedProject);
    onReorderProjects(newProjects);
    setActiveIndex(toIndex);
  };

  return (
    <div className="w-full flex flex-col items-center relative py-6 bg-gray-50/20">
      <NeuronNetwork />

      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div 
            key="stack-carousel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center w-full relative"
          >
            {/* Adăugat class-a 'allow-scroll' și 'touch-pan-y' pentru a permite scroll vertical pe zona de drag */}
            <div className="relative w-full h-[220px] flex items-center justify-center perspective-1000 z-10 mb-4 touch-pan-y allow-scroll">
              <motion.div
                drag={isReordering ? false : "x"}
                dragDirectionLock
                dragConstraints={{ left: -(projects.length - 1) * offset, right: 0 }}
                style={{ x }}
                onDragEnd={handleDragEnd}
                className={`relative w-[300px] h-[160px] ${isReordering ? '' : 'cursor-grab active:cursor-grabbing'}`}
              >
                {projects.map((project, index) => (
                  <FannedCarouselItem
                    key={project.id}
                    index={index}
                    activeIndex={activeIndex}
                    x={x}
                    offset={offset}
                    project={project}
                    notesCount={notes[project.id]?.length || 0}
                    isReorderingGlobal={isReordering}
                    draggedId={draggedId}
                    onStartReorder={() => {
                      setIsReordering(true);
                      setDraggedId(project.id);
                    }}
                    onStopReorder={() => {
                      setIsReordering(false);
                      setDraggedId(null);
                    }}
                    onPositionChange={(newIndex: number) => handleReorderProjects(index, newIndex)}
                    onTap={() => {
                      if (!isReordering) {
                        index === activeIndex ? onSelectProject(project) : setActiveIndex(index);
                      }
                    }}
                    onDeleteRequest={() => setProjectToDelete(project)}
                  />
                ))}
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-4 z-20 w-full px-6 mb-24">
              <div className="flex items-center gap-1.5 h-1 mb-2">
                {projects.map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{
                      width: activeIndex === i ? 20 : 5,
                      backgroundColor: activeIndex === i ? '#2563eb' : '#cbd5e1',
                      opacity: activeIndex === i ? 1 : 0.4
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                ))}
              </div>

              <FilterSwitch currentFilter={filter} onFilterChange={setFilter} />

              <div className="flex items-center gap-3 w-full justify-center">
                <ViewModeSwitch currentMode={viewMode} onModeChange={setViewMode} />
                <button 
                  onClick={() => setCheckpointMode(!checkpointMode)}
                  className={`h-9 px-4 rounded-full flex items-center gap-2 transition-all border font-black text-[9px] uppercase tracking-widest shadow-sm ${
                    checkpointMode 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-400 border-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4a1 1 0 01-.8 1.6H6a1 1 0 01-1-1V7a1 1 0 10-2 0v8a1 1 0 102 0v-1h10a3 3 0 013 3 1 1 0 11-6 0h-4a3 3 0 01-3-3V6z" clipRule="evenodd" />
                  </svg>
                  Path
                </button>
              </div>

              <div className="w-full mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {viewMode === 'merge' ? 'Merge Network' : (checkpointMode ? 'Path Creation' : 'Project Network')}
                  </h4>
                  {viewMode === 'single' && activeProject && (
                    <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                      {activeProject.name}
                    </span>
                  )}
                </div>
                <InteractiveNoteNetwork 
                  notes={networkData.notes}
                  connections={networkData.connections}
                  path={networkData.fullPath}
                  checkpointMode={checkpointMode}
                  onAddConnection={addConnection}
                  onUpdatePath={(newPath) => activeProject && updatePath(activeProject.id, newPath)}
                  onOpenPathList={() => setShowPathList(true)}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsModalOpen(true)}
              className="fixed bottom-24 right-6 w-14 h-14 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-2xl z-[50] active:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </motion.button>
          </motion.div>
        ) : (
          <NotesInterface 
            key="notes-view"
            project={selectedProject}
            notes={notes[selectedProject.id] || []}
            onClose={() => onSelectProject(null)}
            onAddNote={(text) => addNote(selectedProject.id, text)}
            onDeleteNote={(noteId) => deleteNote(selectedProject.id, noteId)}
            onToggleNoteCompletion={(noteId) => toggleNoteCompletion(selectedProject.id, noteId)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPathList && activeProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-3xl flex flex-col"
          >
            <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center sticky top-0 z-20">
              <button 
                onClick={() => setShowPathList(false)}
                className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-colors mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex-1 truncate">
                <h2 className="text-xl font-black text-[#0f172a] tracking-tight truncate">
                  Flux: {activeProject.name}
                </h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Drum Secvențial (Path)</p>
              </div>

              <div className={`w-9 h-9 ${activeProject.color} rounded-xl flex items-center justify-center text-sm shadow-sm ml-2`}>
                {activeProject.icon}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              {pathNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20">
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Niciun pas definit</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pathNotes.map((note, index) => (
                    <motion.div
                      key={`path-list-item-${note.id}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-[0.03] pointer-events-none select-none">
                         <div className="text-8xl font-black text-blue-600">#{index + 1}</div>
                      </div>
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-lg shadow-blue-100">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-[16px] font-bold text-slate-800 leading-relaxed mb-1 italic">
                          "{note.text}"
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${note.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-500'}`}>
                             {note.completed ? 'Finalizat' : 'Activ'}
                           </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 safe-bottom">
              <button 
                onClick={() => setShowPathList(false)}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
              >
                Înapoi la rețea
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full bg-white rounded-[2.5rem] p-8 card-shadow">
              <h2 className="text-2xl font-black text-[#0f172a] mb-6">Nou Proiect</h2>
              <form onSubmit={handleCreateProject}>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nume proiect</label>
                <input autoFocus type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="ex: Apartament Mamaia..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold text-slate-900 mb-8 outline-none focus:border-blue-500 transition-colors" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Anulează</button>
                  <button type="submit" disabled={!newProjectName.trim()} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50">Creează</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {projectToDelete && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProjectToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative w-full bg-white rounded-[2rem] p-8 card-shadow text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-[#0f172a] mb-2 uppercase tracking-tight">Ștergi proiectul?</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4 leading-relaxed">Ești sigur că vrei să ștergi <span className="font-black text-slate-900">"{projectToDelete.name}"</span>? Toate notele vor fi pierdute definitiv.</p>
              <div className="flex flex-col gap-2">
                <button onClick={confirmDelete} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all">Da, Șterge Proiectul</button>
                <button onClick={() => setProjectToDelete(null)} className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Anulează</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FannedCarouselItem = ({ 
  index, activeIndex, x, offset, project, notesCount, onTap, 
  onStartReorder, onStopReorder, onPositionChange, isReorderingGlobal, draggedId, onDeleteRequest 
}: any) => {
  const itemX = index * offset;
  const distance = useTransform(x, (val: number) => Math.abs(val + itemX));
  const scaleValue = useTransform(distance, [0, offset, offset * 2.5], [1, 0.85, 0.7]);
  const rotateValue = useTransform(x, [-(itemX + offset), -itemX, -(itemX - offset)], [-10, 0, 10]);
  const opacityValue = useTransform(distance, [0, offset * 3], [1, 0.3]);
  const zIndexBase = 100 - Math.abs(index - activeIndex);
  const drift = useTransform(x, [-(itemX + offset), -itemX, -(itemX - offset)], [10, 0, -10]);

  const [isThisBeingDragged, setIsThisBeingDragged] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const handlePointerDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setIsThisBeingDragged(true);
      onStartReorder();
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isThisBeingDragged) {
      setIsThisBeingDragged(false);
      onStopReorder();
    }
  };

  const handleDrag = (_: any, info: any) => {
    if (!isThisBeingDragged) return;
    
    // Determinăm direcția și dacă am depășit pragul pentru mutare
    const threshold = offset * 0.7;
    if (info.offset.x > threshold) {
      onPositionChange(index + 1);
    } else if (info.offset.x < -threshold) {
      onPositionChange(index - 1);
    }
  };

  return (
    <motion.div
      onTap={onTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      drag={isThisBeingDragged ? true : false}
      onDrag={handleDrag}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: itemX, 
        width: 300, 
        height: 180, 
        scale: isThisBeingDragged ? 1.05 : scaleValue, 
        rotate: isThisBeingDragged ? 0 : rotateValue, 
        opacity: draggedId && draggedId !== project.id ? 0.3 : opacityValue, 
        zIndex: isThisBeingDragged ? 1000 : zIndexBase, 
        x: isThisBeingDragged ? 0 : drift,
        y: isThisBeingDragged ? -40 : 0,
        touchAction: 'pan-y' // Crucial pentru a permite scroll vertical peste element
      }}
      className={`flex-shrink-0 transition-shadow duration-300 ${isThisBeingDragged ? 'shadow-2xl z-[1000]' : ''}`}
    >
      <ProjectCard 
        project={project} 
        notesCount={notesCount} 
        isTop={index === activeIndex} 
        onDeleteRequest={index === activeIndex ? onDeleteRequest : undefined} 
      />
      
      {isThisBeingDragged && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce">
          Mută Proiectul
        </div>
      )}
    </motion.div>
  );
};

export default ProjectsPage;
