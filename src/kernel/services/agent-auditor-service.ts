import type { AdapterMessage, ILLMClientService } from '../contracts/provider-adapter';
import { defaultContainer } from '../container';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentAuditor');

export interface AuditSourceRef {
    id: string;
    title?: string;
    snippet?: string;
}

export interface AuditInput {
    claim: string;
    sources: AuditSourceRef[];
    agentId?: string;
    sessionId?: string;
    model?: string;
    maxTokens?: number;
}

export type AuditVerdict = 'consistent' | 'contradicted' | 'unverifiable' | 'error';

export interface AuditResult {
    verdict: AuditVerdict;
    confidence: number;
    reasoning: string;
    checkedAt: number;
}

/**
 * P1-3: agent-auditor — an independent LLM cross-check of a conclusion
 * against the source snippets it claims to derive from. It runs with its own
 * cacheScope (separate from the producer) so it is not biased by the cached
 * reasoning that formed the conclusion.
 */
export class AgentAuditorService {
    async audit(input: AuditInput): Promise<AuditResult> {
        const client = defaultContainer.getOptional<ILLMClientService>('llmClientService');
        if (!client) throw new Error('AgentAuditorService: llmClientService unavailable');

        const system =
            'You are an independent auditor. Verify the claim using ONLY the provided ' +
            'source snippets. Respond as a single JSON object with keys: verdict ' +
            '("consistent" | "contradicted" | "unverifiable"), confidence (0..1), reasoning (short).';
        const user = [
            `Claim: ${input.claim}`,
            '',
            'Sources:',
            ...input.sources.map(
                (s, i) =>
                    `${i + 1}. [${s.id}] ${s.title ?? ''}\n${(s.snippet ?? '').slice(0, 1500)}`,
            ),
        ].join('\n');

        const messages: AdapterMessage[] = [
            { role: 'system', content: system.slice(0, 6000) },
            { role: 'user', content: user.slice(0, 20000) },
        ];

        try {
            const res = await client.chat(messages, {
                model: input.model,
                temperature: 0,
                maxTokens: input.maxTokens ?? 512,
                cacheScope: {
                    agentId: input.agentId ?? 'auditor',
                    sessionId: input.sessionId,
                    role: 'auditor',
                },
            });
            if (res.error) throw new Error(`LLM error: ${res.error}`);
            return { ...parseAuditJson(res.content), checkedAt: Date.now() };
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            LOGGER.warn('AgentAuditor', 'audit failed', { error: message });
            return { verdict: 'error', confidence: 0, reasoning: message, checkedAt: Date.now() };
        }
    }
}

function parseAuditJson(
    content: string,
): { verdict: AuditVerdict; confidence: number; reasoning: string } {
    try {
        const obj = JSON.parse(content) as {
            verdict?: unknown;
            confidence?: unknown;
            reasoning?: unknown;
        };
        const verdict = typeof obj.verdict === 'string' ? (obj.verdict as AuditVerdict) : 'unverifiable';
        const confidence =
            typeof obj.confidence === 'number' ? Math.min(1, Math.max(0, obj.confidence)) : 0.5;
        const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : '';
        return { verdict, confidence, reasoning };
    } catch {
        return { verdict: 'unverifiable', confidence: 0.5, reasoning: content.slice(0, 500) };
    }
}

export const agentAuditorService = new AgentAuditorService();
