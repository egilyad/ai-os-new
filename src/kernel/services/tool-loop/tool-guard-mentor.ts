/**
 * Tool guard mentor — an optional LLM-backed steering layer for the tool loop
 * (inspired by PentAGI's execution monitor / adviser agent).
 *
 * When the loop guard detects a stuck pattern (same tool repeated, or too many
 * calls without finishing), the loop may ask the mentor for a concrete,
 * context-aware directive instead of injecting a fixed string. If no LLM
 * client is available or the call fails, the mentor falls back to the same
 * deterministic guidance text.
 */
import type { ILLMClientService, AdapterMessage } from '../../contracts/provider-adapter';
import type { ToolLoopToolCallInfo } from './tool-loop-types';

export interface ToolLoopMentorContext {
    kind: 'same-tool' | 'total-calls';
    /** Tool name for same-tool interventions. */
    name?: string;
    /** The count that crossed the threshold. */
    count: number;
    /** The original user request the loop is working on. */
    userPrompt: string;
    /** Recent tool calls observed by the loop. */
    recentCalls: ToolLoopToolCallInfo[];
}

export type ToolLoopMentor = (ctx: ToolLoopMentorContext) => Promise<string>;

export interface ToolGuardMentorOptions {
    client?: ILLMClientService;
    defaultModel?: string;
    systemPrompt?: string;
}

const FALLBACK_SAME_TOOL = (name: string, count: number) =>
    `loop guard: you have called "${name}" ${count} times in a row without adapting; step back, switch approach, or summarize what is done and what remains unfinished`;

const FALLBACK_TOTAL = (count: number) =>
    `loop guard: you have made ${count} tool calls since the last intervention without finishing; summarize progress or change strategy`;

export function fallbackMentorText(ctx: ToolLoopMentorContext): string {
    return ctx.kind === 'same-tool'
        ? FALLBACK_SAME_TOOL(ctx.name ?? 'unknown tool', ctx.count)
        : FALLBACK_TOTAL(ctx.count);
}

function buildSystemPrompt(opts: ToolGuardMentorOptions): string {
    return (
        opts.systemPrompt ??
        'You are the mentor of an AI agent running a tool loop. ' +
            'The agent appears stuck (repeating a tool or spinning without progress). ' +
            'Reply with ONE short, actionable directive (max 3 sentences) guiding the agent ' +
            'to either switch strategy, use a different tool, or summarize and stop. ' +
            'Do not repeat the problem back; just tell the agent what to do next.'
    );
}

function buildUserContent(ctx: ToolLoopMentorContext): string {
    const lines: string[] = [];
    lines.push(`User request: ${ctx.userPrompt.slice(0, 800)}`);
    lines.push('');
    if (ctx.kind === 'same-tool') {
        lines.push(
            `Problem: called tool "${ctx.name}" ${ctx.count} times in a row without adapting.`,
        );
    } else {
        lines.push(
            `Problem: made ${ctx.count} tool calls since the last intervention without finishing.`,
        );
    }
    lines.push('');
    lines.push('Recent tool calls:');
    for (const c of ctx.recentCalls.slice(-8)) {
        const status = c.ok ? 'ok' : 'ERROR';
        lines.push(`- ${c.name} (${status}): ${c.output.slice(0, 120)}`);
    }
    return lines.join('\n');
}

export function createToolGuardMentor(opts: ToolGuardMentorOptions = {}): ToolLoopMentor {
    const { client, defaultModel } = opts;
    const system = buildSystemPrompt(opts);

    return async (ctx: ToolLoopMentorContext): Promise<string> => {
        if (!client) return fallbackMentorText(ctx);
        try {
            const messages: AdapterMessage[] = [
                { role: 'system', content: system.slice(0, 4000) },
                { role: 'user', content: buildUserContent(ctx).slice(0, 6000) },
            ];
            const res = await client.chat(messages, {
                model: defaultModel,
                temperature: 0.3,
                maxTokens: 300,
            });
            if (res.error) return fallbackMentorText(ctx);
            const text = (res.content ?? '').trim();
            if (!text) return fallbackMentorText(ctx);
            return text.slice(0, 800);
        } catch {
            return fallbackMentorText(ctx);
        }
    };
}
