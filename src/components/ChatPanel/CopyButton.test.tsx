import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { CopyButton } from './CopyButton';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function stubClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
    });
}

describe('CopyButton clipboard honesty', () => {
    it('shows Copied only after the write resolves', async () => {
        stubClipboard(vi.fn(async () => {}));
        render(<CopyButton text="hello" />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        expect(await screen.findByText('Copied!')).toBeDefined();
    });

    it('shows Failed when the write rejects (e.g. denied permission)', async () => {
        stubClipboard(
            vi.fn(async () => {
                throw new DOMException('denied', 'NotAllowedError');
            }),
        );
        render(<CopyButton text="hello" />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        expect(await screen.findByText('Failed')).toBeDefined();
    });

    it('shows Failed when the clipboard API is missing', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
        });
        render(<CopyButton text="hello" />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        expect(await screen.findByText('Failed')).toBeDefined();
    });
});
