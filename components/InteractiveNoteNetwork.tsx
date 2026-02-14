
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note, NoteConnection } from '../types';

interface NoteWithProject extends Note {
  projectId: string;
  projectColor: string;
}

interface InteractiveNoteNetworkProps {
  notes: NoteWithProject[];
  connections: NoteConnection[];
  path: string[];
  checkpointMode: boolean;
  onAddConnection: (fromId: string, toId: string) => void;
  onUpdatePath: (newPath: string[]) => void;
  onOpenPathList: () => void; // Prop nou pentru deschiderea listei la nivel înalt
}

const InteractiveNoteNetwork: React.FC<InteractiveNoteNetworkProps> = ({ 
  notes, 
  connections, 
  path,
  checkpointMode,
  onAddConnection,
  onUpdatePath,
  onOpenPathList
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<string[][]>([]);

  useEffect(() => {
    if (!checkpointMode) {
      setPathHistory([]);
    }
  }, [checkpointMode]);

  const nodePositions = useMemo(() => {
    const positions: { [id: string]: { x: number; y: number } } = {};
    const width = 300;
    const height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const projects = Array.from(new Set(notes.map(n => n.projectId)));
    const projectCount = projects.length;

    if (projectCount === 1) {
      const radius = 70;
      notes.forEach((note, index) => {
        const angle = (index / notes.length) * Math.PI * 2;
        positions[note.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    } else {
      const clusterRadius = 60;
      projects.forEach((projId, pIndex) => {
        const clusterAngle = (pIndex / projectCount) * Math.PI * 2;
        const cX = centerX + clusterRadius * Math.cos(clusterAngle);
        const cY = centerY + clusterRadius * Math.sin(clusterAngle);
        
        const projectNotes = notes.filter(n => n.projectId === projId);
        const noteRadius = 25;
        projectNotes.forEach((note, nIndex) => {
          const nAngle = (nIndex / projectNotes.length) * Math.PI * 2;
          positions[note.id] = {
            x: cX + noteRadius * Math.cos(nAngle),
            y: cY + noteRadius * Math.sin(nAngle)
          };
        });
      });
    }
    return positions;
  }, [notes]);

  const visiblePathSegments = useMemo(() => {
    const segments: { from: string; to: string }[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      if (nodePositions[path[i]] && nodePositions[path[i+1]]) {
        segments.push({ from: path[i], to: path[i+1] });
      }
    }
    return segments;
  }, [path, nodePositions]);

  const handleNodeClick = (id: string) => {
    if (checkpointMode) {
      setPathHistory(prev => [...prev, [...path]]);
      if (path.includes(id)) {
        onUpdatePath(path.filter(nodeId => nodeId !== id));
      } else {
        onUpdatePath([...path, id]);
      }
      return;
    }

    if (selectedId === null) {
      setSelectedId(id);
    } else if (selectedId === id) {
      setSelectedId(null);
    } else {
      const exists = connections.some(c => 
        (c.fromId === selectedId && c.toId === id) || 
        (c.fromId === id && c.toId === selectedId)
      );
      if (!exists) {
        onAddConnection(selectedId, id);
      }
      setSelectedId(null);
    }
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      onUpdatePath(previousPath);
      setPathHistory(prev => prev.slice(0, -1));
    }
  };

  const renderPathSegment = (fromId: string, toId: string, index: number) => {
    const from = nodePositions[fromId];
    const to = nodePositions[toId];
    if (!from || !to) return null;

    return (
      <g key={`p-seg-${fromId}-${toId}-${index}`}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="14" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
        <motion.line 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          x1={from.x} y1={from.y}
          x2={to.x} y2={to.y}
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };

  return (
    <div className={`relative w-full h-[220px] bg-white/40 backdrop-blur-sm rounded-3xl border transition-colors overflow-hidden ${checkpointMode ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-100'}`}>
      
      {/* Buton LISTĂ (Top-Left) */}
      <AnimatePresence>
        {checkpointMode && path.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -20 }}
            whileTap={{ scale: 0.8 }}
            onClick={onOpenPathList}
            className="absolute top-3 left-3 z-[110] w-8 h-8 bg-white border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-50 active:bg-blue-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Buton UNDO (Top-Right) */}
      <AnimatePresence>
        {checkpointMode && pathHistory.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 20 }}
            whileTap={{ scale: 0.8 }}
            onClick={handleUndo}
            className="absolute top-3 right-3 z-[110] w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 active:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {!checkpointMode && connections.map(conn => {
          const from = nodePositions[conn.fromId];
          const to = nodePositions[conn.toId];
          if (!from || !to) return null;
          const fromNote = notes.find(n => n.id === conn.fromId);
          const toNote = notes.find(n => n.id === conn.toId);
          const isCrossProject = fromNote?.projectId !== toNote?.projectId;
          return (
            <line 
              key={conn.id}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={isCrossProject ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.2)"}
              strokeWidth={isCrossProject ? "2" : "1.5"}
              strokeDasharray={isCrossProject ? "" : "4 2"}
            />
          );
        })}
        {visiblePathSegments.map((seg, i) => renderPathSegment(seg.from, seg.to, i))}
      </svg>

      {notes.map(note => {
        const pos = nodePositions[note.id];
        const isSelected = selectedId === note.id;
        const isCompleted = note.completed;
        const pathIndex = path.indexOf(note.id);
        const isInPath = pathIndex !== -1;

        return (
          <motion.div
            key={note.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNodeClick(note.id)}
            style={{ left: pos.x - 12, top: pos.y - 12 }}
            className={`absolute w-6 h-6 rounded-full cursor-pointer flex items-center justify-center border-2 transition-all shadow-sm
              ${isSelected || (checkpointMode && isInPath) ? 'ring-4 ring-blue-100 border-blue-600 z-30' : 'border-white z-20'}
              ${isCompleted ? 'bg-emerald-400' : note.projectColor}
            `}
          >
            {isInPath && (
              <div className="absolute -top-3 -right-3 w-4 h-4 bg-blue-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-md z-40">
                {pathIndex + 1}
              </div>
            )}
            
            <div className="relative">
              <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full shadow-sm ${
                  isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-gray-600 border border-gray-100'
                }`}>
                  {note.text.length > 8 ? note.text.substring(0, 8) + '...' : note.text}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-3 left-0 w-full text-center px-4 pointer-events-none">
        <p className={`text-[7px] font-black uppercase tracking-widest ${checkpointMode ? 'text-blue-600' : 'text-gray-400'}`}>
          {checkpointMode 
            ? "Mod Editare Path: Click pentru a adăuga/elimina" 
            : (selectedId ? "Alege al doilea neuron" : "Interacționează cu rețeaua")
          }
        </p>
      </div>
    </div>
  );
};

export default InteractiveNoteNetwork;
