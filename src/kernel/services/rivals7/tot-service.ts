/**
 * TotService — M.2 (Tree-of-Thoughts BFS, additive).
 *
 * Levels: generate `breadth` thoughts → score each (LLM vote or overlap
 * heuristic) → keep top `keep` → expand next level. Best leaf wins;
 * the path plus evaluation log enable backtracking inspection.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ITotService } from '../../contracts/rivals7';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ToT');

interface ThoughtNode {
    text: string;
    score: number;
    parent: number;
    level: number;
}

export class TotService implements ITotService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('ToT', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async search(task: string, breadth = 3, depth = 2, keep = 2): Promise<{
        best: string;
        path: string[];
        evaluated: number;
    }> {
        const b = Math.max(1, Math.min(6, breadth));
        const d = Math.max(1, Math.min(4, depth));
        const k = Math.max(1, Math.min(b, keep));
        let frontier: ThoughtNode[] = [{ text: task, score: 1, parent: -1, level: 0 }];
        const all: ThoughtNode[] = [...frontier];
        let evaluated = 0;

        for (let level = 1; level <= d; level++) {
            const next: ThoughtNode[] = [];
            for (const node of frontier) {
                const thoughts = await this.generate(task, node.text, b);
                for (const t of thoughts) {
                    const score = await this.evaluate(task, t);
                    evaluated += 1;
                    const idx = all.length;
                    all.push({ text: t, score, parent: all.indexOf(node), level });
                    next.push(all[idx] as ThoughtNode);
                }
            }
            next.sort((a, z) => z.score - a.score);
            frontier = next.slice(0, k);
            this.events.emit(EVENTS.TOT_LEVEL, { level, kept: frontier.length });
            if (frontier.length === 0) break;
        }
        const best = frontier.length > 0
            ? frontier.reduce((a, z) => (z.score > a.score ? z : a))
            : all[0]!;
        const path: string[] = [];
        let cur: ThoughtNode | undefined = best;
        while (cur && cur.level > 0) {
            path.unshift(cur.text);
            cur = all[cur.parent];
        }
        return { best: best.text, path, evaluated };
    }

    private async generate(task: string, parent: string, n: number): Promise<string[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: `Propose ${n} distinct next thoughts for this task, one per line starting with "- ". Diverse angles.`,
                        },
                        { role: 'user', content: `Task: ${task.slice(0, 800)}\nCurrent thought: ${parent.slice(0, 800)}` },
                    ],
                    { temperature: 0.8, maxTokens: 500 },
                );
                if (!res.error) {
                    const lines = res.content
                        .split('\n')
                        .map((l) => l.replace(/^-\s*/, '').trim())
                        .filter((l) => l.length > 0)
                        .slice(0, n);
                    if (lines.length > 0) return lines;
                }
            } catch (e) {
                LOGGER.warn('ToT', 'tot generate failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return Array.from({ length: n }, (_, i) => `[thought ${i + 1}] ${parent.slice(0, 160)}`);
    }

    private async evaluate(task: string, thought: string): Promise<number> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Rate how promising this thought is for the task. Reply with a single number 0-10.' },
                        { role: 'user', content: `Task: ${task.slice(0, 500)}\nThought: ${thought.slice(0, 800)}` },
                    ],
                    { temperature: 0.1, maxTokens: 20 },
                );
                if (!res.error) {
                    const m = res.content.match(/(\d+(?:\.\d+)?)/);
                    if (m) return Math.max(0, Math.min(10, Number(m[1])));
                }
            } catch (e) {
                LOGGER.warn('ToT', 'tot evaluate failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        // Offline heuristic: longer, task-overlapping thoughts score higher.
        const taskTokens = new Set(task.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
        const thoughtTokens = thought.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2);
        let hit = 0;
        for (const t of thoughtTokens) if (taskTokens.has(t)) hit += 1;
        return Math.min(10, hit + Math.min(3, thoughtTokens.length / 10));
    }
}
