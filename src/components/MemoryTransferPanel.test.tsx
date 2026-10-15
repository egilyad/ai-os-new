import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import MemoryTransferPanel from './MemoryTransferPanel';

const svc = vi.hoisted(() => ({
    import: vi.fn(),
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

vi.mock('../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        memoryTransferService: {
            getExportHistory: () => [],
            getImportHistory: () => [],
            previewImport: () => ({ sections: ['General'], entries: 0 }),
            import: (...args: unknown[]) => (svc.import as (...a: unknown[]) => Promise<unknown>)(...args),
            export: () => ({ data: '[]' }),
        },
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('MemoryTransferPanel import failure (Zone 4)', () => {
    it('shows the error instead of failing silently', async () => {
        svc.import.mockRejectedValueOnce(new Error('Invalid memory type: "bogus"'));
        render(<MemoryTransferPanel />);
        const areas = document.querySelectorAll('textarea');
        fireEvent.change(areas[0]!, { target: { value: '[{"bogus": true}]' } });
        fireEvent.click(screen.getByRole('button', { name: 'Import' }));
        expect(await screen.findByText(/Import failed:/)).toBeDefined();
        expect(screen.getByText(/Invalid memory type/)).toBeDefined();
    });
});
