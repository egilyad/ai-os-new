import type { PluginManifest } from '../../contracts/plugin';

export interface PluginTool {
    name: string;
    handler?: string;
    manifestId: string;
    execute?: (name: string, args: Record<string, unknown>) => Promise<string>;
}

/**
 * PluginHost — лёгкий хост плагинов (SPEC_06).
 *
 * Регистрирует инструменты из манифестов плагинов и позволяет вызывать их.
 * (Полная изоляция через Worker/sandboxed iframe — следующий слой.)
 */
export class PluginHost {
    private tools = new Map<string, PluginTool>();

    registerTools(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
    ): void {
        for (const t of manifest.contributes.tools ?? []) {
            this.tools.set(t.name, {
                name: t.name,
                handler: t.handler,
                manifestId: manifest.id,
                execute: executor,
            });
        }
    }

    unregisterTools(manifestId: string): void {
        for (const [name, t] of this.tools) {
            if (t.manifestId === manifestId) this.tools.delete(name);
        }
    }

    listTools(): PluginTool[] {
        return [...this.tools.values()];
    }

    hasTool(name: string): boolean {
        return this.tools.has(name);
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) throw new Error(`Plugin tool not found: ${name}`);
        if (!tool.execute) return `Tool ${name} has no executor`;
        return tool.execute(name, args);
    }
}
