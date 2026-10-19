/**
 * Phase 74 — workflow distillation (Voyager-style skill extraction).
 *
 * Registers:
 *   - workflowDistiller (SessionMemoryService → reusable workflow; persists it
 *     as agent-owned LT memory and registers an in-memory SOP)
 *
 * Also exposes `workflow.distill` to agents on the shared ToolRunner.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IToolRunnerService } from '../contracts/parity';
import type { ILtMemoryService } from '../contracts/persona';
import type { ISopService } from '../contracts/rivals';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ISessionMemoryService } from '../contracts/session-memory';
import { WorkflowDistiller } from '../services/memory/workflow-distiller';

export const registerPhase74: Phase = ({ register }) => {
    register('workflowDistiller', (c: IContainer) => {
        const svc = new WorkflowDistiller({
            sessionMemory: c.get<ISessionMemoryService>('sessionMemoryService'),
            ltMemory: c.has('ltMemoryService')
                ? c.get<ILtMemoryService>('ltMemoryService')
                : undefined,
            sop: c.has('sopService') ? c.get<ISopService>('sopService') : undefined,
            llm: c.has('llmClientService')
                ? c.get<ILLMClientService>('llmClientService')
                : undefined,
        });
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                const str = (v: unknown): string => (typeof v === 'string' ? v : '');
                runner.addTool({
                    name: 'workflow.distill',
                    description:
                        'Distill the current session into a reusable step-by-step workflow.',
                    parameters: {
                        type: 'object',
                        properties: {
                            sessionId: { type: 'string' },
                            name: { type: 'string' },
                        },
                    },
                    run: async (args) => {
                        const sessionId = str(args['sessionId']) || 'agent';
                        const name = str(args['name']) || undefined;
                        const wf = await svc.distill(sessionId, { ...(name ? { name } : {}) });
                        if (!wf) return '(not enough session activity to distill a workflow)';
                        return [
                            `# ${wf.name}`,
                            `source: ${wf.source}`,
                            ...(wf.memoryId ? [`memory: ${wf.memoryId}`] : []),
                            ...(wf.sopId ? [`sop: ${wf.sopId}`] : []),
                            '',
                            ...wf.steps.map((s, i) => `${i + 1}. ${s}`),
                        ].join('\n');
                    },
                });
            }
        } catch {
            // offline / partial container — workflow tool simply unavailable
        }
        return svc;
    });
};
