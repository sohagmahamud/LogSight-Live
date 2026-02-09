
import React from 'react';
import { Hypothesis } from '../types';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({ hypothesis }) => {
  const confidenceColor = hypothesis.confidence > 0.7 
    ? 'bg-emerald-500' 
    : hypothesis.confidence > 0.4 
      ? 'bg-amber-500' 
      : 'bg-rose-500';

  return (
    <div className="glass rounded-xl p-6 border-l-4 border-indigo-500 shadow-xl flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-xl font-bold text-slate-100 leading-tight">
          {hypothesis.hypothesis}
        </h3>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confidence</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${confidenceColor} transition-all duration-1000`} 
              style={{ width: `${hypothesis.confidence * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold mt-1 text-slate-300">{(hypothesis.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-indigo-400 mb-2 uppercase tracking-wide">Supporting Evidence</h4>
        <div className="flex flex-wrap gap-2">
          {hypothesis.supporting_evidence.map((ev, idx) => (
            <span key={idx} className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mono">
              {ev}
            </span>
          ))}
        </div>
      </div>

      {hypothesis.unknowns.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <h4 className="text-sm font-semibold text-amber-400/80 mb-2 uppercase tracking-wide">Key Unknowns</h4>
          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
            {hypothesis.unknowns.map((un, idx) => (
              <li key={idx}>{un}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
