import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectsPage from './pages/ProjectsPage';
import AgentPage from './pages/AgentPage';
import { ProjectNotes, Project, ProjectConnections, NoteConnection, ProjectPaths, Note } from './types';
import { PROJECTS as INITIAL_PROJECTS, INITIAL_NOTES } from './constants';

const COLORS = [
  'bg-blue-600', 
  'bg-emerald-500', 
  'bg-rose-500', 
  'bg-amber-500', 
  'bg-violet-600', 
  'bg-cyan-500', 
  'bg-orange-500',
  'bg-pink-500'
];

const ICONS = ['🚀', '💎', '🏗️', '📈', '🎯', '🎨', '🏢', '🏠', '💻', '📱', '🚗', '🛵', '🍕', '🛒', '⚡', '🌟'];

type View = 'projects' | 'agent' | 'index';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('project_list');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [notes, setNotes] = useState<ProjectNotes>(() => {
    const saved = localStorage.getItem('project_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });
  const [connections, setConnections] = useState<ProjectConnections>(() => {
    const saved = localStorage.getItem('project_connections');
    return saved ? JSON.parse(saved) : [];
  });
  const [paths, setPaths] = useState<ProjectPaths>(() => {
    const saved = localStorage.getItem('project_paths');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('project_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('project_list', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('project_connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    localStorage.setItem('project_paths', JSON.stringify(paths));
  }, [paths]);

  const addNote = (projectId: string, text: string) => {
    const newNote = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      completed: false,
    };
    setNotes(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), newNote]
    }));
  };

  const deleteNote = (projectId: string, noteId: string) => {
    setNotes(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(n => n.id !== noteId)
    }));
    setConnections(prev => prev.filter(c => c.fromId !== noteId && c.toId !== noteId));
    setPaths(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(id => id !== noteId)
    }));
  };

  const toggleNoteCompletion = (projectId: string, noteId: string) => {
    setNotes(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map(n => 
        n.id === noteId ? { ...n, completed: !n.completed } : n
      )
    }));
  };

  const addConnection = (fromId: string, toId: string) => {
    const newConn: NoteConnection = {
      id: `conn-${Date.now()}`,
      fromId,
      toId
    };
    setConnections(prev => [...prev, newConn]);
  };

  const updatePath = (projectId: string, newPath: string[]) => {
    setPaths(prev => ({
      ...prev,
      [projectId]: newPath
    }));
  };

  const addProject = (name: string) => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
    
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      url: '#',
      description: '',
      color: randomColor,
      icon: randomIcon
    };
    setProjects(prev => [...prev, newProject]);
  };

  const deleteProject = (projectId: string) => {
    const projectNoteIds = (notes[projectId] || []).map(n => n.id);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setNotes(prev => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    setConnections(prev => prev.filter(c => !projectNoteIds.includes(c.fromId) && !projectNoteIds.includes(c.toId)));
    setPaths(prev => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
  };

  const reorderProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  const navigateTo = (view: View) => {
    setCurrentView(view);
    setSelectedProject(null);
  };

  const totalNotesCount = Object.values(notes).reduce((acc: number, curr: Note[]) => acc + curr.length, 0);

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col max-w-md mx-auto shadow-xl ring-1 ring-gray-100 overflow-hidden relative">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-5">
        <h1 className="text-xl font-black text-[#0f172a] tracking-tight">
          {currentView === 'projects' ? 'Proiectele Mele' : currentView === 'agent' ? 'Agent AI' : 'Index'}
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          {currentView === 'projects' ? 'Gestionare note și activitate' : currentView === 'agent' ? 'Procesare date complexe' : 'Prezentare și statistici'}
        </p>
      </header>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'projects' && (
            <motion.div
              key="projects-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full"
            >
              <ProjectsPage 
                projects={projects} 
                notes={notes}
                connections={connections}
                paths={paths}
                onSelectProject={setSelectedProject}
                selectedProject={selectedProject}
                addNote={addNote}
                deleteNote={deleteNote}
                toggleNoteCompletion={toggleNoteCompletion}
                addConnection={addConnection}
                updatePath={updatePath}
                onAddProject={addProject}
                onDeleteProject={deleteProject}
                onReorderProjects={reorderProjects}
              />
            </motion.div>
          )}

          {currentView === 'agent' && (
            <motion.div
              key="agent-view"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full"
            >
              <AgentPage />
            </motion.div>
          )}

          {currentView === 'index' && (
            <motion.div
              key="index-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full p-8 flex flex-col items-center justify-center text-center overflow-y-auto"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-[#0f172a] mb-2">Index General</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[240px]">
                Prezentarea activității tale centralizate pe toate platformele.
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-10">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                  <div className="text-2xl font-black text-blue-600">{projects.length}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Proiecte</div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                  <div className="text-2xl font-black text-emerald-500">{totalNotesCount}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Note Totale</div>
                </div>
              </div>

              <div className="mt-8 w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Stare Sistem</h4>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Platformă Activă</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-100 p-4 safe-bottom">
        <nav className="flex justify-around items-center">
          <button 
            onClick={() => navigateTo('projects')}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${currentView === 'projects' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Proiecte</span>
            {currentView === 'projects' && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
          
          <button 
            onClick={() => navigateTo('agent')}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${currentView === 'agent' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Agent</span>
            {currentView === 'agent' && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
          
          <button 
            onClick={() => navigateTo('index')}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${currentView === 'index' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Index</span>
            {currentView === 'index' && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default App;
