import type { ILifecycle } from './lifecycle';
export interface IPiService extends ILifecycle { registerTool(name: string, latencyMs?: number): Promise<void>; dispatch(tool: string, args?: Record<string,unknown>): Promise<string>; }
export interface IZedService extends ILifecycle { openBuffer(path: string, content?: string): Promise<string>; editInline(bufferId: string, instruction: string): Promise<string>; }
export interface IWarpService extends ILifecycle { block(input: string): Promise<string>; workflow(name: string, steps: string[]): Promise<string>; aiCommand(prompt: string): Promise<string>; }
export interface IGptEngineerService extends ILifecycle { run(spec: string): Promise<{ files: string[]; log: string }>; }
export interface IGooseService extends ILifecycle { recipe(name: string, steps: string[]): Promise<string>; runRecipe(name: string): Promise<string>; }
export interface IContinueService extends ILifecycle { autocomplete(prefix: string): Promise<string>; chat(message: string): Promise<string>; }
export interface ITabbyService extends ILifecycle { complete(prefix: string): Promise<string>; registerModel(name: string): Promise<void>; }
export interface IGptPilotService extends ILifecycle { launch(spec: string): Promise<string>; status(projectId: string): Promise<string>; }
export interface IVoidService extends ILifecycle { session(file: string): Promise<string>; assist(sessionId: string, prompt: string): Promise<string>; }
export interface ICrushService extends ILifecycle { pretty(text: string): Promise<string>; }
export interface ICodeWhaleService extends ILifecycle { cargoCheck(): Promise<string>; applyPatch(patch: string): Promise<string>; }
