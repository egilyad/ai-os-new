import type { ILifecycle } from './lifecycle';
export interface IMetaKbService extends ILifecycle { put(entry: string, text: string): Promise<void>; query(q: string): Promise<string[]>; }
export interface IResearchOsService extends ILifecycle { createFolder(name: string): Promise<string>; addFile(folderId: string, name: string, content: string): Promise<void>; list(folderId: string): Promise<string[]>; }
export interface IDeepResearch2Service extends ILifecycle { run(topic: string): Promise<{ report: string; contradictions: string[] }>; }
export interface IDarwinService extends ILifecycle { evolve(seed: string, gens?: number): Promise<{ best: string; score: number }>; }
export interface IQyvariaService extends ILifecycle { addNode(name: string, neighbors?: string[]): Promise<void>; causal(from: string, to: string): Promise<void>; query(start: string): Promise<string[]>; }
export interface IParliamentaryService extends ILifecycle { run(topic: string): Promise<{ ranking: string[]; pois: number }>; }
export interface IPolicyDebateService extends ILifecycle { run(topic: string, plan: string): Promise<{ advantages: string[]; disadvantages: string[] }>; }
export interface ISocraticService extends ILifecycle { ask(question: string): Promise<void>; discuss(topic: string): Promise<string>; }
export interface IFishbowlService extends ILifecycle { setBowl(members: string[]): Promise<void>; rotate(newMember: string): Promise<string[]>; }
export interface IDelphiService extends ILifecycle { round(estimates: Record<string,number>): Promise<{ median: number; iqr: number; consensus: boolean }>; }
