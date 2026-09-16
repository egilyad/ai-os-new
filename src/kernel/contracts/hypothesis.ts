import type { ResearchHypothesis, HypothesisCategory, HypothesisStatus } from '../types/research-types';

export interface ProposeHypothesisInput {
  title?: string;
  description: string;
  category: HypothesisCategory;
  sourceFile?: string;
  evidenceRefs?: string[];
}

export interface IHypothesisService {
  init(): Promise<void>;
  destroy(): void;
  getAll(): ResearchHypothesis[];
  propose(input: ProposeHypothesisInput): Promise<ResearchHypothesis>;
  update(id: string, patch: Partial<ResearchHypothesis>): Promise<ResearchHypothesis | null>;
  remove(id: string): Promise<void>;
  linkDebate(id: string, debateId: string): Promise<void>;
  setStatus(id: string, status: HypothesisStatus): Promise<void>;
}
