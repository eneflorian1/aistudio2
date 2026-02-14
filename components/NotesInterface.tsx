
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Project, Note } from '../types';

// Casting motion to any to resolve property type mismatches in the current environment
const motion = m as any;

interface NotesInterfaceProps {
  project: Project;
  notes: Note[];
  onClose: () => void;
  onAddNote: (text: string, parentId?: string) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleNoteCompletion: (noteId: string) => void;
}

const NotesInterface: React.FC<NotesInterfaceProps> = ({ 
  project, 
  notes, 
  onClose, 
  onAddNote, 
  onDeleteNote,
  onToggleNoteCompletion 
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId), 
  [notes, selectedNoteId]);

  // Organizăm notele într-o structură ierarhică
  const hierarchicalNotes = useMemo(() => {
    const topLevel = notes.filter(n => !n.parentId).sort((a, b) => {
      if (a.completed === b.completed) return a.createdAt - b.createdAt;
      return a.completed ? -1 : 1;
    });

    const result: Note[] = [];
    topLevel.forEach(parent => {
      result.push(parent);
      const children = notes.filter(n => n.parentId === parent.id).sort((a, b) => a.createdAt - b.createdAt);
      result.push(...children);
    });
    
    return result;
  }, [notes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAddNote(inputText.trim(), selectedNoteId || undefined);
      setInputText('');
      // Opțional: păstrăm sau resetăm selecția după adăugare
      // setSelectedNoteId(null); 
    }
  };

  const handleNoteClick = (noteId: string) => {
    setSelectedNoteId(prev => prev === noteId ? null : noteId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center sticky top-0 z-20">
        <button 
          onClick={onClose}
          className="p-1 text-gray-900 hover:bg-gray-50 rounded-full transition-colors mr-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <motion.h2 
          layoutId={`name-${project.id}`}
          className="text-xl font-black text-[#0f172a] tracking-tight flex-1 truncate"
        >
          {project.name}
        </motion.h2>

        <div className="flex items-center gap-2">
          <motion.div layoutId={`count-${project.id}`}>
            <div className="bg-[#eff6ff] px-3 py-1.5 rounded-full border border-[#dbeafe]">
              <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-wider">
                {notes.length} {notes.length === 1 ? 'NOTĂ' : 'NOTE'}
              </span>
            </div>
          </motion.div>
          <motion.div layoutId={`icon-${project.id}`}>
             <div className={`w-9 h-9 ${project.color} rounded-xl flex items-center justify-center text-sm shadow-sm`}>
              {project.icon}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Note List */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white pt-6"
      >
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Nicio notă</p>
          </div>
        ) : (
          <div className="px-0 pb-12">
            <AnimatePresence initial={false}>
              {hierarchicalNotes.map((note) => (
                <motion.div 
                  key={note.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNoteClick(note.id)}
                  className={`relative flex items-center gap-3 px-5 py-4 transition-all ${
                    note.parentId ? 'ml-10 border-l-2 border-gray-100 bg-gray-50/30' : 'bg-transparent border-b border-gray-50'
                  } ${
                    selectedNoteId === note.id ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/30 z-10' : ''
                  } ${
                    note.completed ? 'opacity-60' : ''
                  }`}
                >
                  {/* Indicator selecție activă */}
                  {selectedNoteId === note.id && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500 rounded-r-full" />
                  )}

                  {/* Delete Button (X) */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#cbd5e1] hover:text-red-500 transition-colors"
                    aria-label="Șterge"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Note Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <p className={`text-[15px] leading-relaxed transition-all ${
                      note.completed ? 'text-emerald-700/70 line-through font-medium' : 'text-slate-800 font-bold'
                    }`}>
                      {note.text}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-tight">
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {note.parentId && (
                        <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">Sub-notă</span>
                      )}
                    </div>
                  </div>

                  {/* Complete Button (V) */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleNoteCompletion(note.id);
                    }}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      note.completed 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' 
                        : 'bg-slate-100 text-slate-300 hover:text-emerald-500'
                    }`}
                    aria-label="Finalizează"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Input Area */}
      <motion.div 
        layout
        className="px-4 py-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] safe-bottom"
      >
        <AnimatePresence>
          {selectedNote && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-xl mb-3 border border-blue-100"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">
                  Sub-notă la: {selectedNote.text}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNoteId(null)}
                className="text-blue-400 hover:text-blue-600 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedNote ? "Scrie sub-nota..." : "Adaugă o notă nouă..."}
              className={`w-full bg-[#f8fafc] border-[1.5px] rounded-2xl px-5 py-4 text-black text-[15px] font-bold transition-all outline-none placeholder:text-[#94a3b8] placeholder:font-medium ${
                selectedNote ? 'border-blue-400 ring-4 ring-blue-50' : 'border-[#bfdbfe] focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
              }`}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              inputText.trim() 
                ? (selectedNote ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-[#3b82f6] text-white shadow-blue-200')
                : 'bg-gray-100 text-gray-300 shadow-none'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 transform rotate-90 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default NotesInterface;
