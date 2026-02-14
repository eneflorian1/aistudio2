
import React, { useState, useEffect, useMemo } from 'react';
import { motion as m, AnimatePresence, useMotionValue, useTransform, useSpring, animate } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import NotesInterface from '../components/NotesInterface';
import FilterSwitch, { FilterState } from '../components/FilterSwitch';
import ViewModeSwitch, { ViewMode } from '../components/ViewModeSwitch';
import NeuronNetwork from '../components/NeuronNetwork';
import InteractiveNoteNetwork from '../components/InteractiveNoteNetwork';
import { Project, ProjectNotes, ProjectConnections, ProjectPaths } from '../types';

const motion = m as any;

interface CenteredCarouselItemProps {
  index: number;
  activeIndex: number;
  x: any;
  offset: number;
  project: Project;
  notesCount: number;
  totalItems: number;
  onTap: () => void;
  onDeleteRequest: () => void;
}

const CenteredCarouselItem: React.FC<CenteredCarouselItemProps> = ({
  index,
  activeIndex,
  x,
  offset,
  project,
  notesCount,
  totalItems,
  onTap,
  onDeleteRequest,
}) => {
  // Calculăm poziția relativă față de centru (unde 0 este centrul perfect)
  const relativeIndex = useTransform(x, (val: number) => {
    if (totalItems === 0) return 0;
    
    // Convertim poziția de scroll în unități de index
    const scrollPos = -val / offset;
    const itemOffset = index - scrollPos;
    
    // Algoritm de wrapping pentru a menține cardurile într-un cerc infinit
    const half = totalItems / 2;
    let rel = ((itemOffset + half) % totalItems + totalItems) % totalItems - half;
    
    return rel;
  });

  // Configurație vizuală pentru centrarea în viewport-ul mobil
  const radius = 130;    // Distanța radială redusă pentru a ține cardurile compacte
  const angleStep = 35;  // Unghiul de rotație pentru cardurile secundare

  const displayX = useTransform(relativeIndex, (rel: number) => {
    const angleRad = (rel * angleStep * Math.PI) / 180;
    return Math.sin(angleRad) * radius;
  });

  const displayZ = useTransform(relativeIndex, (rel: number) => {
    const angleRad = (rel * angleStep * Math.PI) / 180;
    // Efect de profunzime pentru cardurile care nu sunt în centru
    return (Math.cos(angleRad) - 1) * radius * 0.8;
  });

  const rotateY = useTransform(relativeIndex, (rel: number) => rel * -angleStep);
  const rotateZ = useTransform(relativeIndex, (rel: number) => rel * 3);
  
  const scale = useTransform(relativeIndex, (rel: number) => {
    // Cardul central are scale 1.0, celelalte scad rapid spre 0.7
    return 1 - Math.min(0.3, Math.abs(rel) * 0.25);
  });

  const opacity = useTransform(relativeIndex, (rel: number) => {
    // Cardurile dispar progresiv pe măsură ce se îndepărtează de centru
    return 1 - Math.min(1, Math.abs(rel) * 0.4);
  });

  const zIndex = useTransform(relativeIndex, (rel: number) => {
    // Cardul cel mai apropiat de rel=0 are z-index-ul cel mai mare
    return Math.round(100 - Math.abs(rel) * 50);
  });

  // Calculăm dacă acest card este cel activ (central) pentru UI interior
  const isSelected = useTransform(relativeIndex, (rel: number) => Math.abs(rel) < 0.5);

  return (
    <motion.div
      style={{
        x: displayX,
        z: displayZ,
        rotateY,
        rotateZ,
        scale,
        opacity,
        zIndex,
        position: 'absolute',
        transformStyle: 'preserve-3d',
      }}
      className="w-[260px] h-[175px] perspective-2000 flex items-center justify-center pointer-events-auto"
      onTap={onTap}
    >
      <div className="w-full h-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
        <ProjectCard 
          project={project} 
          notesCount={notesCount} 
          isTop={Math.abs(((activeIndex % totalItems) + totalItems) % totalItems) === index}
          onDeleteRequest={onDeleteRequest}
        />
      </div>
    </motion.div>
  );
};

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
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [checkpointMode, setCheckpointMode] = useState(false);
  
  const offset = 220; // Distanța de scroll între carduri
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 150, damping: 22 });

  const normalizedIndex = projects.length > 0 
    ? ((activeIndex % projects.length) + projects.length) % projects.length 
    : 0;
  const activeProject = projects[normalizedIndex];

  // Sincronizare inițială
  useEffect(() => {
    dragX.set(-activeIndex * offset);
  }, []);

  const handleDrag = (_: any, info: any) => {
    // Update direct pentru fluiditate maximă în timpul mișcării
    dragX.set(dragX.get() + info.delta.x);
  };

  const handleDragEnd = (_: any, info: any) => {
    const velocity = info.velocity.x;
    const currentX = dragX.get();
    
    // Calculăm indexul țintă bazat pe poziția actuală
    let targetIndex = Math.round(-currentX / offset);
    
    // Adăugăm logică de "swipe" bazată pe viteză (threshold: 400px/s)
    if (Math.abs(velocity) > 400) {
      targetIndex = velocity > 0 ? targetIndex - 1 : targetIndex + 1;
    }

    setActiveIndex(targetIndex);
    
    // Forțăm animația să se oprească EXACT pe coordonata cardului central
    animate(dragX, -targetIndex * offset, {
      type: 'spring',
      stiffness: 300,  // Mai rapid pentru snap decisiv
      damping: 30,
      velocity: velocity
    });
  };

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
      // Navigăm la noul proiect
      const nextIdx = projects.length;
      setActiveIndex(nextIdx);
      animate(dragX, -nextIdx * offset, { type: 'spring', stiffness: 250, damping: 25 });
    }
  };

  const handleTapProject = (index: number, project: Project) => {
    if (index === normalizedIndex) {
      onSelectProject(project);
    } else {
      // Găsim cea mai scurtă cale spre indexul apăsat
      let diff = index - normalizedIndex;
      if (diff > projects.length / 2) diff -= projects.length;
      if (diff < -projects.length / 2) diff += projects.length;
      
      const newIdx = activeIndex + diff;
      setActiveIndex(newIdx);
      animate(dragX, -newIdx * offset, { type: 'spring', stiffness: 250, damping: 25 });
    }
  };

  return (
    <div className="w-full flex flex-col items-center relative py-6 bg-gray-50/20 overflow-hidden min-h-[calc(100vh-140px)]">
      <NeuronNetwork />

      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div 
            key="carousel-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            {/* CAROUSEL CONTAINER: Forțează elementele să fie mereu centrate în centrul vizual al containerului */}
            <div className="relative w-full h-[280px] flex items-center justify-center perspective-2000 overflow-visible mt-2 select-none">
              <motion.div
                drag="x"
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                dragConstraints={{ left: 0, right: 0 }} // Interceptăm drag-ul manual, snap-ul îl facem prin animație
                dragElastic={1}
                style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
                className="relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
              >
                {projects.map((project, index) => (
                  <CenteredCarouselItem
                    key={project.id}
                    index={index}
                    activeIndex={activeIndex}
                    x={smoothX}
                    offset={offset}
                    project={project}
                    totalItems={projects.length}
                    notesCount={notes[project.id]?.length || 0}
                    onTap={() => handleTapProject(index, project)}
                    onDeleteRequest={() => setProjectToDelete(project)}
                  />
                ))}
              </motion.div>
            </div>

            {/* Indicatori & Comenzi */}
            <div className="flex flex-col items-center gap-5 z-20 w-full px-6 mb-20 mt-4">
              <div className="flex items-center gap-2 h-1 mb-2">
                {projects.map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{
                      width: normalizedIndex === i ? 24 : 6,
                      backgroundColor: normalizedIndex === i ? '#2563eb' : '#cbd5e1',
                      opacity: normalizedIndex === i ? 1 : 0.4
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
                  <div className={`w-2 h-2 rounded-full ${checkpointMode ? 'bg-white animate-pulse' : 'bg-gray-200'}`} />
                  Path
                </button>
              </div>

              <div className="w-full mt-2">
                <InteractiveNoteNetwork 
                  notes={networkData.notes}
                  connections={networkData.connections}
                  path={networkData.fullPath}
                  checkpointMode={checkpointMode}
                  onAddConnection={addConnection}
                  onUpdatePath={(newPath) => activeProject && updatePath(activeProject.id, newPath)}
                  onOpenPathList={() => {}}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsModalOpen(true)}
              className="fixed bottom-24 right-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-2xl z-[50] group"
            >
              <div className="absolute inset-0 bg-blue-50 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-200" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            onAddNote={(text, pId) => addNote(selectedProject.id, text, pId)}
            onDeleteNote={(noteId) => deleteNote(selectedProject.id, noteId)}
            onToggleNoteCompletion={(noteId) => toggleNoteCompletion(selectedProject.id, noteId)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {projectToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs text-center shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900 mb-2">Ștergi proiectul?</h3>
              <p className="text-sm font-medium text-gray-500 mb-8">"{projectToDelete.name}" va fi pierdut definitiv.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onDeleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  }}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95"
                >
                  Șterge Proiectul
                </button>
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95"
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
              className="bg-white rounded-t-[3rem] p-8 w-full max-w-md shadow-2xl safe-bottom"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Proiect Nou</h3>
              <form onSubmit={handleCreateProject}>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Numele noului proiect..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-5 text-gray-900 font-bold mb-6 outline-none focus:border-blue-500 transition-all"
                />
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
                    Creează
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-gray-100 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest active:scale-95">
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
