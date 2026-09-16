/**
 * IdeService — J.1 (AI IDE helpers, additive).
 *
 * askCodebase (repoMap + grep evidence → LLM answer with file cites),
 * editPlan (multi-file change list via LLM JSON), terminal (commands →
 * computer sandbox tickets for outside execution).
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { ISandboxBrokerService } from '../../contracts/ops';
import type { IIdeService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('IDE');

export class IdeService implements IIdeService {
    constructor(
        private llm?: ILLMClientService,
        private workspace?: IWorkspaceService,
        private sandbox?: ISandboxBrokerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async askCodebase(question: string): Promise<string> {
        if (!this.workspace?.isAttached()) return '(no workspace attached)';
        const hits = await this.workspace.grepContent(question.split(/\s+/).filter((w) => w.length > 3)[0] ?? question);
        const evidence = hits
            .slice(0, 12)
            .map((h) => `${h.path}:${h.line}: ${h.content.slice(0, 200)}`)
            .join('\n');
        if (!this.llm) {
            return `Evidence:\n${evidence || '(no matches)'}`;
        }
        try {
            const res = await this.llm.chat(
                [
                    { role: 'system', content: 'Answer about the codebase using ONLY the evidence. Cite file:line for each claim.' },
                    { role: 'user', content: `Q: ${question.slice(0, 1000)}\nEvidence:\n${evidence.slice(0, 6000) || '(none)'}` },
                ],
                { temperature: 0.2, maxTokens: 900 },
            );
            if (!res.error) return res.content;
        } catch (e) {
            LOGGER.warn('askCodebase failed', { error: e instanceof Error ? e.message : String(e) });
        }
        return `Evidence:\n${evidence || '(no matches)'}`;
    }

    async editPlan(task: string): Promise<Array<{ path: string; change: string }>> {
        if (!this.workspace?.isAttached()) throw new Error('No workspace attached');
        const tree = await this.workspace.listTree();
        const files = this.flatten(tree).slice(0, 60).join('\n');
        if (!this.llm) return [{ path: '(offline)', change: task.slice(0, 300) }];
        try {
            const res = await this.llm.chat(
                [
                    {
                        role: 'system',
                        content: 'Reply as JSON ONLY: [{"path":"...","change":"..."}]. Multi-file edit plan, max 8 entries.',
                    },
                    { role: 'user', content: `Task: ${task.slice(0, 2000)}\nFiles:\n${files.slice(0, 4000)}` },
                ],
                { temperature: 0.3, maxTokens: 1000 },
            );
            if (!res.error) {
                const start = res.content.indexOf('[');
                if (start >= 0) {
                    const parsed = JSON.parse(res.content.slice(start, res.content.lastIndexOf(']') + 1)) as Array<{
                        path?: string;
                        change?: string;
                    }>;
                    return parsed
                        .filter((p) => p.path && p.change)
                        .map((p) => ({ path: String(p.path), change: String(p.change).slice(0, 500) }))
                        .slice(0, 8);
                }
            }
        } catch (e) {
            LOGGER.warn('editPlan failed', { error: e instanceof Error ? e.message : String(e) });
        }
        return [{ path: '(unplanned)', change: task.slice(0, 300) }];
    }

    async terminal(command: string): Promise<string> {
        if (!this.sandbox) return `terminal-queued (no sandbox): ${command.slice(0, 200)}`;
        const ticket = await this.sandbox.request({
            kind: 'computer',
            agentId: 'ide-terminal',
            purpose: `Terminal: ${command.slice(0, 200)}`,
        });
        return ticket.id;
    }

    private flatten(
        nodes: Array<{ path: string; type: string; children?: unknown[] }>,
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
        walk(nodes);
        return out;
    }
}
