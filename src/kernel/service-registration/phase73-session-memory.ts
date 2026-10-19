/**
 * Phase 73 — session-scoped scratchpad memory for coding agents.
 *
 * Registers (additive, no migration):
 *   - sessionMemoryService (KV-persisted per-session objective/files/commands/
 *     decisions/issues/notes; lazy load so late resolution is safe)
 *
 * The factory also exposes it to agents as tools (`session.remember`,
 * `session.recall`) on the shared ToolRunner, mirroring the memory.* tools.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IToolRunnerService } from '../contracts/parity';
import type { SessionMemoryKind } from '../contracts/session-memory';
import { SessionMemoryService } from '../services/session-memory-service';

const KINDS: SessionMemoryKind[] = ['file', 'command', 'decision', 'issue', 'note'];

export const registerPhase73: Phase = ({ register }) => {
    register('sessionMemoryService', (c: IContainer) => {
        const svc = new SessionMemoryService({
            database: c.get<{
                getKv: <T>(id: string) => Promise<T | null>;
                setKv: <T>(id: string, value: T) => Promise<void>;
            }>('database'),
        });
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                const str = (v: unknown): string => (typeof v === 'string' ? v : '');
                runner.addTool({
                    name: 'session.remember',
                    description:
                        'Record a session-scoped fact (file, command, decision, issue, note).',
                    parameters: {
                        type: 'object',
                        properties: { kind: { type: 'string' }, text: { type: 'string' } },
                        required: ['kind', 'text'],
                    },
                    run: async (args) => {
                        const kind = str(args['kind']) as SessionMemoryKind;
                        if (!KINDS.includes(kind)) {
                            throw new Error('kind must be file|command|decision|issue|note');
                        }
                        const text = str(args['text']);
                        if (!text) throw new Error('text is required');
                        const sessionId = str(args['sessionId']) || 'agent';
                        await svc.remember(sessionId, kind, text);
                        return `recorded ${kind}`;
                    },
                });
                runner.addTool({
                    name: 'session.recall',
                    description: 'Read the current session scratchpad (objective, files, decisions…).',
                    parameters: { type: 'object', properties: { sessionId: { type: 'string' } } },
                    run: async (args) => svc.buildContext(str(args['sessionId']) || 'agent') || '(empty)',
                });
            }
        } catch {
            // offline / partial container — session tools simply unavailable
        }
        return svc;
    });
};
