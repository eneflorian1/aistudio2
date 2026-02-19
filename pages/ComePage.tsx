
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComeEvent, ComePeriod } from '../types';

interface ComePageProps {
  events: ComeEvent[];
  onAddEvent: (text: string, period: ComePeriod) => void;
  onDeleteEvent: (id: string) => void;
  onMoveEvent: (id: string, from: ComePeriod, to: ComePeriod) => void;
}

const ComePage: React.FC<ComePageProps> = ({ events, onAddEvent, onDeleteEvent, onMoveEvent }) => {
  const [activePeriod, setActivePeriod] = useState<ComePeriod>('prezent');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const filteredEvents = events.filter(e => e.period === activePeriod);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newText.trim()) {
      onAddEvent(newText.trim(), activePeriod);
      setNewText('');
      setIsAdding(false);
    }
  };

  const handleComplete = (event: ComeEvent) => {
    if (event.period === 'viitor') {
      onMoveEvent(event.id, 'viitor', 'prezent');
    } else if (event.period === 'prezent') {
      onMoveEvent(event.id, 'prezent', 'trecut');
    }
  };

  return (
    <div className="flex flex-col w-full px-6 py-4 pb-32">
      {/* Switch Period */}
      <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center mb-8 border border-gray-100">
        {(['trecut', 'prezent', 'viitor'] as ComePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activePeriod === p 
                ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight">
          Evenimente {activePeriod}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAdd}
            className="mb-6 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm"
          >
            <input
              autoFocus
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ce eveniment adăugăm?"
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none mb-3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100"
              >
                Adaugă
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-100"
              >
                Anulează
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {filteredEvents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-widest">Niciun eveniment</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-slate-700">{event.text}</span>
              </div>

              {activePeriod !== 'trecut' && (
                <button
                  onClick={() => handleComplete(event)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComePage;
