
import React, { useState, useEffect, useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import ProjectsPage from './pages/ProjectsPage';
import AgentPage from './pages/AgentPage';
import ComePage from './pages/ComePage';
import { ProjectNotes, Project, ProjectConnections, NoteConnection, ProjectPaths, Note, ComeEvent, ComePeriod } from './types';
import { PROJECTS as INITIAL_PROJECTS, INITIAL_NOTES } from './constants';

const motion = m as any;

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

type View = 'projects' | 'agent' | 'index' | 'come';

interface NoteWithProject extends Note {
  project: Project;
}

const App: React.FC = () => {
  // Set index as the default view when accessing the app
  const [currentView, setCurrentView] = useState<View>('index');
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

  const [comeEvents, setComeEvents] = useState<ComeEvent[]>(() => {
    const saved = localStorage.getItem('come_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('come_events', JSON.stringify(comeEvents));
  }, [comeEvents]);

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

  const addNote = (projectId: string, text: string, parentId?: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      completed: false,
      parentId
    };
    setNotes(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), newNote]
    }));
  };

  const deleteNote = (projectId: string, noteId: string) => {
    setNotes(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(n => n.id !== noteId && n.parentId !== noteId)
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
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setNotes(prev => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const reorderProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  const addComeEvent = (text: string, period: ComePeriod, date?: number) => {
    const newEvent: ComeEvent = {
      id: Date.now().toString(),
      text,
      period,
      createdAt: Date.now(),
      date,
      order: comeEvents.length
    };
    setComeEvents(prev => [...prev, newEvent]);
  };

  const deleteComeEvent = (id: string) => {
    setComeEvents(prev => prev.filter(e => e.id !== id));
  };

  const moveComeEvent = (id: string, from: ComePeriod, to: ComePeriod) => {
    setComeEvents(prev => prev.map(e => 
      e.id === id ? { ...e, period: to, isOverdue: false } : e
    ));
  };

  const reorderComeEvents = (newEvents: ComeEvent[]) => {
    // We only reorder within the current period view usually, 
    // but the state holds all of them. 
    // We'll need to merge the reordered subset back into the main list.
    setComeEvents(newEvents);
  };

  // Check for overdue events
  useEffect(() => {
    const checkOverdue = () => {
      const now = Date.now();
      let changed = false;
      const updatedEvents = comeEvents.map(event => {
        if (event.period === 'viitor' && event.date && event.date < now) {
          changed = true;
          return { ...event, period: 'prezent' as ComePeriod, isOverdue: true };
        }
        return event;
      });

      if (changed) {
        setComeEvents(updatedEvents);
      }
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [comeEvents]);

  const navigateTo = (view: View) => {
    setCurrentView(view);
    setSelectedProject(null);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Chronological Task Logic for Index View
  const chronologicalTasks = useMemo(() => {
    const allNotes: NoteWithProject[] = [];
    projects.forEach(p => {
      const projectNotes = notes[p.id] || [];
      projectNotes.forEach(n => {
        allNotes.push({ ...n, project: p });
      });
    });
    
    let filtered = allNotes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = allNotes.filter(n => 
        n.text.toLowerCase().includes(q) || 
        n.project.name.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [projects, notes, searchQuery]);

  const groupedTasks = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;

    return {
      last7: chronologicalTasks.filter(t => (now - t.createdAt) <= week),
      last30: chronologicalTasks.filter(t => (now - t.createdAt) > week && (now - t.createdAt) <= month),
      older: chronologicalTasks.filter(t => (now - t.createdAt) > month)
    };
  }, [chronologicalTasks]);

  const renderTaskItem = (task: NoteWithProject) => (
    <motion.div 
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        setSelectedProject(task.project);
        setCurrentView('projects');
      }}
      className={`flex items-center gap-4 p-4 mb-3 bg-white border border-gray-100 rounded-[1.8rem] shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200 ${task.completed ? 'opacity-50' : ''}`}
    >
      <div className={`w-10 h-10 ${task.project.color} rounded-2xl flex items-center justify-center text-lg shadow-sm flex-shrink-0`}>
        {task.project.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-xs font-black text-slate-800 tracking-tight leading-snug truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
          {task.text}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{task.project.name}</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span className="text-[8px] font-bold text-slate-400">
            {new Date(task.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
      {task.completed && (
        <div className="text-emerald-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddProjectId, setQuickAddProjectId] = useState(projects[0]?.id || '');
  const [smartSummary, setSmartSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const generateSmartSummary = async () => {
    if (isGeneratingSummary) return;
    setIsGeneratingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const context = projects.map(p => {
        const pNotes = notes[p.id] || [];
        return `Proiect: ${p.name}\nNote: ${pNotes.map(n => n.text).join(', ')}`;
      }).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Iată notele proiectelor mele:\n${context}\n\nTe rog să faci un rezumat scurt (maxim 3 propoziții) despre progresul general și ce ar trebui să prioritizez astăzi. Răspunde în română.` }] }]
      });
      setSmartSummary(response.text || "Nu am putut genera un rezumat.");
    } catch (e) {
      console.error(e);
      setSmartSummary("Eroare la generarea rezumatului.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddText.trim() && quickAddProjectId) {
      addNote(quickAddProjectId, quickAddText.trim());
      setQuickAddText('');
      setIsQuickAddOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col max-w-md mx-auto shadow-xl ring-1 ring-gray-100 relative">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">
              {currentView === 'projects' ? 'Proiecte' : currentView === 'agent' ? 'Agent AI' : currentView === 'come' ? 'COME' : 'Activitate Centralizată'}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              {currentView === 'projects' ? 'Gestionare Workspace-uri' : currentView === 'agent' ? 'Analiză Fișiere' : currentView === 'come' ? 'Trecut, Prezent, Viitor' : 'Toate task-urile cronologic'}
            </p>
          </div>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSearchOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50/50 text-gray-400 border border-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input 
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Caută în toate notele..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentView === 'index' && (
            <motion.div
              key="index-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full px-5 py-6 pb-24"
            >
              {/* Smart Summary Section */}
              <div className="mb-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] border border-blue-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                    Smart Summary
                  </h3>
                  <button 
                    onClick={generateSmartSummary}
                    disabled={isGeneratingSummary}
                    className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                  >
                    {isGeneratingSummary ? 'Se generează...' : 'Actualizează'}
                  </button>
                </div>
                {smartSummary ? (
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    {smartSummary}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">
                    Apasă pe actualizează pentru a genera un rezumat inteligent al proiectelor tale folosind AI.
                  </p>
                )}
              </div>

              {chronologicalTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nicio activitate recentă</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {groupedTasks.last7.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        Ultima Săptămână
                        <div className="h-px flex-1 bg-blue-100"></div>
                      </h3>
                      {groupedTasks.last7.map(renderTaskItem)}
                    </div>
                  )}

                  {groupedTasks.last30.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        Ultima Lună
                        <div className="h-px flex-1 bg-slate-100"></div>
                      </h3>
                      {groupedTasks.last30.map(renderTaskItem)}
                    </div>
                  )}

                  {groupedTasks.older.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        Anterioare
                        <div className="h-px flex-1 bg-slate-50"></div>
                      </h3>
                      {groupedTasks.older.map(renderTaskItem)}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Add FAB */}
              <div className="fixed bottom-24 right-6 z-50">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsQuickAddOpen(true)}
                  className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 border-2 border-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentView === 'projects' && (
            <motion.div
              key="projects-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="w-full"
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
              className="w-full"
            >
              <AgentPage notes={notes} projects={projects} />
            </motion.div>
          )}

          {currentView === 'come' && (
            <motion.div
              key="come-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full"
            >
              <ComePage 
                events={comeEvents}
                onAddEvent={addComeEvent}
                onDeleteEvent={deleteComeEvent}
                onMoveEvent={moveComeEvent}
                onReorderEvents={reorderComeEvents}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
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
              <h3 className="text-2xl font-black text-gray-900 mb-6">Notă Rapidă</h3>
              <form onSubmit={handleQuickAdd}>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setQuickAddProjectId(p.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        quickAddProjectId === p.id 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ce ai în minte?"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-8 py-6 text-gray-900 font-bold mb-8 outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Adaugă
                  </button>
                  <button type="button" onClick={() => setIsQuickAddOpen(false)} className="px-8 py-6 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    X
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 safe-bottom z-40 max-w-md mx-auto">
        <nav className="flex justify-around items-center">
          <button 
            onClick={() => navigateTo('index')}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${currentView === 'index' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Index</span>
            {currentView === 'index' && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
          
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
            onClick={() => navigateTo('come')}
            className={`flex flex-col items-center py-2 px-4 transition-colors ${currentView === 'come' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest">COME</span>
            {currentView === 'come' && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default App;
