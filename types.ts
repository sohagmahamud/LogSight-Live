
export interface Hypothesis {
  hypothesis: string;
  confidence: number;
  supporting_evidence: string[];
  unknowns: string[];
}

export interface AnalysisResponse {
  summary: string;
  root_cause_hypotheses: Hypothesis[];
  next_actions: string[];
}

export type AnalysisMode = 'QUICK' | 'DEEP';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface FileData {
  name: string;
  type: string;
  content: string; // Base64 for images, text for logs
}
