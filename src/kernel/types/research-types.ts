export interface ResearchHypothesis {
  id: string;
  title: string;
  description: string;
  category: 'arch' | 'prompt' | 'routing' | 'gov';
  status: 'proposed' | 'active' | 'debating' | 'accepted' | 'rejected';
  createdAt: number;
  sourceFile?: string;
  evidenceRefs: string[];
  linkedDebateId?: string;
  metricsDelta?: string;
}

export type HypothesisCategory = ResearchHypothesis['category'];
export type HypothesisStatus = ResearchHypothesis['status'];

export const HYPOTHESIS_CATEGORIES: HypothesisCategory[] = ['arch', 'prompt', 'routing', 'gov'];
export const HYPOTHESIS_STATUSES: HypothesisStatus[] = ['proposed', 'active', 'debating', 'accepted', 'rejected'];
