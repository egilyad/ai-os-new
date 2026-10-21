/**
 * Tool loop — the shared "LLM → tool calls → execute → LLM" driver.
 *
 * Provider-agnostic on purpose: the caller supplies a `call` function, so the
 * same loop drives the chat path (streaming through the event bus) and the
 * non-streaming `ToolRunnerService.runWithTools()`.
 *
 * Rules:
 *  - the loop never invents a tool: a call for an unknown tool comes back as
 *    an error string the model can react to;
 *  - a failing tool is reported to the model instead of aborting the turn —
 *    the model decides what to do next;
 *  - `maxRounds` bounds the loop, so a model that keeps calling tools cannot
 *    spin forever.
 */
import type { ToolCall } from '../../types/llm-types';

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
    call: (
        messages: ToolLoopMessage[],
        tools: ToolLoopTool[],
    ) => Promise<ToolLoopCallResult>,
    opts: ToolLoopOptions,
): Promise<ToolLoopResult> {
    const maxRounds = Math.max(1, Math.min(8, opts.maxRounds ?? 4));
    const conversation: ToolLoopMessage[] = [...messages];
    const used: string[] = [];
    let content = '';
    let rounds = 0;

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
            let args: Record<string, unknown>;
            try {
                args = JSON.parse(c.function.arguments || '{}') as Record<string, unknown>;
            } catch {
                args = {};
            }
            let output: string;
            let ok = true;
            try {
                output = await opts.runTool(c.function.name, args);
            } catch (e) {
                ok = false;
                output = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
            }
            used.push(c.function.name);
            opts.onToolCall?.({ name: c.function.name, args, ok, output });
            conversation.push({
                role: 'tool',
                content: output.slice(0, MAX_TOOL_OUTPUT),
                toolCallId: c.id,
            });
        }
    }

    return { content, messages: conversation, toolCalls: used, rounds };
}
