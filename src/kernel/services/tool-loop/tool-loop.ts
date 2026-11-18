/**
 * Tool loop — the shared "LLM → tool calls → execute → LLM" driver.
 *
 * Provider-agnostic on purpose: the caller supplies a `call` function, so the
 * same loop drives the chat path (streaming through the event bus) and the
 * non-streaming `ToolRunnerService.runWithTools()`.
 *
 *  Rules:
 *  - the loop never invents a tool: a call for an unknown tool comes back as
 *    an error string the model can react to;
 *  - a failing tool is reported to the model instead of aborting the turn —
 *    the model decides what to do next;
 *  - `maxRounds` bounds the loop, so a model that keeps calling tools cannot
 *    spin forever;
 *  - the loop guard (inspired by PentAGI's execution monitor) watches the
 *    tool-call pattern and injects an intervention message when the model
 *    repeats the same tool too many times in a row or makes too many total
 *    calls without finishing — before the round cap is hit.
 */
import type { ToolCall } from '../../types/llm-types';
import { redactPii } from '../../utils/pii-redact';

export interface ToolLoopTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface ToolLoopMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    /** Preserved from the provider so Anthropic computer-use survives. */
    toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
    toolCallId?: string;
}

export interface ToolLoopCallResult {
    content: string;
    toolCalls?: ToolCall[];
}

export interface ToolLoopToolCallInfo {
    name: string;
    args: Record<string, unknown>;
    ok: boolean;
    output: string;
}

export interface ToolLoopGuardIntervention {
    kind: 'same-tool' | 'total-calls';
    /** Tool name for same-tool interventions. */
    name?: string;
    /** The count that crossed the threshold. */
    count: number;
}

export interface ToolLoopOptions {
    /** Tools the model may call. */
    tools: ToolLoopTool[];
    /** Executes a tool call and returns its textual result. */
    runTool(name: string, args: Record<string, unknown>): Promise<string>;
    /** Maximum LLM round-trips. Default 4. */
    maxRounds?: number;
    /** Progress callback (the UI shows the call). */
    onToolCall?(info: ToolLoopToolCallInfo): void;
    /** Abort signal — checked between rounds and before each tool call. */
    signal?: AbortSignal;
    /** Intervene when the model repeats the same tool this many times in a row (0 disables). Default 3. */
    sameToolLimit?: number;
    /** Intervene after this many total tool calls made since the last intervention (0 disables). Default 8. */
    totalToolLimit?: number;
    /** Called when the loop guard intervenes. */
    onGuardIntervention?(info: ToolLoopGuardIntervention): void;
}

export interface ToolLoopResult {
    /** Final assistant text. */
    content: string;
    /** The conversation including the tool turns. */
    messages: ToolLoopMessage[];
    /** Names of the tools that were called. */
    toolCalls: string[];
    /** How many LLM round-trips happened. */
    rounds: number;
    /** How many times the loop guard intervened. */
    guardInterventions: number;
}

const MAX_TOOL_OUTPUT = 6000;

/**
 * Run the agentic loop.
 *
 * @param call performs one LLM round-trip; it receives the conversation and
 *             the tool schemas and returns the provider answer.
 */
export async function runToolLoop(
    messages: ToolLoopMessage[],
    call: (messages: ToolLoopMessage[], tools: ToolLoopTool[]) => Promise<ToolLoopCallResult>,
    opts: ToolLoopOptions,
): Promise<ToolLoopResult> {
    const maxRounds = Math.max(1, Math.min(8, opts.maxRounds ?? 4));
    const sameToolLimit = Math.max(0, opts.sameToolLimit ?? 3);
    const totalToolLimit = Math.max(0, opts.totalToolLimit ?? 8);
    const conversation: ToolLoopMessage[] = [...messages];
    const used: string[] = [];
    let content = '';
    let rounds = 0;
    let sameToolName = '';
    let sameToolCount = 0;
    let totalToolCalls = 0;
    let totalBaseline = 0;
    let guardInterventions = 0;

    for (let round = 0; round < maxRounds; round++) {
        if (opts.signal?.aborted) break;
        rounds = round + 1;
        const res = await call(conversation, opts.tools);
        content = res.content ?? '';
        const calls = res.toolCalls ?? [];
        if (calls.length === 0) break;

        conversation.push({
            role: 'assistant',
            content,
            toolCalls: calls.map((c) => ({
                id: c.id,
                type: c.type,
                function: c.function,
            })),
        });

        for (const c of calls) {
            if (opts.signal?.aborted) break;
            // W8-009 / W4-027: never pass unvalidated LLM JSON straight to a
            // tool. Malformed or non-object arguments are reported back to the
            // loop as an error string (the model can react to it) instead of
            // silently invoking the tool with `{}`.
            let args: Record<string, unknown>;
            let parseError: string | null = null;
            try {
                const parsed: unknown = JSON.parse(c.function.arguments || '{}');
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    args = parsed as Record<string, unknown>;
                } else {
                    throw new Error('tool arguments must be a JSON object');
                }
            } catch (e) {
                parseError = e instanceof Error ? e.message : String(e);
                args = {};
            }
            let output: string;
            let ok = true;
            if (parseError !== null) {
                ok = false;
                output = `ERROR: invalid JSON tool arguments for ${c.function.name}: ${parseError}`;
            } else {
                try {
                    output = await opts.runTool(c.function.name, args);
                } catch (e) {
                    ok = false;
                    output = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
                }
            }
            used.push(c.function.name);
            opts.onToolCall?.({ name: c.function.name, args, ok, output });
            totalToolCalls += 1;
            if (c.function.name === sameToolName) {
                sameToolCount += 1;
            } else {
                sameToolName = c.function.name;
                sameToolCount = 1;
            }
            // W4-022: never re-inject raw (possibly prompt-injected) tool output
            // into the agent context — redact PII before storing the turn.
            const safeOutput = redactPii(output.slice(0, MAX_TOOL_OUTPUT));
            conversation.push({
                role: 'tool',
                content: safeOutput,
                toolCallId: c.id,
            });
        }

        // Loop guard: watch the tool-call pattern and steer the model before
        // the round cap is hit (same-tool repetition / total-call volume).
        // Inspired by PentAGI's execution monitor.
        if (!opts.signal?.aborted) {
            let intervened = false;
            if (sameToolLimit > 0 && sameToolCount >= sameToolLimit) {
                intervened = true;
                opts.onGuardIntervention?.({
                    kind: 'same-tool',
                    name: sameToolName,
                    count: sameToolCount,
                });
                conversation.push({
                    role: 'tool',
                    content: `loop guard: you have called "${sameToolName}" ${sameToolCount} times in a row without adapting; step back, switch approach, or summarize what is done and what remains unfinished`,
                });
                sameToolName = '';
                sameToolCount = 0;
            } else if (totalToolLimit > 0 && totalToolCalls - totalBaseline >= totalToolLimit) {
                intervened = true;
                opts.onGuardIntervention?.({
                    kind: 'total-calls',
                    count: totalToolCalls - totalBaseline,
                });
                conversation.push({
                    role: 'tool',
                    content: `loop guard: you have made ${totalToolCalls - totalBaseline} tool calls since the last intervention without finishing; summarize progress or change strategy`,
                });
                totalBaseline = totalToolCalls;
            }
            if (intervened) guardInterventions += 1;
        }

        // M0.6 — round-cap awareness: if the budget is exhausted and the model
        // still wants to act, tell it to summarize unfinished work.
        if (round === maxRounds - 1 && calls.length > 0 && !opts.signal?.aborted) {
            conversation.push({
                role: 'tool',
                content:
                    'you have reached the round cap; summarize what is done and what remains unfinished',
            });
        }
    }

    return { content, messages: conversation, toolCalls: used, rounds, guardInterventions };
}
