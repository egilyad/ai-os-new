import type { ILifecycle } from './lifecycle';
export interface ICodexService extends ILifecycle { prompt(prompt: string): Promise<{ diff: string; applied: boolean }>; }
export interface IGeminiCliService extends ILifecycle { chat(message: string): Promise<string>; }
export interface IKiloService extends ILifecycle { fanout(prompt: string, models?: string[]): Promise<string[]>; catalog(): Promise<string[]>; }
export interface IInterpreterService extends ILifecycle { exec(code: string, lang?: string): Promise<string>; }
export interface IMiniSweService extends ILifecycle { solve(issue: string): Promise<{ patch: string; passed: boolean }>; }
export interface IHeliconeService extends ILifecycle { log(request: string): Promise<void>; hits(): Promise<number>; }
export interface IPortkeyService extends ILifecycle { route(model: string): Promise<string>; }
export interface ILiteLlmService extends ILifecycle { proxy(model: string, prompt: string): Promise<string>; }
export interface ILangfuseService extends ILifecycle { trace(name: string, data: string): Promise<void>; eval(dataset: string): Promise<number>; }
