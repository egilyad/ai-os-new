import { describe, expect, it } from 'vitest';
import { checkVeto } from './veto-gate-service';
import type { ExceptionTemplate } from '../types/exception-template';

function template(overrides: Partial<ExceptionTemplate> & { text: string }): ExceptionTemplate {
    return {
        id: overrides.id ?? 'exc-1',
        name: overrides.name ?? 'Test',
        text: overrides.text,
        matchMode: overrides.matchMode ?? 'contains',
        scope: overrides.scope ?? 'all',
        enabled: overrides.enabled ?? true,
        createdAt: 0,
    };
}

describe('checkVeto', () => {
    const output = 'Конечно, вот ответ: 42. Гарантирую результат.';

    it('находит contains без учёта регистра', () => {
        expect(checkVeto(output, [template({ text: 'ГАРАНТИРУЮ' })], 'chat')).toHaveLength(1);
    });

    it('exact требует полного совпадения', () => {
        const t = template({ text: 'гарантирую результат', matchMode: 'exact' });
        expect(checkVeto(output, [t], 'chat')).toHaveLength(0);
        expect(checkVeto('Гарантирую результат', [t], 'chat')).toHaveLength(1);
    });

    it('regex работает и не ловит ReDoS-паттерны', () => {
        expect(
            checkVeto(output, [template({ text: 'ответ:\\s*\\d+', matchMode: 'regex' })], 'chat'),
        ).toHaveLength(1);
        expect(
            checkVeto('a'.repeat(50), [template({ text: '(a+)+$', matchMode: 'regex' })], 'chat'),
        ).toHaveLength(0);
    });

    it('уважает enabled и scope', () => {
        const disabled = template({ text: '42', enabled: false });
        const assistantOnly = template({ text: '42', scope: 'assistant' });
        expect(checkVeto(output, [disabled, assistantOnly], 'chat')).toHaveLength(0);
        expect(checkVeto(output, [assistantOnly], 'assistant')).toHaveLength(1);
    });
});
