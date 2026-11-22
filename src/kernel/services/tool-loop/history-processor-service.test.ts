import { describe, it, expect } from 'vitest';
import { HistoryProcessorService } from './history-processor-service';

describe('HistoryProcessorService', () => {
    it('drops empty messages and keeps the last 40', () => {
        const svc = new HistoryProcessorService();
        const entries = Array.from({ length: 45 }, (_, i) => ({
            role: 'user',
            content: i === 0 ? '' : `msg ${i}`,
        }));
        const out = svc.process(entries);
        expect(out).toHaveLength(40);
        expect(out[0]!.content).toBe('msg 5');
    });

    it('supports custom processors', () => {
        const svc = new HistoryProcessorService();
        svc.use({
            id: 'strip-tool',
            process: (entries) => entries.filter((e) => e.role !== 'tool'),
        });
        const out = svc.process([
            { role: 'user', content: 'hi' },
            { role: 'tool', content: 'x' },
        ]);
        expect(out).toHaveLength(1);
        expect(svc.list()).toContain('strip-tool');
    });
});
