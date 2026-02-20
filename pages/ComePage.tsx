
import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ComeEvent, ComePeriod } from '../types';

interface ComePageProps {
  events: ComeEvent[];
  onAddEvent: (text: string, period: ComePeriod, date?: number) => void;
  onDeleteEvent: (id: string) => void;
  onMoveEvent: (id: string, from: ComePeriod, to: ComePeriod) => void;
  onReorderEvents: (events: ComeEvent[]) => void;
}

const ComePage: React.FC<ComePageProps> = ({ events, onAddEvent, onDeleteEvent, onMoveEvent, onReorderEvents }) => {
  const [activePeriod, setActivePeriod] = useState<ComePeriod>('prezent');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredEvents = events
    .filter(e => e.period === activePeriod)
    .sort((a, b) => a.order - b.order);

  const handleReorder = (newOrder: ComeEvent[]) => {
    // Merge reordered subset back into the full list
    const otherEvents = events.filter(e => e.period !== activePeriod);
    const updatedList = [...otherEvents, ...newOrder.map((e, idx) => ({ ...e, order: idx }))];
    onReorderEvents(updatedList);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newText.trim()) {
      let date: number | undefined;
      if (activePeriod === 'viitor') {
        // Set to the first day of the selected month/year
        date = new Date(selectedYear, selectedMonth, 1).getTime();
      }
      onAddEvent(newText.trim(), activePeriod, date);
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

  const months = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

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

      {/* Events List */}
      <Reorder.Group 
        axis="y" 
        values={filteredEvents} 
        onReorder={handleReorder}
        className="flex flex-col gap-3"
      >
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
            <Reorder.Item
              key={event.id}
              value={event}
              className={`p-2 px-3 rounded-xl border shadow-sm flex items-center justify-between group cursor-grab active:cursor-grabbing transition-colors ${
                event.isOverdue 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${event.isOverdue ? 'text-amber-900' : 'text-slate-700'}`}>
                    {event.text}
                  </span>
                  {event.isOverdue && (
                    <span className="text-[7px] font-black uppercase tracking-widest text-amber-600 mt-0.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                      It happened?
                    </span>
                  )}
                  {event.period === 'viitor' && event.date && (
                    <span className="text-[7px] font-black uppercase tracking-widest text-blue-400 mt-0.5">
                      {new Date(event.date).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {activePeriod !== 'trecut' && (
                <button
                  onClick={() => handleComplete(event)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                    event.isOverdue
                      ? 'bg-amber-200 text-amber-700 hover:bg-amber-300'
                      : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </Reorder.Item>
          ))
        )}
      </Reorder.Group>

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 active:scale-90 transition-transform border-2 border-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add Form Popup (Bottom Sheet) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl pointer-events-auto"
            >
              <form onSubmit={handleAdd}>
                <h3 className="text-lg font-black text-slate-900 mb-4 px-2">Adaugă în {activePeriod}</h3>
                <input
                  autoFocus
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Ce eveniment adăugăm?"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none mb-4"
                />
                
                {activePeriod === 'viitor' && (
                  <div className="flex gap-2 mb-4">
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-24 bg-gray-50 border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

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
              </form>
            </motion.div>
            {/* Backdrop for the popup */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10 pointer-events-auto"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComePage;
