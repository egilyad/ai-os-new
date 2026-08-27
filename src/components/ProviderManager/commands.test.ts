import { describe, it, expect } from 'vitest';
import { ExportProvidersCommand, ImportProvidersCommand } from './commands';

describe('ExportProvidersCommand', () => {
    it('should generate export data and filename', () => {
        const cmd = new ExportProvidersCommand(() => JSON.stringify({ version: 1, providers: [] }));
        const result = cmd.execute();
        expect(result.data).toBe('{"version":1,"providers":[]}');
        expect(result.filename).toMatch(/^providers-export-\d{4}-\d{2}-\d{2}\.json$/);
    });
});

describe('ImportProvidersCommand', () => {
    it('should reject empty input', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        const result = cmd.validate('');
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toBe('File is empty');
    });

    it('should reject invalid JSON', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        const result = cmd.validate('not json');
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toBe('Expected a JSON array');
    });

    it('should reject non-array JSON', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        const result = cmd.validate('{"key":"value"}');
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toBe('Expected a JSON array');
    });

    it('should reject empty array', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        const result = cmd.validate('[]');
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toBe('Array is empty');
    });

    it('should validate correct data', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        const data = JSON.stringify([
            { provider: 'openai', label: 'OpenAI', key: 'sk-...' },
            { provider: 'groq', label: 'Groq', key: 'gsk-...' },
        ]);
        const result = cmd.validate(data);
        expect(result.valid).toBe(true);
        expect(result.count).toBe(2);
    });

    it('should execute import on valid data', () => {
        let called = false;
        const cmd = new ImportProvidersCommand((data) => {
            called = true;
            expect(data).toContain('openai');
            return 1;
        });
        const count = cmd.execute(
            JSON.stringify([{ provider: 'openai', label: 'OpenAI', key: 'sk-...' }]),
        );
        expect(called).toBe(true);
        expect(count).toBe(1);
    });

    it('should reject execute with invalid data', () => {
        const cmd = new ImportProvidersCommand(() => 0);
        expect(() => cmd.execute('bad')).toThrow('Validation failed');
    });
});
