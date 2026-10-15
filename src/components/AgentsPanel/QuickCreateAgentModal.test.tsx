import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QuickCreateAgentModal } from './QuickCreateAgentModal';

afterEach(() => cleanup());

describe('QuickCreateAgentModal failure honesty (Zone 3)', () => {
    it('stays open with an inline error instead of closing silently', () => {
        const onClose = vi.fn();
        render(
            <QuickCreateAgentModal
                open
                onClose={onClose}
                onCreate={() => {
                    throw new Error('No active topology — mount a topology first');
                }}
                availableRoles={[]}
                keys={[]}
            />,
        );
        fireEvent.click(screen.getByText('Create'));
        expect(screen.getByText(/No active topology/)).toBeDefined();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes cleanly on success', () => {
        const onClose = vi.fn();
        render(
            <QuickCreateAgentModal
                open
                onClose={onClose}
                onCreate={vi.fn()}
                availableRoles={[]}
                keys={[]}
            />,
        );
        fireEvent.click(screen.getAllByText('Create')[0]!);
        expect(onClose).toHaveBeenCalled();
    });
});
