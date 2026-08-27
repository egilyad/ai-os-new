import type { CognitiveSkill } from '../../types/domain-types';

export type Skill = CognitiveSkill;

export interface SkillsStore {
  loadAll(): Promise<Skill[]>;
  saveAll(skills: Skill[]): Promise<void>;
  toArray(): Promise<Skill[]>;
  bulkAdd(skills: Skill[]): Promise<void>;
  bulkPut(skills: Skill[]): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
}
