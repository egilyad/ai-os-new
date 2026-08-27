import type {
    ShadowCritique,
    IShadowOpponentService,
} from '../../contracts/debate-shadow-opponent';

const CRITIQUE_SEPARATOR = '=== CRITIQUE ===';
const STRENGTHENED_SEPARATOR = '=== STRENGTHENED ===';

/**
 * P0.2 Shadow Opponent Simulation.
 *
 * After an agent produces a draft response, this service sends it back to
 * the same LLM with a meta-prompt: "Critique this as the strongest opponent,
 * then rewrite it stronger." The LLM returns both critique and strengthened
 * version in one additional call (~1.5x latency).
 *
 * Results are discarded if the debate is cancelled mid-call.
 */
export class ShadowOpponentService implements IShadowOpponentService {
    async strengthenArgument(
        draftContent: string,
        systemPrompt: string,
        _agentId: string,
        agentName: string,
        adapter: {
            sendMessage(
                messages: Array<{ role: string; content: string }>,
                model: string,
                key: string,
                signal: AbortSignal,
            ): Promise<{ content: string }>;
        },
        modelId: string,
        apiKey: string,
        signal: AbortSignal,
        language = 'Russian',
    ): Promise<ShadowCritique | null> {
        if (draftContent.trim().length < 50) return null;
        if (signal.aborted) return null;

        // Extract the agent's role context from the system prompt (first ~300 chars
        // contain the "Your Role" + "Your Character" + "Your Unique Lens" blocks).
        // This ensures the critique/strengthen maintains role-specific perspective.
        const roleContext = systemPrompt
            ? systemPrompt
                  .replace(/<[^>]*>/g, '')
                  .replace(/## Topic:.*?(?=## Your Role|$)/s, '')
                  .slice(0, 300)
                  .trim()
            : '';

        const langInstruction =
            language === 'Russian'
                ? `Ты — ${agentName}. Твоя роль: ${roleContext || 'участник дебатов'}. Но сейчас ты — самый сильный оппонент самого себя. Сохраняй свою экспертизу и уникальный угол зрения.`
                : `You are ${agentName}. Your role: ${roleContext || 'debate participant'}. But right now you are your own strongest opponent. Maintain your expertise and unique lens.`;

        const critiquePrompt = `${langInstruction}

Прочитай свой предыдущий аргумент. Найди в нём ровно ОДНУ слабость — самое уязвимое место.

=== КРИТИКА ===
Напиши короткую критику (2-3 предложения) от лица оппонента. Будь беспощаден, но краток. Критикуй с точки зрения своей экспертизы.

=== УСИЛЕНИЕ ===
Теперь перепиши свой исходный аргумент, закрыв эту слабость. Добавь контр-аргумент или уточнение. Сохрани общую позицию, но сделай её неуязвимее. Усиление должно отражать твою уникальную экспертизу и угол зрения.

ОТВЕЧАЙ ТОЛЬКО В ЭТОМ ФОРМАТЕ:

${CRITIQUE_SEPARATOR}
[твоя критика]

${STRENGTHENED_SEPARATOR}
[усиленный аргумент]`;

        try {
            const startedAt = performance.now();
            const result = await adapter.sendMessage(
                [
                    {
                        role: 'user',
                        content: `Вот мой аргумент:\n\n"""\n${draftContent.slice(0, 2000)}\n"""\n\n${critiquePrompt}`,
                    },
                ],
                modelId,
                apiKey,
                signal,
            );
            const latencyMs = Math.round(performance.now() - startedAt);

            if (!result.content || signal.aborted) return null;

            const critique = this._extractSection(result.content, CRITIQUE_SEPARATOR);
            const strengthened = this._extractSection(result.content, STRENGTHENED_SEPARATOR);

            if (!strengthened || strengthened.trim().length < 20) return null;

            return {
                originalContent: draftContent,
                strengthenedContent: strengthened.trim(),
                critique: critique?.trim() || '',
                latencyMs,
            };
        } catch {
            return null;
        }
    }

    private _extractSection(text: string, separator: string): string | null {
        const idx = text.indexOf(separator);
        if (idx === -1) return null;

        const nextSep = text.indexOf(
            separator === CRITIQUE_SEPARATOR ? STRENGTHENED_SEPARATOR : '',
            idx + separator.length,
        );

        if (nextSep === -1) {
            return text.slice(idx + separator.length).trim();
        }
        return text.slice(idx + separator.length, nextSep).trim();
    }
}
