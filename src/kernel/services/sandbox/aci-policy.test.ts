import { describe, expect, it } from 'vitest';
import { checkCommand, terminalCommandFromInput, truncateObservation } from './aci-policy';

describe('ACI observation truncation (I1)', () => {
    it('короткий вывод не меняется', () => {
        expect(truncateObservation('ok', 4000)).toEqual({ text: 'ok', elided: 0 });
    });

    it('длинный вывод сжимает head+tail и добавляет NOTE с числом elided', () => {
        const raw = 'A'.repeat(3000) + 'MARKER' + 'B'.repeat(3000);
        const result = truncateObservation(raw, 400);
        expect(result.text.length).toBeLessThanOrEqual(400);
        expect(result.text).toContain('A');
        expect(result.text).toContain('B');
        expect(result.text).toMatch(/\[elided \d+ chars; use head\/tail\/grep on the source\]/);
        expect(result.elided).toBeGreaterThan(0);
    });

    it('объект сериализуется и ограничивается', () => {
        const result = truncateObservation({ data: 'x'.repeat(500) }, 128);
        expect(result.text.length).toBeLessThanOrEqual(128);
        expect(result.elided).toBeGreaterThan(0);
    });

    it('слишком маленький лимит отклоняется', () => {
        expect(() => truncateObservation('x', 63)).toThrow(/maxChars/);
    });
});

describe('ACI command blocklist (I2)', () => {
    it('интерактивные команды блокируются', () => {
        for (const command of [
            'vim file.txt',
            'nano notes.md',
            'emacs file',
            'tail -f app.log',
            'tail --follow app.log',
            'npm test && nano file',
            'less big.log',
            'watch -n 1 ps',
        ]) {
            expect(checkCommand(command), command).toMatchObject({ allowed: false });
        }
    });

    it('обычные команды разрешены', () => {
        expect(checkCommand('ls -la').allowed).toBe(true);
        expect(checkCommand('tail -n 20 app.log').allowed).toBe(true);
        expect(checkCommand('cat file.txt').allowed).toBe(true);
        expect(checkCommand('').allowed).toBe(false);
    });

    it('allowRegex limiting и override блоклиста', () => {
        const policy = { allowRegex: /^git / };
        expect(checkCommand('git status', policy).allowed).toBe(true);
        expect(checkCommand('ls -la', policy)).toMatchObject({ allowed: false });
        expect(checkCommand('vim file', { allowRegex: /^vim / }).allowed).toBe(true);
    });

    it('пользовательский блоклист расширяет базовый', () => {
        expect(checkCommand('rm -rf /', { blocklist: [/^rm /] })).toMatchObject({
            allowed: false,
        });
    });
});

describe('ACI terminal intent', () => {
    it('извлекает команду только при явном terminal-намерении', () => {
        expect(terminalCommandFromInput({ action: 'type', text: 'ls -la', terminal: true })).toBe(
            'ls -la',
        );
        expect(terminalCommandFromInput({ action: 'key', keys: 'vim file', shell: true })).toBe(
            'vim file',
        );
        expect(
            terminalCommandFromInput({ action: 'type', text: 'ls', target: 'GNOME Terminal' }),
        ).toBe('ls');
    });

    it('не трогает обычный ввод текста и не-терминальные действия', () => {
        expect(terminalCommandFromInput({ action: 'type', text: 'vim file' })).toBeNull();
        expect(terminalCommandFromInput({ action: 'left_click', terminal: true })).toBeNull();
        expect(terminalCommandFromInput({ action: 'type', text: '', terminal: true })).toBeNull();
    });
});
