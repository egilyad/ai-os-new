/**
 * Phase 71 — Computer Use loop (трасса B, CUA multi-turn) + исполняемый tool.
 *
 * Registers (additive, no migration):
 *   - `computerUseLoopService` (LLM → computer action → screenshot → LLM
 *     поверх AnthropicAdapter; executor по умолчанию — HTTP к sidecar `/act`)
 *   - tool `computer.use` — ЕДИНСТВЕННАЯ исполняемая точка loop для
 *     ToolRunner/bridge. Безопасна для LLM-видимости: run() требует
 *     `approvedRequestId` свежего APPROVED-запроса С ПРИВЯЗКОЙ
 *     (agent+tool+task) и сжигает его через claim — угаданный/чужой id
 *     не запустит чужую задачу, повторный USE без человека невозможен.
 *     Прямой вызов без id падает до первого LLM-запроса.
 *     Путь approve: requestApproval → human APPROVED →
 *     ApprovalExecutionBridge (инжектит approvedRequestId) → callTool →
 *     run() → loop. Governance-проверка ToolRunner.callTool — поверх.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import { ComputerUseLoopService } from '../services/computer/computer-use-loop-service';
import { SidecarComputerExecutor } from '../services/computer/sidecar-computer-executor';
import type { ToolService } from '../services/tool-executor';
import type { ExternalToolRecord } from '../services/tool-executor';

function str(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

export const registerPhase71: Phase = ({ register }) => {
    register('computerUseLoopService', (c: IContainer) => {
        // P1 durable trail: loop records run outcomes into the ToolService KV journal.
        const toolSvc = c.has('toolService') ? c.get<ToolService>('toolService') : undefined;
        const svc = new ComputerUseLoopService({
            events: c.get<IEventBus>('eventBus'),
            llm: c.get<ILLMClientService>('llmClientService'),
            executor: new SidecarComputerExecutor(),
            toolTrail: toolSvc
                ? {
                      record: (entry: ExternalToolRecord) =>
                          toolSvc.recordExternalExecution(entry),
                  }
                : undefined,
        });

        // computer.use виден LLM/bridge здесь же (паттерн phase33/phase70):
        // фабрика выполняется на boot, tool попадает в runWithTools-toolDefs.
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                runner.addTool({
                    name: 'computer.use',
                    description:
                        'Run a computer-use automation loop (Anthropic computer tool: LLM acts, screenshot feeds back). ' +
                        'HIGH RISK: requires approvedRequestId of a fresh human-APPROVED request for the same task; ' +
                        'the approval is consumed (one approval = one run). ' +
                        'Not configured until an Anthropic or Gemini key exists and browserUse.actUrl is set.',
                    parameters: {
                        type: 'object',
                        properties: {
                            task: {
                                type: 'string',
                                description: 'Natural-language computer task, e.g. "open the browser and screenshot example.com"',
                            },
                            approvedRequestId: {
                                type: 'number',
                                description: 'Id of the human-APPROVED computer.use request for this exact task',
                            },
                            ticketId: {
                                type: 'string',
                                description: 'Optional sandbox/approval ticket id for audit trail',
                            },
                            maxTurns: {
                                type: 'number',
                                description: 'Max loop turns (cut by approval-preset cap)',
                            },
                            provider: {
                                type: 'string',
                                enum: ['anthropic', 'gemini-computer'],
                                description: "LLM provider for the loop (default anthropic; gemini-computer uses the Gemini key)",
                            },
                        },
                        required: ['task'],
                    },
                    run: async (args) => {
                        const task = str(args['task']);
                        if (!task) throw new Error('computer.use: task is required');
                        const approvedRequestId =
                            typeof args['approvedRequestId'] === 'number'
                                ? (args['approvedRequestId'] as number)
                                : undefined;
                        const maxTurns =
                            typeof args['maxTurns'] === 'number' ? (args['maxTurns'] as number) : undefined;
                        const ticketId = str(args['ticketId']) || undefined;
                        const provider =
                            args['provider'] === 'gemini-computer' ? 'gemini-computer' : 'anthropic';
                        // agentId — из самой заявки (runApproved), не из args.
                        const res = await svc.runApproved({ task, approvedRequestId, maxTurns, ticketId, provider });
                        return JSON.stringify({
                            stopReason: res.stopReason,
                            turns: res.turns,
                            computerCalls: res.computerCalls,
                            output: res.output.slice(0, 4000),
                        }).slice(0, 6000);
                    },
                });
            }
        } catch {
            // offline / partial container — computer.use просто недоступен
        }

        return svc;
    });
};
