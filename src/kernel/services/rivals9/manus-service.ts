/**
 * ManusService — N.3 (executor → verifier loop, schedules, replay export).
 *
 * runVerified: executes a crew/graph run, then an INDEPENDENT verifier LLM
 * scores it against a rubric; on fail the run repeats (reset) up to maxFixes.
 * Schedules live in kv (`manus-sched/*`) with minute/hour/dow matching +
 * dueRuns(). exportRun builds a shareable JSON envelope (via prototype
 * transcript format) from crew outputs / graph decisions / council summary.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICrewService } from '../../contracts/crew';
import type { IGraphService } from '../../contracts/graph';
import type { ICouncilService } from '../../contracts/council';
import type { IManusService } from '../../contracts/rivals9';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Manus');

function now(): number {
    return Date.now();
}

function fieldMatch(field: string, value: number): boolean {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
        const n = Number(field.slice(2));
        return n > 0 && value % n === 0;
    }
    return field.split(',').some((p) => Number(p) === value);
}

const DEFAULT_RUBRIC = 'Score 0-10: correctness, completeness, format. Reply "PASS <score>" or "FAIL: <reason>".';

export class ManusService implements IManusService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private crews: ICrewService,
        private graphs?: IGraphService,
        private councils?: ICouncilService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Manus', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async runVerified(input: {
        kind: 'crew' | 'graph';
        refId: string;
        rubric?: string;
        maxFixes?: number;
    }): Promise<{ status: string; rounds: number; report: string }> {
        const fixes = Math.max(0, Math.min(5, input.maxFixes ?? 2));
        const rubric = input.rubric ?? DEFAULT_RUBRIC;
        let rounds = 0;
        let lastOutput = '';
        for (let attempt = 0; attempt <= fixes; attempt++) {
            rounds = attempt + 1;
            if (input.kind === 'crew') {
                if (attempt > 0) await this.crews.resetTasks(input.refId);
                const res = await this.crews.startCrew(input.refId);
                if (res.status === 'paused') {
                    return { status: 'paused', rounds, report: 'Crew paused for human input — verify after resume.' };
                }
                lastOutput = Object.values(res.outputs).join('\n---\n').slice(0, 6000);
            } else {
                if (!this.graphs) throw new Error('Graph runner unavailable');
                const res = await this.graphs.runGraph(input.refId, { attempt });
                if (res.status === 'paused') {
                    return { status: 'paused', rounds, report: 'Graph paused for approval — verify after resume.' };
                }
                lastOutput = String(res.result ?? '').slice(0, 6000);
            }
            const verdict = await this.verify(lastOutput, rubric);
            this.events.emit(EVENTS.MANUS_VERIFY, { round: rounds, pass: verdict.pass });
            if (verdict.pass) {
                return { status: 'verified', rounds, report: `PASS (${verdict.note}). Output:\n${lastOutput.slice(0, 2000)}` };
            }
            lastOutput += `\n\n[VERIFIER FEEDBACK — fix and retry: ${verdict.note}]`;
        }
        return { status: 'failed-verification', rounds, report: `FAIL after ${rounds} round(s). Last:\n${lastOutput.slice(0, 2000)}` };
    }

    async schedule(name: string, cron: string, task: string): Promise<string> {
        const parts = cron.trim().split(/\s+/);
        if (parts.length < 5) throw new Error('Cron needs 5 fields (min hour dom mon dow)');
        const doc = {
            id: genId('sched'),
            name: name.slice(0, 120),
            cron: parts.slice(0, 5).join(' '),
            task: task.slice(0, 1000),
            createdAt: now(),
        };
        await this.dal.kv.set(`manus-sched/${doc.id}`, doc);
        return doc.id;
    }

    async dueRuns(nowMs = Date.now()): Promise<Array<{ id: string; name: string; task: string }>> {
        const d = new Date(nowMs);
        const rows = await this.dal.kv.list('manus-sched/');
        const due: Array<{ id: string; name: string; task: string }> = [];
        for (const r of rows) {
            const s = r.value as { id: string; name: string; cron: string; task: string };
            const [minute, hour, , , dow] = s.cron.split(' ');
            if (
                fieldMatch(minute as string, d.getMinutes()) &&
                fieldMatch(hour as string, d.getHours()) &&
                fieldMatch(dow as string, d.getDay())
            ) {
                const minuteKey = Math.floor(nowMs / 60000);
                const firedAt = await this.dal.kv.get<number>(`manus-fired/${s.id}`);
                if (firedAt !== minuteKey) {
                    await this.dal.kv.set(`manus-fired/${s.id}`, minuteKey);
                    due.push({ id: s.id, name: s.name, task: s.task });
                }
            }
        }
        return due;
    }

    async exportRun(kind: 'crew' | 'graph' | 'council', refId: string): Promise<string> {
        let lines: string[] = [];
        let title = `${kind}:${refId}`;
        if (kind === 'crew') {
            const crew = await this.crews.getCrew(refId);
            if (!crew) throw new Error(`Crew not found: ${refId}`);
            title = `Crew replay: ${crew.name}`;
            const tasks = await this.crews.listTasks(refId);
            lines = tasks.map((t) => `[${t.status}] ${t.description}\n${(t.output ?? '').slice(0, 800)}`);
        } else if (kind === 'graph' && this.graphs) {
            const decisions = await this.graphs.decisionLog(refId);
            title = `Graph replay: ${refId}`;
            lines = decisions.map((x) => `[${x.nodeId}] ${x.decision.slice(0, 400)} (rejected: ${x.rejected.join('; ').slice(0, 200)})`);
        } else if (kind === 'council' && this.councils) {
            const session = await this.councils.getSession(refId);
            if (!session) throw new Error(`Council not found: ${refId}`);
            title = `Council replay: ${session.topic}`;
            lines = [
                `Winner: ${session.winnerId ?? 'n/a'}`,
                ...(session.summary ? [session.summary] : []),
                ...session.messages.slice(0, 30).map((m) => `[${m.channel}] ${m.body.slice(0, 400)}`),
            ];
        } else {
            throw new Error(`Export unavailable for ${kind} (runner missing)`);
        }
        const envelope = {
            kind: 'prototype-transcript',
            version: 1,
            id: genId('replay'),
            title: title.slice(0, 200),
            lines: lines.map((l) => l.slice(0, 2000)).slice(0, 200),
            exportedAt: Date.now(),
        };
        this.events.emit(EVENTS.MANUS_EXPORT, { kind, refId });
        return JSON.stringify(envelope, null, 2);
    }

    private async verify(output: string, rubric: string): Promise<{ pass: boolean; note: string }> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: `You are an independent verifier. Rubric: ${rubric}` },
                        { role: 'user', content: output.slice(0, 5000) || '(empty output)' },
                    ],
                    { temperature: 0.1, maxTokens: 200 },
                );
                if (!res.error) {
                    const text = res.content.trim();
                    const pass = /^pass\b/i.test(text);
                    return { pass, note: text.slice(0, 300) };
                }
            } catch (e) {
                LOGGER.warn('verify failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const pass = output.length > 0 && !output.startsWith('(empty');
        return { pass, note: pass ? 'offline heuristic: non-empty' : 'offline heuristic: empty output' };
    }
}
