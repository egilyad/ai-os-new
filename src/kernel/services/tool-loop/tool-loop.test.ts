import { describe, it, expect, vi } from 'vitest';
import { runToolLoop } from './tool-loop';
import type { ToolCall } from '../../types/llm-types';

function call(id: string, name: string, args = '{}'): ToolCall {
    return { id, type: 'function', function: { name, arguments: args } };
}

const TOOLS = [
    { name: 'workspace.read', description: 'read', parameters: { type: 'object', properties: {} } },
    { name: 'search.web', description: 'search', parameters: { type: 'object', properties: {} } },
];

describe('runToolLoop', () => {
    it('returns the answer when the model does not call tools', async () => {
        const call_ = vi.fn().mockResolvedValue({ content: 'done' });
        const res = await runToolLoop([{ role: 'user', content: 'hi' }], call_, {
            tools: TOOLS,
            runTool: vi.fn(),
        });
        expect(res.content).toBe('done');
        expect(res.toolCalls).toHaveLength(0);
        expect(res.rounds).toBe(1);
    });

    it('executes the tool and feeds the result back', async () => {
        const runTool = vi.fn().mockResolvedValue('file contents');
        const onToolCall = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round === 1) {
                return {
                    content: '',
                    toolCalls: [call('c1', 'workspace.read', '{"path":"a.ts"}')],
                };
            }
            return { content: 'the file says hello' };
        });

        const res = await runToolLoop([{ role: 'user', content: 'read a.ts' }], call_, {
            tools: TOOLS,
            runTool,
            onToolCall,
        });

        expect(runTool).toHaveBeenCalledWith('workspace.read', { path: 'a.ts' });
        expect(res.content).toBe('the file says hello');
        expect(res.toolCalls).toEqual(['workspace.read']);
        expect(res.rounds).toBe(2);
        expect(onToolCall).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'workspace.read', ok: true, output: 'file contents' }),
        );
        // The tool result must be part of the conversation the model sees.
        const toolTurn = res.messages.find((m) => m.role === 'tool');
        expect(toolTurn?.content).toBe('file contents');
        expect(toolTurn?.toolCallId).toBe('c1');
    });

    it('reports a failing tool to the model instead of aborting', async () => {
        const runTool = vi.fn().mockRejectedValue(new Error('denied by policy'));
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round === 1) {
                return { content: '', toolCalls: [call('c1', 'workspace.read')] };
            }
            return { content: 'I could not read it' };
        });

        const res = await runToolLoop([{ role: 'user', content: 'read' }], call_, {
            tools: TOOLS,
            runTool,
        });

        expect(res.content).toBe('I could not read it');
        const toolTurn = res.messages.find((m) => m.role === 'tool');
        expect(toolTurn?.content).toContain('denied by policy');
    });

    it('stops at maxRounds even if the model keeps calling tools', async () => {
        const call_ = vi.fn().mockResolvedValue({
            content: '',
            toolCalls: [call('c1', 'workspace.read')],
        });
        const res = await runToolLoop([{ role: 'user', content: 'loop' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 3,
        });
        expect(call_).toHaveBeenCalledTimes(3);
        expect(res.rounds).toBe(3);
    });

    it('stops when the signal is aborted', async () => {
        const controller = new AbortController();
        const call_ = vi.fn().mockImplementation(async () => {
            controller.abort();
            return { content: 'partial', toolCalls: [] };
        });
        const res = await runToolLoop([{ role: 'user', content: 'x' }], call_, {
            tools: TOOLS,
            runTool: vi.fn(),
            signal: controller.signal,
        });
        expect(res.content).toBe('partial');
    });

    it('does not invoke a tool with malformed arguments (W8-009)', async () => {
        const runTool = vi.fn().mockResolvedValue('ok');
        const onToolCall = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round === 1) {
                return { content: '', toolCalls: [call('c1', 'workspace.read', 'not json')] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'x' }], call_, {
            tools: TOOLS,
            runTool,
            onToolCall,
        });
        expect(runTool).not.toHaveBeenCalled();
        expect(onToolCall).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'workspace.read', ok: false }),
        );
        const toolTurn = res.messages.find((m) => m.role === 'tool');
        expect(toolTurn?.content).toContain('invalid JSON tool arguments');
        expect(res.content).toBe('done');
    });

    it('loop guard intervenes when the same tool repeats (sameToolLimit)', async () => {
        const onGuardIntervention = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 3) {
                return { content: '', toolCalls: [call(`c${round}`, 'workspace.read')] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'read' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 5,
            onGuardIntervention,
        });

        expect(res.guardInterventions).toBe(1);
        expect(onGuardIntervention).toHaveBeenCalledWith({
            kind: 'same-tool',
            name: 'workspace.read',
            count: 3,
        });
        const guardTurn = res.messages.find(
            (m) => m.role === 'tool' && m.content.includes('loop guard'),
        );
        expect(guardTurn?.content).toContain('workspace.read');
        expect(guardTurn?.content).toContain('3 times in a row');
        expect(res.content).toBe('done');
        expect(call_).toHaveBeenCalledTimes(4);
    });

    it('loop guard does not fire when the model alternates tools', async () => {
        const onGuardIntervention = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 6) {
                const name = round % 2 === 1 ? 'workspace.read' : 'search.web';
                return { content: '', toolCalls: [call(`c${round}`, name)] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'x' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 8,
            onGuardIntervention,
        });

        expect(res.guardInterventions).toBe(0);
        expect(onGuardIntervention).not.toHaveBeenCalled();
    });

    it('loop guard intervenes on total call volume (totalToolLimit)', async () => {
        const onGuardIntervention = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 4) {
                const name = round % 2 === 1 ? 'workspace.read' : 'search.web';
                return { content: '', toolCalls: [call(`c${round}`, name)] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'x' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 6,
            totalToolLimit: 4,
            onGuardIntervention,
        });

        expect(res.guardInterventions).toBe(1);
        expect(onGuardIntervention).toHaveBeenCalledWith({
            kind: 'total-calls',
            count: 4,
        });
        const guardTurn = res.messages.find(
            (m) => m.role === 'tool' && m.content.includes('loop guard'),
        );
        expect(guardTurn?.content).toContain('4 tool calls');
    });

    it('loop guard can be disabled with a zero limit', async () => {
        const onGuardIntervention = vi.fn();
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 4) {
                return { content: '', toolCalls: [call(`c${round}`, 'workspace.read')] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'read' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 6,
            sameToolLimit: 0,
            totalToolLimit: 0,
            onGuardIntervention,
        });

        expect(res.guardInterventions).toBe(0);
        expect(onGuardIntervention).not.toHaveBeenCalled();
    });

    it('uses the mentor guidance when one is provided', async () => {
        const mentor = vi.fn().mockResolvedValue('mentor: switch to a different tool now');
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 3) {
                return { content: '', toolCalls: [call(`c${round}`, 'workspace.read')] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'read' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 5,
            mentor,
        });

        expect(mentor).toHaveBeenCalledTimes(1);
        expect(mentor).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'same-tool', name: 'workspace.read', count: 3 }),
        );
        const guardTurn = res.messages.find(
            (m) => m.role === 'tool' && m.content.includes('mentor'),
        );
        expect(guardTurn?.content).toBe('mentor: switch to a different tool now');
    });

    it('falls back to the fixed text when the mentor throws', async () => {
        const mentor = vi.fn().mockRejectedValue(new Error('LLM down'));
        let round = 0;
        const call_ = vi.fn().mockImplementation(async () => {
            round += 1;
            if (round <= 3) {
                return { content: '', toolCalls: [call(`c${round}`, 'workspace.read')] };
            }
            return { content: 'done' };
        });
        const res = await runToolLoop([{ role: 'user', content: 'read' }], call_, {
            tools: TOOLS,
            runTool: vi.fn().mockResolvedValue('x'),
            maxRounds: 5,
            mentor,
        });

        expect(res.guardInterventions).toBe(1);
        const guardTurn = res.messages.find(
            (m) => m.role === 'tool' && m.content.includes('loop guard'),
        );
        expect(guardTurn?.content).toContain('workspace.read');
    });
});
