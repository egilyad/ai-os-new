/**
 * ComputerUseLoopService tests (Phase 71) — CUA multi-turn loop.
 * LLM и executor — скриптованные моки, сети нет.
 */
import { describe, it, expect, vi } from 'vitest';
import { ComputerUseLoopService } from './computer-use-loop-service';
import type { AdapterResponse } from '../../contracts/provider-adapter';

function computerCall(id: string, input: unknown) {
    return {
        id,
        type: 'computer_20250124' as const,
        function: { name: 'computer', arguments: JSON.stringify(input) },
    };
}

function scriptedLlm(script: AdapterResponse[]) {
    const seen: Array<{ messages: unknown[]; options: unknown }>= [];
    let i = 0;
    return {
        seen,
        chat: vi.fn(async (messages: never, options?: unknown) => {
            seen.push({ messages: [...(messages as unknown[])], options });
            const step = script[Math.min(i++, script.length - 1)] as AdapterResponse;
            return { ...step };
        }),
    };
}

function okExecutor() {
    const calls: unknown[] = [];
    return {
        calls,
        execute: vi.fn(async (action: { action: string }) => {
            calls.push(action);
            return {};
        }),
    };
}

function approvedList(status: string, id = 7, expired = false) {
    return {
        list: vi.fn(async () => [
            {
                id,
                agentId: 'a1',
                toolName: 'computer.use',
                toolInput: { task: 'do it' },
                category: 'computer',
                riskLevel: 'high',
                status,
                createdAt: Date.now(),
                ...(expired ? { expiresAt: Date.now() - 1000 } : {}),
            },
        ]),
        claim: vi.fn(async (claimId: number) => ({ id: claimId, status: 'CONSUMED' })),
    };
}

function baseOpts(over: Record<string, unknown> = {}) {
    return {
        agentId: 'a1',
        task: 'open the browser and screenshot example.com',
        requireApproval: false,
        ...over,
    };
}

describe('ComputerUseLoopService (phase71)', () => {
    it('returns done immediately when LLM makes no calls', async () => {
        const llm = scriptedLlm([{ content: 'nothing to do', latency: 1, tokens: 5 } as AdapterResponse]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
        });
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('done');
        expect(res.turns).toBe(1);
        expect(res.output).toBe('nothing to do');
        expect(res.computerCalls).toBe(0);
    });

    it('click → screenshot → done feeds image back as tool_result', async () => {
        const llm = scriptedLlm([
            { content: '', toolCalls: [computerCall('tu_1', { action: 'left_click', coordinate: [100, 200] })], latency: 1, tokens: 9 } as AdapterResponse,
            { content: 'clicked it', latency: 1, tokens: 4 } as AdapterResponse,
        ]);
        const execCalls: Array<{ action: string; coordinate?: unknown }> = [];
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: {
                execute: vi.fn(async (action: { action: string; coordinate?: unknown }) => {
                    execCalls.push(action);
                    return { screenshotBase64: 'iVBORw0KGgo=', output: 'clicked' };
                }),
            } as never,
        });
        const res = await svc.run(baseOpts({ ticketId: 'sbx-1' }));
        expect(res.stopReason).toBe('done');
        expect(res.turns).toBe(2);
        expect(res.computerCalls).toBe(1);
        expect(res.lastScreenshot).toBe('iVBORw0KGgo=');
        expect(execCalls[0]).toMatchObject({ action: 'left_click', coordinate: [100, 200] });
        // Второму вызову chat ушёл tool_result со скриншотом в inlineData.
        const secondTurn = llm.seen[1]?.messages as Array<{
            role: string;
            toolCallId?: string;
            inlineData?: Array<{ mimeType: string; data: string }>;
        }>;
        const toolMsg = secondTurn.find((m) => m.role === 'tool');
        expect(toolMsg?.toolCallId).toBe('tu_1');
        expect(toolMsg?.inlineData?.[0]).toMatchObject({ mimeType: 'image/png', data: 'iVBORw0KGgo=' });
        // COMPUTER_ACT заэмичен.
        expect((svc as unknown as { deps: { events: { emit: unknown } } }).deps.events.emit).toHaveBeenCalled();
    });

    it('answers function-tools with error tool_result and continues', async () => {
        const llm = scriptedLlm([
            {
                content: '',
                toolCalls: [{ id: 'f1', type: 'function', function: { name: 'get_weather', arguments: '{}' } }],
                latency: 1,
                tokens: 3,
            } as AdapterResponse,
            { content: 'fine, done', latency: 1, tokens: 2 } as AdapterResponse,
        ]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
        });
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('done');
        expect(res.computerCalls).toBe(0);
        const secondTurn = llm.seen[1]?.messages as Array<{ role: string; content: string }>;
        const toolMsg = secondTurn.find((m) => m.role === 'tool');
        expect(toolMsg?.content).toMatch(/not supported inside computer.use/);
    });

    it('executor transport throw aborts with executor_error', async () => {
        const llm = scriptedLlm([
            { content: '', toolCalls: [computerCall('tu_1', { action: 'screenshot' })], latency: 1, tokens: 3 } as AdapterResponse,
        ]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: {
                execute: vi.fn(async () => {
                    throw new Error('connection refused');
                }),
            } as never,
        });
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('executor_error');
        expect(res.output).toMatch(/connection refused/);
    });

    it('action-level error continues the loop', async () => {
        const llm = scriptedLlm([
            { content: '', toolCalls: [computerCall('tu_1', { action: 'left_click', coordinate: [5, 5] })], latency: 1, tokens: 3 } as AdapterResponse,
            { content: 'recovered', latency: 1, tokens: 2 } as AdapterResponse,
        ]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: { execute: vi.fn(async () => ({ error: 'click missed' })) } as never,
        });
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('done');
        const secondTurn = llm.seen[1]?.messages as Array<{ role: string; content: string }>;
        expect(secondTurn.find((m) => m.role === 'tool')?.content).toMatch(/ERROR: click missed/);
    });

    it('stops at maxTurns', async () => {
        const step = {
            content: '',
            toolCalls: [computerCall('tu_x', { action: 'wait' })],
            latency: 1,
            tokens: 1,
        } as AdapterResponse;
        const llm = scriptedLlm([step]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: { execute: vi.fn(async () => ({ output: 'waited' })) } as never,
        });
        const res = await svc.run(baseOpts({ maxTurns: 3 }));
        expect(res.stopReason).toBe('max_turns');
        expect(res.turns).toBe(3);
        expect(res.computerCalls).toBe(3);
    });

    it('drops oversized screenshots with an overflow marker', async () => {
        const llm = scriptedLlm([
            { content: '', toolCalls: [computerCall('tu_1', { action: 'screenshot' })], latency: 1, tokens: 2 } as AdapterResponse,
            { content: 'ok', latency: 1, tokens: 1 } as AdapterResponse,
        ]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: { execute: vi.fn(async () => ({ screenshotBase64: 'z'.repeat(4_000_000) })) } as never,
        });
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('done');
        const secondTurn = llm.seen[1]?.messages as Array<{
            role: string;
            content: string;
            inlineData?: unknown;
        }>;
        const toolMsg = secondTurn.find((m) => m.role === 'tool');
        expect(toolMsg?.inlineData).toBeUndefined();
        expect(toolMsg?.content).toMatch(/exceeds context limit/);
    });

    it('policy BLOCKED refuses before any LLM call', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        const exec = { execute: vi.fn(async () => ({})) };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: exec as never,
            approval: {
                list: vi.fn(async () => []),
                getPolicy: vi.fn(async () => ({
                    agentId: 'a1',
                    preset: 'FULL_CONTROL',
                    executeMode: 'REQUIRES_APPROVAL',
                    toolOverrides: { 'computer.use': 'BLOCKED' },
                    updatedAt: Date.now(),
                })),
            } as never,
        });
        await expect(svc.run(baseOpts({ requireApproval: false }))).rejects.toThrow(/blocked by approval policy/);
        expect(llm.chat).not.toHaveBeenCalled();
        expect(exec.execute).not.toHaveBeenCalled();
    });

    it('policy FREE skips approval check unless caller tightens it', async () => {
        const llm = scriptedLlm([{ content: 'free run', latency: 1, tokens: 1 } as AdapterResponse]);
        const freePolicy = {
            list: vi.fn(async () => []),
            getPolicy: vi.fn(async () => ({
                agentId: 'a1',
                preset: 'AUTOPILOT',
                executeMode: 'FREE',
                updatedAt: Date.now(),
            })),
        };
        const mk = () =>
            new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: okExecutor() as never,
                approval: freePolicy as never,
            });
        const res = await mk().run(baseOpts({ requireApproval: false }));
        expect(res.stopReason).toBe('done');
        expect(freePolicy.list).not.toHaveBeenCalled();
        // Вызывающий вправе ужесточить: явный requireApproval + нет заявки → throw.
        await expect(mk().run(baseOpts({ requireApproval: true }))).rejects.toThrow(/approvedRequestId/);
    });

    it('preset caps maxTurns (SUPERVISED cuts 30 → 10)', async () => {
        const step = {
            content: '',
            toolCalls: [computerCall('tu_x', { action: 'wait' })],
            latency: 1,
            tokens: 1,
        } as AdapterResponse;
        const llm = scriptedLlm([step]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: { execute: vi.fn(async () => ({ output: 'waited' })) } as never,
            approval: {
                list: vi.fn(async () => []),
                getPolicy: vi.fn(async () => ({
                    agentId: 'a1',
                    preset: 'SUPERVISED',
                    executeMode: 'FREE',
                    updatedAt: Date.now(),
                })),
            } as never,
        });
        const res = await svc.run(baseOpts({ requireApproval: false, maxTurns: 30 }));
        expect(res.stopReason).toBe('max_turns');
        expect(res.turns).toBe(10);
        expect(res.maxTurnsApplied).toBe(10);
    });

    it('resolveComputerMode / presetTurnsCap unit semantics', async () => {
        const { resolveComputerMode, presetTurnsCap } = await import('./computer-use-loop-service');
        expect(resolveComputerMode(undefined)).toBe('REQUIRES_APPROVAL');
        expect(resolveComputerMode({ executeMode: 'FREE' } as never)).toBe('FREE');
        expect(resolveComputerMode({ executeMode: 'BLOCKED' } as never)).toBe('BLOCKED');
        expect(
            resolveComputerMode({ executeMode: 'FREE', toolOverrides: { 'computer.use': 'BLOCKED' } } as never),
        ).toBe('BLOCKED');
        expect(resolveComputerMode({ executeMode: 'WRONG' } as never)).toBe('REQUIRES_APPROVAL');
        expect(presetTurnsCap(undefined)).toBe(10);
        expect(presetTurnsCap({ preset: 'FULL_CONTROL' } as never)).toBe(5);
        expect(presetTurnsCap({ preset: 'AUTOPILOT' } as never)).toBe(30);
    });

    it('binding: approval for another tool/task does not authorize the run', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        const mk = (toolName: string, task: unknown) =>
            new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: okExecutor() as never,
                approval: {
                    list: vi.fn(async () => [
                        {
                            id: 9,
                            agentId: 'a1',
                            toolName,
                            toolInput: { task },
                            category: 'computer',
                            riskLevel: 'high',
                            status: 'APPROVED',
                            createdAt: Date.now(),
                        },
                    ]),
                } as never,
            });
        await expect(
            mk('browser.act', 'do it').run({ agentId: 'a1', task: 'do it', approvedRequestId: 9 }),
        ).rejects.toThrow(/covers 'browser.act', not 'computer.use'/);
        await expect(
            mk('computer.use', 'other task').run({ agentId: 'a1', task: 'do it', approvedRequestId: 9 }),
        ).rejects.toThrow(/different task/);
        expect(llm.chat).not.toHaveBeenCalled();
    });

    it('runApproved: agentId comes from the request, not the caller', async () => {
        const seenAgents: string[] = [];
        const approval = {
            list: vi.fn(async () => [
                {
                    id: 11,
                    agentId: 'victim-agent',
                    toolName: 'computer.use',
                    toolInput: { task: 'do it' },
                    category: 'computer',
                    riskLevel: 'high',
                    status: 'APPROVED',
                    createdAt: Date.now(),
                },
            ]),
            claim: vi.fn(async () => ({ id: 11, status: 'CONSUMED' })),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: {
                chat: vi.fn(async (_messages: never, options?: unknown) => {
                    seenAgents.push(((options ?? {}) as { cacheScope?: { agentId?: string } }).cacheScope?.agentId ?? '');
                    return { content: 'ran as victim', latency: 1, tokens: 1 };
                }),
            } as never,
            executor: okExecutor() as never,
            approval: approval as never,
        });
        const res = await svc.runApproved({ task: 'do it', approvedRequestId: 11 });
        expect(res.stopReason).toBe('done');
        expect(seenAgents).toEqual(['victim-agent']);
        // Claim произошёл — повторный запуск по тому же id уже не пройдёт check.
        expect(approval.claim).toHaveBeenCalledWith(11);
        await expect(svc.runApproved({ task: 'do it', approvedRequestId: 404 })).rejects.toThrow(/not found/);
        await expect(svc.runApproved({ task: 'do it', approvedRequestId: undefined })).rejects.toThrow(
            /HITL approval required/,
        );
    });

    it('claim consumes the approval: second run with same id fails', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        let status = 'APPROVED';
        const approval = {
            list: vi.fn(async () => [
                {
                    id: 12,
                    agentId: 'a1',
                    toolName: 'computer.use',
                    toolInput: { task: 'do it' },
                    category: 'computer',
                    riskLevel: 'high',
                    status,
                    createdAt: Date.now(),
                },
            ]),
            claim: vi.fn(async () => {
                status = 'CONSUMED';
                return { id: 12, status: 'CONSUMED' };
            }),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
            approval: approval as never,
        });
        const first = await svc.run({ agentId: 'a1', task: 'do it', approvedRequestId: 12 });
        expect(first.stopReason).toBe('done');
        // Статус в сторе теперь CONSUMED — повтор упирается в check.
        await expect(svc.run({ agentId: 'a1', task: 'do it', approvedRequestId: 12 })).rejects.toThrow(
            /is CONSUMED/,
        );
    });

    it('requestAndRun: approve mid-poll → runs with the fresh id', async () => {
        const llm = scriptedLlm([{ content: 'ran', latency: 1, tokens: 1 } as AdapterResponse]);
        let status = 'PENDING';
        const approval = {
            list: vi.fn(async () => [
                {
                    id: 21,
                    agentId: 'a1',
                    toolName: 'computer.use',
                    toolInput: { task: 'do it' },
                    category: 'computer',
                    riskLevel: 'high',
                    status,
                    createdAt: Date.now(),
                },
            ]),
            getPolicy: vi.fn(async () => undefined),
            claim: vi.fn(async () => ({ id: 21, status: 'CONSUMED' })),
            requestApproval: vi.fn(async () => ({ id: 21, status: 'PENDING' })),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
            approval: approval as never,
        });
        setTimeout(() => {
            status = 'APPROVED';
        }, 120);
        const res = await svc.requestAndRun({
            agentId: 'a1',
            task: 'do it',
            approvalTimeoutMs: 5000,
            pollIntervalMs: 30,
        });
        expect(res.stopReason).toBe('done');
        expect(res.approvedRequestId).toBe(21);
        expect(approval.requestApproval).toHaveBeenCalledTimes(1);
        expect(approval.claim).toHaveBeenCalledWith(21);
    });

    it('requestAndRun: claims its own approval even under FREE policy', async () => {
        const llm = scriptedLlm([{ content: 'ran', latency: 1, tokens: 1 } as AdapterResponse]);
        let status = 'PENDING';
        const approval = {
            list: vi.fn(async () => [
                {
                    id: 24,
                    agentId: 'a1',
                    toolName: 'computer.use',
                    toolInput: { task: 'do it' },
                    category: 'computer',
                    riskLevel: 'high',
                    status,
                    createdAt: Date.now(),
                },
            ]),
            getPolicy: vi.fn(async () => ({
                agentId: 'a1',
                preset: 'AUTOPILOT',
                executeMode: 'FREE',
                updatedAt: Date.now(),
            })),
            claim: vi.fn(async () => ({ id: 24, status: 'CONSUMED' })),
            requestApproval: vi.fn(async () => ({ id: 24, status: 'PENDING' })),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
            approval: approval as never,
        });
        setTimeout(() => {
            status = 'APPROVED';
        }, 60);
        const res = await svc.requestAndRun({
            agentId: 'a1',
            task: 'do it',
            approvalTimeoutMs: 5000,
            pollIntervalMs: 20,
        });
        expect(res.stopReason).toBe('done');
        // Заявка сожжена, хотя политика FREE (иначе осталась бы переиспользуемой).
        expect(approval.claim).toHaveBeenCalledWith(24);
    });

    it('requestAndRun: rejected/expired/timeout throw before any LLM call', async () => {
        const mk = (status: string) => {
            const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
            const approval = {
                list: vi.fn(async () => [
                    {
                        id: 22,
                        agentId: 'a1',
                        toolName: 'computer.use',
                        toolInput: { task: 'do it' },
                        category: 'computer',
                        riskLevel: 'high',
                        status,
                        createdAt: Date.now(),
                    },
                ]),
                getPolicy: vi.fn(async () => undefined),
                claim: vi.fn(async () => ({})),
                requestApproval: vi.fn(async () => ({ id: 22, status: 'PENDING' })),
            };
            const svc = new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: okExecutor() as never,
                approval: approval as never,
            });
            return { svc, llm };
        };
        await expect(
            mk('REJECTED').svc.requestAndRun({ agentId: 'a1', task: 'do it', pollIntervalMs: 20 }),
        ).rejects.toThrow(/was rejected/);
        await expect(
            mk('EXPIRED').svc.requestAndRun({ agentId: 'a1', task: 'do it', pollIntervalMs: 20 }),
        ).rejects.toThrow(/was expired/);
        const pending = mk('PENDING');
        await expect(
            pending.svc.requestAndRun({ agentId: 'a1', task: 'do it', approvalTimeoutMs: 300, pollIntervalMs: 30 }),
        ).rejects.toThrow(/timed out/);
        expect(pending.llm.chat).not.toHaveBeenCalled();
    });

    it('requestAndRun: blocked policy fails without bothering a human', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        const approval = {
            list: vi.fn(async () => []),
            getPolicy: vi.fn(async () => ({
                agentId: 'a1',
                preset: 'FULL_CONTROL',
                executeMode: 'REQUIRES_APPROVAL',
                toolOverrides: { 'computer.use': 'BLOCKED' },
                updatedAt: Date.now(),
            })),
            claim: vi.fn(async () => ({})),
            requestApproval: vi.fn(async () => ({ id: 23, status: 'PENDING' })),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
            approval: approval as never,
        });
        await expect(svc.requestAndRun({ agentId: 'a1', task: 'do it' })).rejects.toThrow(/blocked by approval policy/);
        expect(approval.requestApproval).not.toHaveBeenCalled();
        expect(llm.chat).not.toHaveBeenCalled();
    });

    it('passes provider + sessionId through to llm.chat', async () => {
        const seenOpts: unknown[] = [];
        const llm = {
            chat: vi.fn(async (messages: never, options?: unknown) => {
                seenOpts.push(options);
                void messages;
                return { content: 'ok', latency: 1, tokens: 1 };
            }),
        };
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
        });
        const res = await svc.run({
            agentId: 'a1',
            task: 'do it',
            requireApproval: false,
            provider: 'gemini-computer',
        });
        expect(res.stopReason).toBe('done');
        const o = seenOpts[0] as { provider?: string; cacheScope?: { agentId?: string; sessionId?: string } };
        expect(o.provider).toBe('gemini-computer');
        expect(typeof o.cacheScope?.sessionId).toBe('string');
        expect(o.cacheScope?.sessionId?.length).toBeGreaterThan(0);
    });

    it('binding: provider mismatch does not authorize the run', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        const mk = (approvedProvider: unknown) =>
            new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: okExecutor() as never,
                approval: {
                    list: vi.fn(async () => [
                        {
                            id: 13,
                            agentId: 'a1',
                            toolName: 'computer.use',
                            toolInput: { task: 'do it', ...(approvedProvider === undefined ? {} : { provider: approvedProvider }) },
                            category: 'computer',
                            riskLevel: 'high',
                            status: 'APPROVED',
                            createdAt: Date.now(),
                        },
                    ]),
                    claim: vi.fn(async () => ({ id: 13, status: 'CONSUMED' })),
                } as never,
            });
        // Approve под anthropic нельзя проиграть через gemini-путь.
        await expect(
            mk('anthropic').run({ agentId: 'a1', task: 'do it', approvedRequestId: 13, provider: 'gemini-computer' }),
        ).rejects.toThrow(/covers provider 'anthropic', not 'gemini-computer'/);
        expect(llm.chat).not.toHaveBeenCalled();
        // Совпадение — ок.
        const okSvc = mk('gemini-computer');
        const res = await okSvc.run({
            agentId: 'a1',
            task: 'do it',
            approvedRequestId: 13,
            provider: 'gemini-computer',
        });
        expect(res.stopReason).toBe('done');
        // Старые заявки без provider — только agent+tool+task.
        const legacy = await mk(undefined).run({ agentId: 'a1', task: 'do it', approvedRequestId: 13 });
        expect(legacy.stopReason).toBe('done');
    });

    it('HITL: requires a fresh APPROVED request by default', async () => {
        const llm = scriptedLlm([{ content: 'x', latency: 1, tokens: 1 } as AdapterResponse]);
        const mk = (approval: unknown) =>
            new ComputerUseLoopService({
                events: { emit: vi.fn() } as never,
                llm: llm as never,
                executor: okExecutor() as never,
                approval: approval as never,
            });
        await expect(
            mk(approvedList('APPROVED')).run({ agentId: 'a1', task: 'do it' }),
        ).rejects.toThrow(/approvedRequestId/);
        await expect(
            mk(approvedList('PENDING')).run({ agentId: 'a1', task: 'do it', approvedRequestId: 7 }),
        ).rejects.toThrow(/is PENDING/);
        await expect(
            mk(approvedList('APPROVED', 7, true)).run({ agentId: 'a1', task: 'do it', approvedRequestId: 7 }),
        ).rejects.toThrow(/expired/);
        await expect(
            mk({ list: vi.fn(async () => []) }).run({ agentId: 'a1', task: 'do it', approvedRequestId: 7 }),
        ).rejects.toThrow(/not found/);
        const res = await mk(approvedList('APPROVED')).run({ agentId: 'a1', task: 'do it', approvedRequestId: 7 });
        expect(res.stopReason).toBe('done');
    });
});

describe('ComputerUseLoopService P1 durable trail (run-level)', () => {
    function makeTrailedService(over: Record<string, unknown> = {}) {
        const trail: Array<Record<string, unknown>> = [];
        const llm = scriptedLlm([{ content: 'nothing to do', latency: 1, tokens: 5 } as AdapterResponse]);
        const svc = new ComputerUseLoopService({
            events: { emit: vi.fn() } as never,
            llm: llm as never,
            executor: okExecutor() as never,
            toolTrail: {
                record: async (entry: unknown) => {
                    trail.push(entry as Record<string, unknown>);
                },
            },
            ...over,
        } as never);
        return { svc, trail };
    }

    it('records BLOCKED-policy runs as denied', async () => {
        const { svc, trail } = makeTrailedService({
            approval: {
                getPolicy: async () => ({ toolOverrides: { 'computer.use': 'BLOCKED' } }),
                list: vi.fn(async () => []),
            },
        });
        await expect(svc.run(baseOpts({ requireApproval: false }))).rejects.toThrow(/blocked by approval policy/);
        expect(trail).toHaveLength(1);
        expect(trail[0]!['toolId']).toBe('computer.use');
        expect(trail[0]!['status']).toBe('denied');
        expect(trail[0]!['link']).toMatchObject({ agentId: 'a1' });
    });

    it('records missing-approval runs as denied', async () => {
        const { svc, trail } = makeTrailedService({
            approval: { list: vi.fn(async () => []) },
        });
        await expect(svc.run(baseOpts({ requireApproval: true }))).rejects.toThrow(
            /not found|approval required/i,
        );
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('denied');
    });

    it('records completed runs as success with a run id', async () => {
        const { svc, trail } = makeTrailedService();
        const res = await svc.run(baseOpts());
        expect(res.stopReason).toBe('done');
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('success');
        expect(trail[0]!['output']).toBe('nothing to do');
        const link = trail[0]!['link'] as Record<string, unknown>;
        expect(link['agentId']).toBe('a1');
        expect(typeof link['runId']).toBe('string');
    });

    it('records runApproved with unknown request as denied', async () => {
        const { svc, trail } = makeTrailedService({
            approval: { list: vi.fn(async () => []) },
        });
        await expect(svc.runApproved({ task: 'do it', approvedRequestId: 999 })).rejects.toThrow(
            /not found/,
        );
        expect(trail).toHaveLength(1);
        expect(trail[0]!['status']).toBe('denied');
    });
});
