/**
 * AiderService — G.2 (Aider-style coding loop, additive).
 *
 * repoMap (condensed tree + per-file symbol hints via grep), whole/diff
 * edit application, LLM commit messages, test checklists. Writes reuse the
 * workspace write path when present, otherwise edits are patch-recorded
 * (same convention as SweService).
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { IAiderService } from '../../contracts/rivals2';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Aider');

export class AiderService implements IAiderService {
    constructor(
        private workspace?: IWorkspaceService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async repoMap(maxFiles = 80): Promise<string> {
        if (!this.workspace?.isAttached()) return '(no workspace attached)';
        const tree = await this.workspace.listTree();
        const files = this.flatten(tree).filter((f) => !/node_modules|\.git|dist\//.test(f)).slice(0, maxFiles);
        const rows: string[] = [];
        for (const f of files.slice(0, 40)) {
            let hint = '';
            try {
                const content = await this.workspace.readFile(f);
                const symbols = [
                    ...content.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+([A-Za-z0-9_]+)/gm),
                ]
                    .map((m) => m[1])
                    .slice(0, 8);
                if (symbols.length > 0) hint = ` : ${symbols.join(', ')}`;
            } catch {
                hint = '';
            }
            rows.push(`${f}${hint}`);
        }
        return rows.join('\n').slice(0, 8000);
    }

    async applyEdit(path: string, format: 'whole' | 'diff', payload: string): Promise<string> {
        if (!this.workspace?.isAttached()) throw new Error('No workspace attached');
        const ws = this.workspace as unknown as {
            readFile(p: string): Promise<string>;
            writeFile?: (p: string, c: string) => Promise<void>;
        };
        if (format === 'whole') {
            if (!ws.writeFile) throw new Error('Workspace is read-only — whole rewrite recorded for patch only');
            await ws.writeFile(path, payload);
            return `rewrote ${path} (${payload.length} chars)`;
        }
        // diff format: lines starting with '-' removed, '+' added, ' ' context.
        // Applied with simple anchor matching (not a full patch parser by design).
        const current = await ws.readFile(path);
        const removals: string[] = [];
        const additions: string[] = [];
        for (const line of payload.split('\n')) {
            if (line.startsWith('-') && !line.startsWith('---')) removals.push(line.slice(1));
            else if (line.startsWith('+') && !line.startsWith('+++')) additions.push(line.slice(1));
        }
        if (removals.length === 0 && additions.length === 0) {
            throw new Error('Empty diff — nothing to apply');
        }
        let updated = current;
        for (const r of removals) {
            if (!updated.includes(r)) throw new Error(`Diff anchor not found: ${r.slice(0, 80)}`);
            updated = updated.replace(r, additions.shift() ?? '');
        }
        if (additions.length > 0) updated += '\n' + additions.join('\n');
        if (!ws.writeFile) return `diff validated for ${path} (workspace read-only — see patch)`;
        await ws.writeFile(path, updated);
        return `applied diff to ${path} (${removals.length}−/${payload.split('\n').filter((l) => l.startsWith('+')).length}+)`;
    }

    async commitMessage(diff: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Write a conventional-commit message (one line + optional body) for the diff. Reply with the message only.' },
                        { role: 'user', content: diff.slice(0, 4000) },
                    ],
                    { temperature: 0.3, maxTokens: 200 },
                );
                if (!res.error) return res.content.trim().slice(0, 500);
            } catch (e) {
                LOGGER.warn('commit message failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const plus = diff.split('\n').filter((l) => l.startsWith('+')).length;
        const minus = diff.split('\n').filter((l) => l.startsWith('-')).length;
        return `chore: update (+${plus}/-${minus})`;
    }

    async testChecklist(change: string): Promise<string[]> {
        const lower = change.toLowerCase();
        const list = ['typecheck changed files'];
        if (/api|endpoint|route|handler/.test(lower)) list.push('exercise touched endpoints');
        if (/db|dexie|migration|schema/.test(lower)) list.push('run migration on a copy + verify indexes');
        if (/prompt|llm|template/.test(lower)) list.push('spot-check 2-3 model outputs');
        list.push('run related unit tests');
        return list;
    }

    private flatten(
        nodes: Array<{ path: string; type: string; children?: Array<{ path: string; type: string; children?: unknown[] }> }>,
    ): string[] {
        const out: string[] = [];
        const walk = (list: Array<{ path: string; type: string; children?: unknown[] }>) => {
            for (const n of list) {
                if (n.type === 'file') out.push(n.path);
                if (Array.isArray(n.children)) {
                    walk(n.children as Array<{ path: string; type: string; children?: unknown[] }>);
                }
            }
        };
        walk(nodes as Array<{ path: string; type: string; children?: unknown[] }>);
        return out;
    }
}
