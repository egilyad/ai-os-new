import type { CognitiveTrace } from '../../types/domain-types';
export type { CognitiveTrace } from '../../types/domain-types';

export interface TraceStore {
  saveTrace(trace: CognitiveTrace): Promise<void>;
  getTrace(id: string): Promise<CognitiveTrace | null>;
  queryTraces(options: {
    type?: string;
    status?: string;
    before?: number;
    after?: number;
    limit?: number;
    order?: 'asc' | 'desc';
    provider?: string;
  }): Promise<CognitiveTrace[]>;
  deleteTrace(id: string): Promise<void>;
  count(): Promise<number>;
  bulkPut(traces: CognitiveTrace[]): Promise<void>;
  clear(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
}
