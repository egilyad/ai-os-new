import { describe, it, expect, vi } from 'vitest';
import { runToolLoop } from './tool-loop';
import type { ToolCall } from '../../types/llm-types';

function call(id: string, name: string, args = '{}'): ToolCall {
    return { id, type: 'function', function: { name, arguments: args } };
}

const TOOLS = [
    { name: 'workspace.read', description: 'read', parameters: { type: 'object', properties: {} } },
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
                return { content: '', toolCalls: [call('c1', 'workspace.read', '{"path":"a.ts"}')] };
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

    it('survives a malformed arguments payload', async () => {
        const runTool = vi.fn().mockResolvedValue('ok');
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
        });
        expect(runTool).toHaveBeenCalledWith('workspace.read', {});
        expect(res.content).toBe('done');
    });
});
