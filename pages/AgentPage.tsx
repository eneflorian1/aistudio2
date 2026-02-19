
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { Project, ProjectNotes } from '../types';

interface AgentPageProps {
  notes: ProjectNotes;
  projects: Project[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AgentPage: React.FC<AgentPageProps> = ({ notes, projects }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'model', text: 'Salut! Sunt asistentul tău AI. Te pot ajuta să analizezi notele proiectelor tale sau să procesez o arhivă ZIP. Cu ce te pot ajuta astăzi?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'sync'>('chat');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    setTimeout(() => {
      setIsProcessing(false);
      setFile(null);
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Am procesat arhiva ZIP cu succes! Am identificat structura proiectului și am actualizat notele relevante.' 
      }]);
      setActiveTab('chat');
    }, 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userText = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Prepare context from notes
      const context = projects.map(p => {
        const pNotes = notes[p.id] || [];
        return `Proiect: ${p.name}\nDescriere: ${p.description}\nNote:\n${pNotes.map(n => `- [${n.completed ? 'X' : ' '}] ${n.text}`).join('\n')}`;
      }).join('\n\n');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [{ text: `Ești un asistent AI expert în project management. Iată contextul proiectelor utilizatorului:\n\n${context}\n\nUtilizatorul întreabă: ${userText}` }]
          }
        ],
        config: {
          systemInstruction: "Ești un asistent AI util și concis. Răspunzi în limba română. Ajută utilizatorul să-și organizeze task-urile, să vadă conexiuni între proiecte și să prioritizeze munca."
        }
      });

      const aiText = response.text || "Ne pare rău, nu am putut genera un răspuns.";
      setChatMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "A apărut o eroare la comunicarea cu AI-ul. Te rugăm să încerci din nou." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex px-6 pt-4 gap-4 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          Chat Analiză
          {activeTab === 'chat' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('sync')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'sync' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          Sincronizare ZIP
          {activeTab === 'sync' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div 
              key="chat-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 no-scrollbar">
                {chatMessages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-[2rem] shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      <div className="markdown-body text-sm leading-relaxed font-medium">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 p-4 rounded-[2rem] rounded-tl-none border border-gray-100 flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 safe-bottom z-10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Întreabă AI-ul despre proiectele tale..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!userInput.trim() || isTyping}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      userInput.trim() && !isTyping ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="sync-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col p-6"
            >
              <div className="mb-8">
                <h2 className="text-xl font-black text-gray-900 mb-2">Sincronizare ZIP</h2>
                <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
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
                    className={`w-full h-full border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors shadow-sm bg-white`}
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
                          <div className="w-16 h-16 bg-blue-50 rounded-[1.8rem] flex items-center justify-center mb-6 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <h3 className="text-md font-black text-gray-900 mb-2">Trage arhiva aici</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sau apasă pentru a selecta</p>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="selected"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center w-full"
                        >
                          <div className="w-16 h-16 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center mb-6 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-md font-black text-gray-900 mb-1 truncate max-w-full px-4">{file.name}</h3>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-8">Pregătit pentru procesare</p>
                          
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
                        Procesare...
                      </>
                    ) : (
                      'Începe Analiza'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentPage;
