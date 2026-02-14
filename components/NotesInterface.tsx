
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Project, Note } from '../types';

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

  // Organizăm notele ierarhic: Părinte urmat imediat de copiii săi
  const hierarchicalNotes = useMemo(() => {
    const topLevel = notes.filter(n => !n.parentId).sort((a, b) => a.createdAt - b.createdAt);
    const result: Note[] = [];
    
    topLevel.forEach(parent => {
      result.push(parent);
      const children = notes.filter(n => n.parentId === parent.id).sort((a, b) => a.createdAt - b.createdAt);
      result.push(...children);
    });
    
    return result;
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAddNote(inputText.trim(), selectedNoteId || undefined);
      setInputText('');
      // Opțional: putem deselecta după adăugare sau păstrăm selecția pentru mai multe sub-note
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
    >
      {/* Header Compact */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-30">
        <button onClick={onClose} className="p-2 text-gray-900 active:bg-gray-100 rounded-full transition-colors mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-[#0f172a] truncate">{project.name}</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest -mt-0.5">Note & Sub-Categorii</p>
        </div>

        <div className={`w-10 h-10 ${project.color} rounded-2xl flex items-center justify-center text-lg shadow-sm ml-2`}>
          {project.icon}
        </div>
      </div>

      {/* Note List Scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#fcfcfd] pb-32">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nicio notă adăugată</p>
          </div>
        ) : (
          <div className="py-4">
            <AnimatePresence initial={false}>
              {hierarchicalNotes.map((note) => {
                const isSubnote = !!note.parentId;
                const isSelected = selectedNoteId === note.id;

                return (
                  <motion.div 
                    key={note.id} 
                    layout
                    initial={{ opacity: 0, x: isSubnote ? 20 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedNoteId(isSelected ? null : note.id)}
                    className={`relative group transition-all duration-300 ${
                      isSubnote ? 'pl-14 pr-5 mb-1' : 'px-5 mb-2'
                    }`}
                  >
                    {/* Linia de conexiune pentru sub-note */}
                    {isSubnote && (
                      <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-100 rounded-full">
                         <div className="absolute top-1/2 left-0 w-4 h-0.5 bg-gray-100 rounded-full" />
                      </div>
                    )}

                    <div className={`flex items-center gap-3 p-3 rounded-[1.8rem] transition-all border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 z-10' 
                        : isSubnote 
                          ? 'bg-white border-gray-100/50 shadow-sm' 
                          : 'bg-white border-gray-100 shadow-md'
                    } ${note.completed && !isSelected ? 'opacity-60 bg-gray-50/50' : ''}`}>
                      
                      {/* Delete Button (X) - Acesta este cel care se deplasează la stânga pentru sub-note */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                          if (selectedNoteId === note.id) setSelectedNoteId(null);
                        }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-rose-50 text-rose-300'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Textul Notei */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] leading-snug break-words ${
                          isSelected 
                            ? 'text-white font-black' 
                            : note.completed 
                              ? 'text-gray-400 line-through font-medium' 
                              : 'text-gray-800 font-bold'
                        }`}>
                          {note.text}
                        </p>
                        <div className={`text-[8px] font-black uppercase tracking-tight mt-1 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isSubnote && ' • Sub-categorie'}
                        </div>
                      </div>

                      {/* Check Button (V) */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleNoteCompletion(note.id);
                        }}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          note.completed 
                            ? 'bg-emerald-500 text-white shadow-lg' 
                            : isSelected ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-300'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input Area Sticky */}
      <motion.div 
        layout
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom shadow-[0_-15px_40px_rgba(0,0,0,0.05)] z-40"
      >
        <AnimatePresence mode="wait">
          {selectedNote && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-2xl mb-3 border border-blue-100"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest truncate">
                  Adaugă sub-notă la: {selectedNote.text}
                </span>
              </div>
              <button onClick={() => setSelectedNoteId(null)} className="p-1 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            autoFocus
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedNote ? "Sub-notă..." : "Notă nouă..."}
            className={`flex-1 bg-gray-50 border-2 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all ${
              selectedNote ? 'border-blue-400 bg-blue-50/30' : 'border-gray-100 focus:border-blue-500'
            }`}
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              inputText.trim() 
                ? 'bg-blue-600 text-white shadow-blue-100' 
                : 'bg-gray-100 text-gray-300 shadow-none'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default NotesInterface;
