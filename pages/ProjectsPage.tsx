
import React, { useState, useMemo } from 'react';
import { motion as m, AnimatePresence, Reorder } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import NotesInterface from '../components/NotesInterface';
import FilterSwitch, { FilterState } from '../components/FilterSwitch';
import ViewModeSwitch, { ViewMode } from '../components/ViewModeSwitch';
import NeuronNetwork from '../components/NeuronNetwork';
import InteractiveNoteNetwork from '../components/InteractiveNoteNetwork';
import { Project, ProjectNotes, ProjectConnections, ProjectPaths } from '../types';

const motion = m as any;

interface ProjectsPageProps {
  projects: Project[];
  notes: ProjectNotes;
  connections: ProjectConnections;
  paths: ProjectPaths;
  onSelectProject: (project: Project | null) => void;
  selectedProject: Project | null;
  addNote: (projectId: string, text: string, parentId?: string) => void;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [checkpointMode, setCheckpointMode] = useState(false);
  const [isPathListOpen, setIsPathListOpen] = useState(false);

  const activeProject = projects[0] || null;

  const pathNotes = useMemo(() => {
    if (!activeProject) return [];
    const projectNotes = notes[activeProject.id] || [];
    const currentPath = paths[activeProject.id] || [];
    return currentPath.map(id => projectNotes.find(n => n.id === id)).filter(Boolean) as any[];
  }, [activeProject, notes, paths]);

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

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="w-full flex flex-col relative bg-[#fcfcfd] min-h-[calc(100vh-140px)]">
      <NeuronNetwork />

      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div 
            key="projects-list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-full pb-32"
          >
            {/* Container Cards - Carousel Horizontal */}
            <div className="z-20 mb-0 w-full">
              <div className="w-full overflow-hidden pb-0 pt-0">
                <Reorder.Group 
                  axis="x" 
                  values={projects} 
                  onReorder={onReorderProjects}
                  className="flex items-center gap-6 overflow-x-auto no-scrollbar h-[280px] px-10 snap-x snap-mandatory"
                >
                  {projects.map((project) => (
                    <Reorder.Item
                      key={project.id}
                      value={project}
                      className="flex-shrink-0 snap-center"
                    >
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="relative"
                      >
                        <ProjectCard 
                          project={project} 
                          notesCount={notes[project.id]?.length || 0} 
                          onClick={() => onSelectProject(project)}
                          onDeleteRequest={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                          }}
                        />
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
              
              {/* Indicator Paginare */}
              <div className="flex justify-center gap-2 -mt-4 mb-6">
                {projects.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-10 bg-blue-600' : 'w-2 bg-gray-200'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Filtre și Mod Vizualizare */}
            <div className="z-20 px-6 mb-8 mt-2 flex flex-col items-center gap-4">
               <FilterSwitch currentFilter={filter} onFilterChange={setFilter} />
               <div className="flex items-center gap-3">
                 <ViewModeSwitch currentMode={viewMode} onModeChange={setViewMode} />
                 <button 
                   onClick={() => setCheckpointMode(!checkpointMode)}
                   className={`h-9 px-4 rounded-2xl flex items-center gap-2 transition-all border font-black text-[9px] uppercase tracking-widest ${
                     checkpointMode 
                       ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                       : 'bg-white text-gray-400 border-gray-100 shadow-sm'
                   }`}
                 >
                   <div className={`w-1.5 h-1.5 rounded-full ${checkpointMode ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                   Path
                 </button>
               </div>
            </div>

            {/* Rețeaua Neuronală */}
            <div className="px-6 z-20 relative">
              <InteractiveNoteNetwork 
                notes={networkData.notes}
                connections={networkData.connections}
                path={networkData.fullPath}
                checkpointMode={checkpointMode}
                onAddConnection={addConnection}
                onUpdatePath={(newPath) => activeProject && updatePath(activeProject.id, newPath)}
                onOpenPathList={() => setIsPathListOpen(true)}
              />
              
              <div className="flex justify-end mt-10 pr-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-16 h-16 bg-white text-blue-600 border border-blue-100 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_rgba(59,130,246,0.15)] active:bg-blue-50 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <NotesInterface 
            key="notes-view"
            project={selectedProject}
            notes={notes[selectedProject.id] || []}
            onClose={() => onSelectProject(null)}
            onAddNote={(text, pId) => addNote(selectedProject.id, text, pId)}
            onDeleteNote={(noteId) => deleteNote(selectedProject.id, noteId)}
            onToggleNoteCompletion={(noteId) => toggleNoteCompletion(selectedProject.id, noteId)}
          />
        )}
      </AnimatePresence>

      {/* Modale */}
      <AnimatePresence>
        {isPathListOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Workflow Path</h3>
                <button onClick={() => setIsPathListOpen(false)} className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
                {pathNotes.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs font-bold py-10 uppercase tracking-widest">Niciun pas definit</p>
                ) : (
                  pathNotes.map((note, idx) => (
                    <div key={note.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-6 h-6 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-full flex-shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-bold text-gray-800 truncate">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {projectToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-xs text-center shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900 mb-2">Ștergi proiectul?</h3>
              <p className="text-xs font-medium text-gray-500 mb-8 leading-relaxed">"{projectToDelete.name}" va fi pierdut definitiv.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onDeleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  }}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                >
                  Confirm Ștergerea
                </button>
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                >
                  Anulează
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[3.5rem] p-10 w-full max-w-md shadow-2xl safe-bottom"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Proiect Nou</h3>
              <form onSubmit={handleCreateProject}>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Numele noului proiect..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-6 text-gray-900 font-bold mb-8 outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Creează
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-6 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    X
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;
