
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Note } from '../types';

interface NotesInterfaceProps {
  project: Project;
  notes: Note[];
  onClose: () => void;
  onAddNote: (text: string) => void;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sorting: Completed notes "sus de tot" (at the very top), then chronological within groups
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.completed === b.completed) {
        return a.createdAt - b.createdAt;
      }
      return a.completed ? -1 : 1;
    });
  }, [notes]);

  useEffect(() => {
    if (scrollRef.current) {
      // "sa se afiseze partea de jos a ecranului cu notite"
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAddNote(inputText.trim());
      setInputText('');
    }
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
          <div className="px-0">
            <AnimatePresence initial={false}>
              {sortedNotes.map((note) => (
                <motion.div 
                  key={note.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative flex items-center gap-3 px-5 py-4 transition-colors ${
                    note.completed ? 'bg-emerald-50/50' : 'bg-transparent'
                  } border-b border-gray-50`}
                >
                  {/* Delete Button (X) on the LEFT */}
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#cbd5e1] hover:text-red-500 transition-colors"
                    aria-label="Șterge"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Note Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] leading-relaxed transition-all ${
                      note.completed ? 'text-emerald-700/70 line-through font-medium' : 'text-slate-800 font-medium'
                    }`}>
                      {note.text}
                    </p>
                    <p className="text-[10px] text-[#94a3b8] mt-0.5 font-bold uppercase tracking-tight">
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Complete Button (V) on the RIGHT */}
                  <button 
                    onClick={() => onToggleNoteCompletion(note.id)}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      note.completed 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' 
                        : 'bg-slate-50 text-slate-300 hover:text-emerald-500'
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
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 py-6 bg-white border-t border-gray-50 safe-bottom"
      >
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Adaugă o notă nouă..."
              className="w-full bg-[#f8fafc] border-[1.5px] border-[#bfdbfe] rounded-2xl px-5 py-4 text-black text-[15px] font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none placeholder:text-[#94a3b8] placeholder:font-medium"
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              inputText.trim() 
                ? 'bg-[#3b82f6] text-white shadow-blue-200' 
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
