import type { ILifecycle } from './lifecycle';
export interface ISciAgentsService extends ILifecycle { addOntology(term: string, rel: string, to: string): Promise<void>; hypothesize(topic: string): Promise<string>; }
export interface ISparksService extends ILifecycle { cycle(hypothesis: string): Promise<{ experiment: string; principle: string }>; }
export interface IAiScientistService extends ILifecycle { queueIdea(idea: string): Promise<string>; runNext(): Promise<{ paper: string; score: number }>; }
export interface ILatentService extends ILifecycle { post(agent: string, text: string): Promise<void>; synthesize(): Promise<string>; }
export interface IEightStageService extends ILifecycle { run(topic: string): Promise<string[]>; }
export interface ICognitaeService extends ILifecycle { run(task: string): Promise<string>; roles(): Promise<string[]>; }
export interface ICogTeamService extends ILifecycle { run(task: string): Promise<string>; }
export interface ISynService extends ILifecycle { remember(kind: string, text: string): Promise<void>; sleep(): Promise<number>; loop(): Promise<string>; }
export interface IHelixService extends ILifecycle { addOnto(term: string, rel: string): Promise<void>; gaps(): Promise<string[]>; }
export interface IIdeatorService extends ILifecycle { testDialogues(topic: string): Promise<{ best: string; scores: Record<string,number> }>; }
