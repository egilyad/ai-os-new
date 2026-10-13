/**
 * Vertical slice (Phase 71, ro2 §6.1/§6.2): настоящий AgemsApprovalService
 * (Dexie) + настоящий ComputerUseLoopService + настоящий
 * SidecarComputerExecutor против локального HTTP-стаба актуатора.
 * LLM — скриптованный (ключ Anthropic для юнита не нужен).
 *
 * Доказывает: HITL-gate → loop → POST /act → скриншот назад в контекст
 * следующей итерации + COMPUTER_ACT событие.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { ComputerUseLoopService } from './computer-use-loop-service';
import { SidecarComputerExecutor } from './sidecar-computer-executor';
import { agemsApprovalService } from '../agems-approval-service';
import { ApprovalExecutionBridge } from '../approval-execution-bridge-service';
import { getDexieDb } from '../database-service';
import type { AdapterResponse } from '../../contracts/provider-adapter';

const AGENT = 'vertical-e2e-agent';

function scriptedLlm(script: AdapterResponse[]) {
    const seen: unknown[][] = [];
    let i = 0;
    return {
        seen,
        chat: vi.fn(async (messages: never, options?: unknown) => {
            seen.push([...(messages as unknown[])]);
            void options;
            return { ...(script[Math.min(i++, script.length - 1)] as AdapterResponse) };
        }),
    };
}

function startActuatorStub(onAct: (body: Record<string, unknown>) => Record<string, unknown>) {
    const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c: Buffer) => (raw += c.toString()));
        req.on('end', () => {
            const body = JSON.parse(raw) as Record<string, unknown>;
            const out = onAct(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(out));
        });
    });
    return {
        server,
        url: async (): Promise<string> => {
            await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
            return `http://127.0.0.1:${(server.address() as AddressInfo).port}/act`;
        },
        close: async (): Promise<void> => {
            await new Promise<void>((r) => server.close(() => r()));
        },
    };
}

describe('computer.use vertical slice (approval → loop → actuator stub)', () => {
    beforeEach(async () => {
        await getDexieDb().approvalRequests.clear();
    });

    it('human approves → loop clicks via HTTP actuator → screenshot feeds next turn', async () => {
        const actuatorCalls: Record<string, unknown>[] = [];
        const stub = startActuatorStub((body) => {
            actuatorCalls.push(body);
            expect(body['action']).toBe('left_click');
            expect(body['ticketId']).toBe('sbx-vertical');
            return { screenshot: 'e2e-shot-png', output: 'clicked at [100, 200]' };
        });
        const actUrl = await stub.url();
        try {
            // 1. HITL: агент просит, человек подтверждает.
            const req = await agemsApprovalService.requestApproval({
                agentId: AGENT,
                toolName: 'computer.use',
                toolInput: { task: 'click the example link' },
                category: 'computer',
                riskLevel: 'high',
                description: 'vertical slice',
            });
            await agemsApprovalService.resolve(req.id as number, 'APPROVED', undefined, 'human:e2e');

            // 2. Loop с настоящим executor против стаба.
            const llm = scriptedLlm([
                {
                    content: '',
                    toolCalls: [
                        {
                            id: 'tu_v1',
                            type: 'computer_20250124',
                            function: { name: 'computer', arguments: '{"action":"left_click","coordinate":[100,200]}' },
                        },
                    ],
                    latency: 1,
                    tokens: 9,
                } as AdapterResponse,
                { content: 'link clicked, task done', latency: 1, tokens: 5 } as AdapterResponse,
            ]);
            const emit = vi.fn();
            const svc = new ComputerUseLoopService({
                events: { emit } as never,
                llm: llm as never,
                executor: new SidecarComputerExecutor({ getConfig: () => ({ actUrl }) }),
            });
            const res = await svc.run({
                agentId: AGENT,
                task: 'click the example link',
                ticketId: 'sbx-vertical',
                approvedRequestId: req.id as number,
            });

            // 3. Сверка всего среза.
            expect(res.stopReason).toBe('done');
            expect(res.turns).toBe(2);
            expect(res.computerCalls).toBe(1);
            expect(res.lastScreenshot).toBe('e2e-shot-png');
            expect(res.output).toBe('link clicked, task done');
            expect(actuatorCalls).toHaveLength(1);
            expect(emit).toHaveBeenCalledWith(
                'computer:act',
                expect.objectContaining({ action: 'computer.left_click' }),
            );
            const secondTurn = llm.seen[1] as Array<{
                role: string;
                toolCallId?: string;
                content: string;
                inlineData?: Array<{ mimeType: string; data: string }>;
            }>;
            const toolMsg = secondTurn.find((m) => m.role === 'tool');
            expect(toolMsg?.toolCallId).toBe('tu_v1');
            expect(toolMsg?.content).toContain('clicked at [100, 200]');
            expect(toolMsg?.inlineData?.[0]).toMatchObject({
                mimeType: 'image/png',
                data: 'e2e-shot-png',
            });
        } finally {
            await stub.close();
        }
    });

    it('bridge path: human APPROVED auto-fires the loop with injected id', async () => {
        const actuatorCalls: Record<string, unknown>[] = [];
        const stub = startActuatorStub((body) => {
            actuatorCalls.push(body);
            return { screenshot: 'bridge-shot', output: 'done via bridge' };
        });
        const actUrl = await stub.url();
        // Мост с настоящим approval-синглтоном; toolRunner проксирует
        // в настоящий loop (как ToolRunner.callTool с tool computer.use).
        const llm = scriptedLlm([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'tu_b1',
                        type: 'computer_20250124',
                        function: { name: 'computer', arguments: '{"action":"screenshot"}' },
                    },
                ],
                latency: 1,
                tokens: 6,
            } as AdapterResponse,
            { content: 'bridged and done', latency: 1, tokens: 3 } as AdapterResponse,
        ]);
        const loopSvc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: new SidecarComputerExecutor({ getConfig: () => ({ actUrl }) }),
        });
        const toolOutputs: string[] = [];
        const bridge = new ApprovalExecutionBridge({
            approval: agemsApprovalService,
            toolRunner: {
                callTool: vi.fn(async (_agentId: string, tool: string, args: Record<string, unknown>) => {
                    expect(tool).toBe('computer.use');
                    const res = await loopSvc.runApproved({
                        task: String(args['task'] ?? ''),
                        approvedRequestId: args['approvedRequestId'] as number | undefined,
                        ticketId: args['ticketId'] as string | undefined,
                    });
                    const out = JSON.stringify(res);
                    toolOutputs.push(out);
                    return out;
                }),
            } as never,
        });
        bridge.start();
        try {
            const req = await agemsApprovalService.requestApproval({
                agentId: AGENT,
                toolName: 'computer.use',
                toolInput: { task: 'bridge task' },
                category: 'computer',
                riskLevel: 'high',
            });
            await agemsApprovalService.resolve(req.id as number, 'APPROVED', undefined, 'human:bridge');
            // onResolved летит floating-void — ждём актуатор дедлайном.
            const deadline = Date.now() + 5000;
            while (actuatorCalls.length === 0 && Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 50));
            }
            expect(actuatorCalls).toHaveLength(1);
            expect(toolOutputs).toHaveLength(1);
            expect(JSON.parse(toolOutputs[0] as string)).toMatchObject({ stopReason: 'done', computerCalls: 1 });
            // Заявка сожжена claim'ом — повторный USE невозможен.
            const after = await agemsApprovalService.list(AGENT);
            expect(after.find((r) => r.id === req.id)?.status).toBe('CONSUMED');
        } finally {
            bridge.destroy();
            await stub.close();
        }
    });

    it('stale approval blocks the loop before any HTTP happens', async () => {
        const calls: unknown[] = [];
        const stub = startActuatorStub((body) => {
            calls.push(body);
            return { screenshot: 'x' };
        });
        const actUrl = await stub.url();
        try {
            const req = await agemsApprovalService.requestApproval({
                agentId: AGENT,
                toolName: 'computer.use',
                toolInput: {},
                category: 'computer',
                riskLevel: 'high',
            });
            await agemsApprovalService.resolve(req.id as number, 'REJECTED', 'nope', 'human:e2e');
            const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
            const svc = new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: new SidecarComputerExecutor({ getConfig: () => ({ actUrl }) }),
            });
            await expect(
                svc.run({ agentId: AGENT, task: 'do it', approvedRequestId: req.id as number }),
            ).rejects.toThrow(/is REJECTED/);
            expect(calls).toHaveLength(0);
            expect(llm.chat).not.toHaveBeenCalled();
        } finally {
            await stub.close();
        }
    });
});
