
import React, { useState, useCallback, useRef } from 'react';
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
  const [analysisModeUsed, setAnalysisModeUsed] = useState<AnalysisMode | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleLogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogs(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setImages(prev => [...prev, { name: file.name, type: file.type, content: base64 }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!logs && images.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisModeUsed(mode);
    try {
      const result = await GeminiService.analyzeIncident(mode, logs, images);
      setAnalysis(result);
      setChatHistory([{ role: 'model', text: result.summary }]);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LogSight <span className="gradient-text">Live</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Incident Analysis Engine</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setMode('QUICK')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'QUICK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ⚡ Quick
            </button>
            <button 
              onClick={() => setMode('DEEP')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'DEEP' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🧠 Deep Dive
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium italic">
            {mode === 'QUICK' ? 'Low-latency triage' : 'Multi-step reasoning enabled'}
          </p>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Incident Context
            </h2>
            
            <div className="space-y-4">
              <div className="group relative">
                <label className="block text-sm font-semibold text-slate-400 mb-2">Logs (Raw Text)</label>
                <textarea 
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Paste relevant application or system logs here..."
                  className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm mono focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all custom-scrollbar placeholder:text-slate-700"
                />
                <div className="absolute top-8 right-2 flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleLogUpload} className="hidden" accept=".log,.txt" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Dashboard Screenshots</label>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                      <img src={`data:${img.type};base64,${img.content}`} alt="screenshot" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <button 
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-rose-500/20 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all bg-white/2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs font-medium">Add Screenshot</span>
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </button>
                </div>
              </div>

              <Button 
                onClick={startAnalysis} 
                isLoading={isAnalyzing}
                disabled={!logs && images.length === 0}
                className="w-full py-4 text-lg"
              >
                {mode === 'QUICK' ? '⚡ Run Quick Scan' : '🧠 Perform Deep Analysis'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Chat */}
        <div className="lg:col-span-7 space-y-6">
          {!analysis && !isAnalyzing && (
            <div className="h-[600px] glass rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-200">Waiting for Evidence</h3>
                <p className="text-slate-500 max-w-sm mt-1">Upload logs or dashboard screenshots to start the AI-powered incident root cause analysis.</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-[600px] glass rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="animate-pulse space-y-2">
                <h3 className="text-xl font-bold text-indigo-400">
                  {analysisModeUsed === 'DEEP' ? 'Deep Reasoner Active...' : 'Scanning Evidence...'}
                </h3>
                <p className="text-slate-500">
                  {analysisModeUsed === 'DEEP' 
                    ? 'Cross-referencing metrics with log anomalies using advanced thinking...' 
                    : 'Correlating log patterns with visual dashboard anomalies...'}
                </p>
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass rounded-2xl p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                   <span className={`text-[10px] font-bold px-2 py-1 rounded-bl-xl uppercase tracking-widest ${analysisModeUsed === 'DEEP' ? 'bg-purple-500/20 text-purple-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {analysisModeUsed === 'DEEP' ? '🧠 Deep Dive Result' : '⚡ Quick Triage'}
                   </span>
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Executive Summary</h2>
                <p className="text-lg leading-relaxed text-slate-200">{analysis.summary}</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Root Cause Hypotheses</h2>
                {analysis.root_cause_hypotheses.map((hyp, idx) => (
                  <HypothesisCard key={idx} hypothesis={hyp} />
                ))}
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">Recommended Next Steps</h2>
                <ul className="space-y-3">
                  {analysis.next_actions.map((action, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-300">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Expert Follow-up
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold uppercase">Online</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-white/5'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 p-3 rounded-2xl flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about specific logs or remediation steps..."
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isChatting}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        <p>&copy; 2024 LogSight Live. Built for the Gemini 3 Hackathon.</p>
        <p className="mt-2 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Connected to {analysisModeUsed === 'DEEP' ? 'Gemini 3 Pro Reasoning Engine' : 'Gemini 3 Flash Preview'}
        </p>
      </footer>
    </div>
  );
};

export default App;
