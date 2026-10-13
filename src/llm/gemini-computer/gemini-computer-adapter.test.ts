/**
 * GeminiComputerAdapter tests — Gemini Computer Use (Interactions API).
 * Pure mapping + wire format со стабнутым fetch (ключа не нужно).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import {
    GeminiComputerAdapter,
    mapGeminiActionName,
    denormalizeArgs,
    buildFirstInput,
    buildFunctionResults,
    extractSteps,
    GEMINI_COMPUTER_DEFAULT_MODEL,
} from './gemini-computer-adapter';

const SESSION = 'sess-1';
const SIZE = { displayWidthPx: 1280, displayHeightPx: 800 };

function opts(extra: Record<string, unknown> = {}) {
    return {
        computerUse: SIZE,
        cacheScope: { agentId: 'a1', sessionId: SESSION },
        ...extra,
    };
}

describe('gemini-computer mapping', () => {
    it('maps action names to sidecar actions, unknown pass through', () => {
        expect(mapGeminiActionName('click_at')).toBe('left_click');
        expect(mapGeminiActionName('click')).toBe('left_click');
        expect(mapGeminiActionName('type_text_at')).toBe('type');
        expect(mapGeminiActionName('open_web_browser')).toBe('screenshot');
        expect(mapGeminiActionName('go_forward')).toBe('go_forward');
        expect(mapGeminiActionName('key_combination')).toBe('key');
        expect(mapGeminiActionName('drag_and_drop')).toBe('left_click_drag');
        expect(mapGeminiActionName('frobnicate')).toBe('frobnicate');
    });

    it('denormalizes 0..1000 coordinates to absolute pixels', () => {
        const { args, safetyNote } = denormalizeArgs(
            { x: 500, y: 250, text: 'hi', press_enter: true },
            1280,
            800,
        );
        expect(args).toMatchObject({ x: 640, y: 200, text: 'hi', press_enter: true });
        expect(safetyNote).toBeUndefined();
    });

    it('strips safety_decision into a note', () => {
        const { args, safetyNote } = denormalizeArgs(
            { x: 1, safety_decision: { explanation: 'Must check check-box', decision: 'require_confirmation' } },
            1280,
            800,
        );
        expect(args).not.toHaveProperty('safety_decision');
        expect(safetyNote).toBe('Must check check-box');
    });

    it('buildFirstInput merges system text + images', () => {
        const single = buildFirstInput([{ role: 'user', content: 'go' }]);
        expect(single).toBe('go');
        const multi = buildFirstInput([
            { role: 'system', content: 'sys' },
            { role: 'user', content: 'go', inlineData: [{ mimeType: 'image/png', data: 'shot' }] },
            { role: 'tool', content: 'stale', toolCallId: 't' },
        ]) as Array<Record<string, unknown>>;
        expect(multi).toHaveLength(3);
        expect(multi[2]).toMatchObject({ type: 'image', mime_type: 'image/png' });
    });

    it('buildFunctionResults takes only tool messages after last assistant', () => {
        expect(
            buildFunctionResults([
                { role: 'user', content: 'go' },
                { role: 'assistant', content: '', toolCalls: [] },
            ]),
        ).toBeNull();
        const res = buildFunctionResults([
            { role: 'user', content: 'go' },
            { role: 'assistant', content: '', toolCalls: [{ id: 'c1', type: 'computer_20250124', function: { name: 'left_click', arguments: '{}' } }] },
            { role: 'tool', content: 'clicked', toolCallId: 'c1', inlineData: [{ mimeType: 'image/png', data: 's' }] },
        ]);
        expect(res).toHaveLength(1);
        expect(res?.[0]).toMatchObject({ type: 'function_result', call_id: 'c1' });
        const result = (res?.[0]?.['result'] ?? []) as Array<Record<string, unknown>>;
        expect(result[1]).toMatchObject({ type: 'image', data: 's' });
    });

    it('extractSteps joins model_output text and types calls', () => {
        const { text, calls, blockedNotes } = extractSteps(
            [
                { type: 'model_output', content: [{ text: 'Hel' }, { text: 'lo' }] },
                { type: 'function_call', id: 'fc1', name: 'click_at', arguments: { x: 1000, y: 500 } },
                {
                    type: 'function_call',
                    id: 'fc2',
                    name: 'click_at',
                    arguments: { x: 1, safety_decision: { decision: 'require_confirmation', explanation: 'captcha' } },
                },
            ],
            1280,
            800,
        );
        expect(text).toBe('Hello');
        expect(calls).toHaveLength(1);
        expect(calls[0]).toMatchObject({ callId: 'fc1', name: 'click_at' });
        expect(calls[0]?.args).toMatchObject({ x: 1279, y: 400 });
        expect(blockedNotes).toEqual(['captcha']);
    });
});

describe('gemini-computer wire format', () => {
    const realFetch = globalThis.fetch;

    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        globalThis.fetch = realFetch;
        vi.unstubAllGlobals();
    });

    it('turn 1 posts text input + computer_use tool with x-goog-api-key', async () => {
        const seen: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                seen.push({
                    url,
                    headers: init?.headers as Record<string, string>,
                    body: JSON.parse(String(init?.body)) as Record<string, unknown>,
                });
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        id: 'i-1',
                        steps: [
                            { type: 'function_call', id: 'fc-1', name: 'click_at', arguments: { x: 500, y: 500 } },
                        ],
                    }),
                };
            }) as unknown as typeof fetch,
        );
        const adapter = new GeminiComputerAdapter();
        const res = await adapter.doSendMessage([{ role: 'user', content: 'click center' }], 'auto', 'AIza-test', opts(), undefined);
        assert.equal(seen.length, 1);
        expect(seen[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
        expect(seen[0].headers['x-goog-api-key']).toBe('AIza-test');
        expect(seen[0].headers['authorization']).toBeUndefined();
        expect(seen[0].body['model']).toBe(GEMINI_COMPUTER_DEFAULT_MODEL);
        expect(seen[0].body['input']).toBe('click center');
        expect(seen[0].body['tools']).toMatchObject([
            { type: 'computer_use', environment: 'browser', enable_prompt_injection_detection: true },
        ]);
        expect(res.toolCalls).toHaveLength(1);
        expect(res.toolCalls?.[0]).toMatchObject({
            id: 'fc-1',
            type: 'computer_20250124',
            function: { name: 'left_click' },
        });
        expect(JSON.parse(res.toolCalls?.[0]?.function.arguments ?? '{}')).toMatchObject({
            action: 'left_click',
            x: 640,
            y: 400,
        });
        expect(res.finishReason).toBe('TOOL_CALLS');
    });

    it('turn 2 chains previous_interaction_id with function_results', async () => {
        const bodies: Record<string, unknown>[] = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (_url: string, init?: RequestInit) => {
                const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
                bodies.push(body);
                if (bodies.length === 1) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            id: 'i-9',
                            steps: [{ type: 'function_call', id: 'fc-9', name: 'click', arguments: { x: 100, y: 100 } }],
                        }),
                    };
                }
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        id: 'i-10',
                        steps: [{ type: 'model_output', content: [{ text: 'done' }] }],
                    }),
                };
            }) as unknown as typeof fetch,
        );
        const adapter = new GeminiComputerAdapter();
        const first = await adapter.doSendMessage([{ role: 'user', content: 'go' }], 'auto', 'k', opts(), undefined);
        expect(first.toolCalls).toHaveLength(1);
        const second = await adapter.doSendMessage(
            [
                { role: 'user', content: 'go' },
                { role: 'assistant', content: '', toolCalls: first.toolCalls },
                { role: 'tool', content: 'clicked', toolCallId: 'fc-9', inlineData: [{ mimeType: 'image/png', data: 'shot2' }] },
            ],
            'auto',
            'k',
            opts(),
            undefined,
        );
        expect(bodies[1]?.['previous_interaction_id']).toBe('i-9');
        const input = bodies[1]?.['input'] as Array<Record<string, unknown>>;
        expect(input[0]).toMatchObject({ type: 'function_result', call_id: 'fc-9' });
        const result = (input[0]?.['result'] ?? []) as Array<Record<string, unknown>>;
        expect(result[1]).toMatchObject({ type: 'image', data: 'shot2' });
        expect(second.content).toBe('done');
        expect(second.toolCalls).toBeUndefined();
        expect(second.finishReason).toBe('STOP');
    });

    it('continuation without chain throws a clear error', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch,
        );
        const adapter = new GeminiComputerAdapter();
        await expect(
            adapter.doSendMessage(
                [
                    { role: 'user', content: 'go' },
                    { role: 'assistant', content: '', toolCalls: [] },
                    { role: 'tool', content: 'stale', toolCallId: 'x' },
                ],
                'auto',
                'k',
                { computerUse: SIZE },
                undefined,
            ),
        ).rejects.toThrow(/chained interaction/);
    });

    it('safety require_confirmation ends the turn with a note, no calls', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                status: 200,
                json: async () => ({
                    id: 'i-s',
                    steps: [
                        {
                            type: 'function_call',
                            id: 'fc-s',
                            name: 'click_at',
                            arguments: { x: 1, safety_decision: { decision: 'require_confirmation', explanation: 'captcha' } },
                        },
                    ],
                }),
            })) as unknown as typeof fetch,
        );
        const adapter = new GeminiComputerAdapter();
        const res = await adapter.doSendMessage([{ role: 'user', content: 'go' }], 'auto', 'k', opts(), undefined);
        expect(res.toolCalls).toBeUndefined();
        expect(res.content).toMatch(/blocked by safety policy: captcha/);
        expect(res.finishReason).toBe('OTHER');
    });
});
