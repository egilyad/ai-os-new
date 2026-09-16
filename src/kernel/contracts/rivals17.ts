import type { ILifecycle } from './lifecycle';
export interface IRckService extends ILifecycle { bind(a: string, b: string): Promise<string>; bundle(vectors: string[]): Promise<string>; infer(chain: string[]): Promise<{ fact: string; provenance: string[] }>; }
export interface ICogneeService extends ILifecycle { ingest(text: string): Promise<string>; recall(query: string): Promise<string[]>; }
export interface IMetanService extends ILifecycle { buildHierarchy(root: string, depth?: number): Promise<{ agents: number; depth: number }>; }
export interface IConceptsService extends ILifecycle { define(name: string, vector?: number[]): Promise<void>; compose(a: string, b: string): Promise<string>; }
export interface ISecondBrainService extends ILifecycle { run(task: string): Promise<{ result: string; verifiedBy: string }>; }
export interface IStormService extends ILifecycle { research(topic: string): Promise<string>; }
export interface IBlackboardService extends ILifecycle { post(expert: string, data: string): Promise<void>; tick(): Promise<string>; }
export interface IMetaControllerService extends ILifecycle { pick(task: string): Promise<string>; }
export interface IDoloresService extends ILifecycle { scaffold(steps: Array<{ do: string; pre?: string; post?: string }>): Promise<string>; trace(): Promise<string[]>; }
export interface IEpistemeService extends ILifecycle { sync(agentState: string, humanState: string): Promise<{ synced: boolean; showWork: string }>; }
