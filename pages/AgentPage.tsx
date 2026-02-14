
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AgentPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
      } else {
        alert("Te rugăm să încarci un fișier .zip");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
      } else {
        alert("Te rugăm să selectezi un fișier .zip");
      }
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleProcess = () => {
    setIsProcessing(true);
    // Simulare procesare
    setTimeout(() => {
      setIsProcessing(false);
      setFile(null);
      alert("Procesare completă!");
    }, 2500);
  };

  return (
    <div className="h-full px-6 py-8 flex flex-col bg-gray-50/10">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Sincronizare ZIP</h2>
        <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
          Încarcă arhiva proiectului tău pentru a extrage automat notele și a reconstrui rețeaua neuronală.
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <form 
          onDragEnter={handleDrag} 
          onSubmit={(e) => e.preventDefault()}
          className="relative flex-1"
        >
          <input 
            ref={inputRef}
            type="file" 
            accept=".zip"
            className="hidden" 
            onChange={handleChange}
          />
          
          <motion.div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            animate={{
              borderColor: dragActive ? "#3b82f6" : "#e2e8f0",
              backgroundColor: dragActive ? "#eff6ff" : "#ffffff",
              scale: dragActive ? 1.02 : 1
            }}
            className={`w-full h-full border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors shadow-sm card-shadow bg-white`}
          >
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Trage arhiva aici</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sau apasă pentru a selecta</p>
                  <div className="mt-8 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Doar format .ZIP acceptat</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1 truncate max-w-full px-4">{file.name}</h3>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-8">Pregătit pentru procesare</p>
                  
                  <div className="w-full bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 mb-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <span>Mărime</span>
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Elimină fișierul
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </form>

        <div className="mt-8">
          <button
            disabled={!file || isProcessing}
            onClick={handleProcess}
            className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
              file && !isProcessing 
                ? 'bg-blue-600 text-white shadow-blue-100 active:scale-95' 
                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesare în curs...
              </>
            ) : (
              'Începe Analiza Agent'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
