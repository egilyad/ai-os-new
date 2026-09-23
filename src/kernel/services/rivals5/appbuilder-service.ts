/**
 * AppBuilderService — J.1 (app-builder loop, additive).
 *
 * clarify (LLM questions, max 5) → scaffold (LLM JSON file tree, validated
 * paths, size caps) → writeScaffold (workspace write path) → preview
 * manifest (routes + files, consumable by Builder/CXF).
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { IAppBuilderService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('AppBuilder');

function sanitizePath(p: string): string | null {
    const clean = p.replace(/\\/g, '/').trim();
    if (!clean || clean.startsWith('/') || clean.includes('..')) return null;
    if (!/^[a-zA-Z0-9_./-]+$/.test(clean)) return null;
    return clean;
}

export class AppBuilderService implements IAppBuilderService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
        private workspace?: IWorkspaceService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('AppBuilder', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async clarify(spec: string): Promise<string[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: 'Ask up to 5 sharp clarifying questions about this app spec, one per line starting with "- ". Skip what is obvious.',
                        },
                        { role: 'user', content: spec.slice(0, 3000) },
                    ],
                    { temperature: 0.4, maxTokens: 500 },
                );
                if (!res.error) {
                    const qs = res.content
                        .split('\n')
                        .map((l) => l.replace(/^-\s*/, '').trim())
                        .filter((l) => l.length > 0)
                        .slice(0, 5);
                    if (qs.length > 0) return qs;
                }
            } catch (e) {
                LOGGER.warn('AppBuilder', 'clarify failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return ['Who are the users?', 'What are the 3 core screens?', 'Any integrations or auth?'];
    }

    async scaffold(spec: string, answers: Record<string, string> = {}): Promise<{
        files: Array<{ path: string; content: string }>;
        preview: string;
    }> {
        const answered = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n');
        const full = answered ? `${spec}\nClarifications:\n${answered}` : spec;
        let files: Array<{ path: string; content: string }> = [];
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                'Generate a minimal app scaffold. Reply as JSON ONLY: {"files":[{"path":"...","content":"..."}]}. ' +
                                'Max 12 files, safe relative paths, each file ≤ 150 lines. No preamble.',
                        },
                        { role: 'user', content: full.slice(0, 4000) },
                    ],
                    { temperature: 0.3, maxTokens: 4000 },
                );
                if (!res.error) {
                    const start = res.content.indexOf('{');
                    if (start >= 0) {
                        const parsed = JSON.parse(res.content.slice(start, res.content.lastIndexOf('}') + 1)) as {
                            files?: Array<{ path?: string; content?: string }>;
                        };
                        files = (parsed.files ?? [])
                            .map((f) => {
                                const path = f.path ? sanitizePath(f.path) : null;
                                if (!path) return null;
                                return { path, content: String(f.content ?? '').slice(0, 12000) };
                            })
                            .filter((f): f is { path: string; content: string } => Boolean(f))
                            .slice(0, 12);
                    }
                }
            } catch (e) {
                LOGGER.warn('AppBuilder', 'scaffold failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        if (files.length === 0) {
            files = [{ path: 'README.md', content: `# App\n\n${spec.slice(0, 1000)}\n` }];
        }
        const preview = [
            `# Preview: ${spec.slice(0, 80)}`,
            ...files.map((f) => `- ${f.path} (${f.content.length} chars)`),
        ].join('\n');
        this.events.emit(EVENTS.APP_SCAFFOLD, { files: files.length });
        return { files, preview };
    }

    async writeScaffold(files: Array<{ path: string; content: string }>): Promise<string[]> {
        const ws = this.workspace as unknown as {
            writeFile?: (p: string, c: string) => Promise<void>;
        } | undefined;
        if (!ws?.writeFile) throw new Error('Workspace is read-only — scaffold kept in memory');
        const written: string[] = [];
        for (const f of files.slice(0, 12)) {
            const path = sanitizePath(f.path);
            if (!path) continue;
            await ws.writeFile(path, f.content.slice(0, 12000));
            written.push(path);
        }
        return written;
    }
}
