
export interface InvestigationStep {
  timestamp: string;
  level: 'TRIAGE' | 'CORRELATION' | 'DEEP_DIVE';
  thought_signature: string; // The "Thinking" process
  finding: string;
  status: 'PROBING' | 'CONFIRMED' | 'REFUTED';
  evidence_links: string[];
}

export interface Hypothesis {
  hypothesis: string;
  confidence: number;
  supporting_evidence: string[];
  unknowns: string[];
  corrected_from?: string; // For self-correction tracking
}

export interface AnalysisResponse {
  summary: string;
  investigation_ledger: InvestigationStep[];
  root_cause_hypotheses: Hypothesis[];
  next_actions: string[];
  active_leads: string[];
}

export type AnalysisMode = 'QUICK' | 'MARATHON';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface FileData {
  name: string;
  type: string;
  content: string; 
}
