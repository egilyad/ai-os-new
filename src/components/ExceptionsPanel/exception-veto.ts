import { loadTemplates } from './exception-store';

/**
 * Build the "forbidden answers" (veto) block from enabled global/all exception
 * templates. Assistant and Chat append this to the user turn so the model
 * knows which answers/phrasings it must not give. Returns '' when nothing to
 * enforce.
 */
export function buildExceptionVeto(): string {
    const active = loadTemplates().filter(
        (t) => t.enabled && (t.scope === 'all' || t.scope === 'global'),
    );
    if (active.length === 0) return '';
    const lines = active.map((t) => `- ${t.text}`);
    return [
        '### Запрещённые ответы (исключения)',
        'НЕ отвечай так и НЕ формулируй ответ в этом духе:',
        ...lines,
    ].join('\n');
}
