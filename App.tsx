import React, { useState, useRef } from 'react';
import { Button } from './components/Button';
import { HypothesisCard } from './components/HypothesisCard';
import { GeminiService } from './services/geminiService';
import { AnalysisResponse, AnalysisMode, FileData, ChatMessage } from './types';

const App: React.FC = () => {
  const [logs, setLogs] = useState<string>('');
  const [images, setImages] = useState<FileData[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('QUICK');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
          const result = ev.target?.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1];
            const newImage: FileData = { 
              name: file.name, 
              type: file.type, 
              content: base64 
            };
            setImages(prev => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (!logs.trim() && images.length === 0) {
      setErrorMessage("Provide logs or metric screenshots to initiate the agent.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    setErrorMessage(null);
    try {
      const result = await GeminiService.analyzeIncident(mode, logs, images);
      setAnalysis(result);
      setChatHistory([{ role: 'model', text: result.summary }]);
    } catch (err: any) {
      setErrorMessage(err.message || "Autonomous engine failure.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatting(true);
    try {
      const response = await GeminiService.chat(chatHistory, msg);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-emerald-500/30">
      <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LogSight <span className="text-emerald-400">Marathon</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Autonomous Agentic SRE</p>
          </div>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setMode('QUICK')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'QUICK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚡ Triage
          </button>
          <button 
            onClick={() => setMode('MARATHON')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'MARATHON' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🏃 Marathon
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Evidence Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6 border border-white/10 shadow-2xl">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Incident Evidence
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Raw Log Stream</label>
                <textarea 
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Paste stack traces or log blocks..."
                  className="w-full h-40 bg-black/60 border border-white/5 rounded-xl p-4 text-xs mono focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all custom-scrollbar placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visual Dashboard Frames</label>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img 
                        src={`data:${img.type};base64,${img.content}`} 
                        alt="Context" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                      />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-video rounded-lg border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-1 text-slate-600 hover:border-emerald-500/40 hover:text-emerald-500/60 transition-all bg-white/2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[10px] font-bold uppercase">Attach Frame</span>
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={startAnalysis} 
              isLoading={isAnalyzing}
              className={`w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all shadow-xl ${
                mode === 'MARATHON' 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
              }`}
            >
              {mode === 'MARATHON' ? 'Initiate Marathon Diagnostic' : 'Execute Rapid Triage'}
            </Button>
            
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-3 animate-fade-in">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errorMessage}
              </div>
            )}
          </div>

          {analysis?.active_leads && analysis.active_leads.length > 0 && (
            <div className="glass rounded-2xl p-6 animate-fade-in border border-emerald-500/10">
              <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Investigation Backlog
              </h3>
              <div className="space-y-3">
                {analysis.active_leads.map((lead, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-300">
                    <span className="text-emerald-500 shrink-0 mt-0.5">↳</span>
                    {lead}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Output Panel */}
        <div className="lg:col-span-8 space-y-8">
          {!analysis && !isAnalyzing && (
            <div className="h-[600px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl p-12 text-center bg-white/[0.01]">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-300">Engine Standby</h3>
              <p className="max-w-xs mt-3 text-sm leading-relaxed text-slate-500">Provide logs or dashboard screenshots to awaken the autonomous diagnostic core.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-6">
              <div className="h-[400px] glass rounded-3xl flex flex-col items-center justify-center gap-8 p-12 border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-3 z-10">
                  <p className="text-emerald-400 font-bold tracking-[0.2em] text-sm uppercase">Recursive Thinking Signature...</p>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">Gemini 3 Pro is synthesizing multimodal evidence and conducting deep-dive architectural probing.</p>
                </div>
                <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-10 animate-fade-in">
              {/* Summary Header */}
              <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Investigation Summary</h3>
                <p className="text-lg text-slate-100 font-medium leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Ledger */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Investigation Timeline
                </h3>
                <div className="space-y-6">
                  {analysis.investigation_ledger.map((step, i) => (
                    <div key={i} className="relative pl-10 border-l border-white/5 ml-4 pb-8 last:pb-0">
                      <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full border-4 border-[#030712] shadow-xl ${
                        step.status === 'CONFIRMED' ? 'bg-emerald-500' : step.status === 'REFUTED' ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}></div>
                      <div className="glass rounded-2xl p-6 space-y-5 hover:border-white/10 transition-all shadow-xl group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 mono bg-white/5 px-2 py-0.5 rounded">{step.timestamp}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              step.level === 'DEEP_DIVE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {step.level}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            step.status === 'CONFIRMED' ? 'text-emerald-400' : step.status === 'REFUTED' ? 'text-rose-400' : 'text-indigo-400'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="p-4 bg-emerald-500/[0.02] rounded-xl border border-emerald-500/10 border-l-2 border-l-emerald-500">
                           <p className="text-[10px] font-bold text-emerald-400/70 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             Thought Signature
                           </p>
                           <p className="text-xs italic text-slate-400 leading-relaxed font-medium">{step.thought_signature}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-200 leading-relaxed group-hover:text-white transition-colors">{step.finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hypotheses Grid */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Root Cause Hypotheses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.root_cause_hypotheses.map((hyp, i) => (
                    <HypothesisCard key={i} hypothesis={hyp} />
                  ))}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="glass rounded-3xl overflow-hidden flex flex-col h-[600px] border border-white/5 shadow-2xl">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <h3 className="text-sm font-bold text-slate-300">Expert SRE Advisor Chat</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Context-Aware Session</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                          : 'bg-slate-800/60 text-slate-200 border border-white/5 shadow-xl'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/60 p-5 rounded-2xl flex gap-2 items-center border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                      </div>
                    </div>
                  )}
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                  className="p-6 bg-black/40 border-t border-white/5 flex gap-3"
                >
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Inquire about specific leads or remediation next-steps..."
                    className="flex-1 bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatting}
                    className="w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 py-16 border-t border-white/5 text-center text-slate-600">
        <div className="max-w-2xl mx-auto px-6 space-y-8">
          <p className="text-xs uppercase tracking-[0.4em] font-bold text-slate-500">Marathon Autonomous Engine V3.1</p>
          <div className="flex items-center justify-center gap-10">
             <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Thinking Budget</span>
               <div className="w-12 h-1 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
             </div>
             <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Multimodal Context</span>
               <div className="w-12 h-1 rounded-full bg-indigo-500/20 border border-indigo-500/30"></div>
             </div>
             <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Self-Correction</span>
               <div className="w-12 h-1 rounded-full bg-purple-500/20 border border-purple-500/30"></div>
             </div>
          </div>
          <p className="text-[11px] italic text-slate-700">Powered by Gemini 3 Pro with Recursive Thought Signatures</p>
        </div>
      </footer>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default App;