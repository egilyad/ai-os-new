import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadText, readFileAsText } from './file-transfer';

describe('file-transfer', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('readFileAsText читает файл как текст', async () => {
        const file = new File(['{"a":1}'], 'data.json', { type: 'application/json' });
        const text = await readFileAsText(file);
        expect(text).toBe('{"a":1}');
    });

    it('downloadText создаёт ссылку и кликает', () => {
        const createObjectURL = vi.fn(() => 'blob:fake');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

        const click = vi.fn();
        const remove = vi.fn();
        const el = { href: '', download: '', click, remove };
        vi.spyOn(document, 'createElement').mockReturnValue(el as never);
        const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => el as never);

        downloadText('out.json', '{}');
        expect(createObjectURL).toHaveBeenCalled();
        expect(el.download).toBe('out.json');
        expect(click).toHaveBeenCalled();
        expect(appendChild).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
    });
});
