import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Common/Button (FA-10)', () => {
    it('renders children and defaults to primary variant', () => {
        render(<Button>Save</Button>);
        const el = screen.getByText('Save');
        expect(el.className).toContain('btn');
        expect(el.className).toContain('btn-primary');
        expect(el).not.toHaveAttribute('disabled');
    });

    it('applies variant and size classes', () => {
        render(
            <Button variant="ghost" size="sm">
                Refresh
            </Button>,
        );
        const el = screen.getByText('Refresh');
        expect(el.className).toContain('btn-ghost');
        expect(el.className).toContain('btn-sm');
    });

    it('forwards onClick and disabled', () => {
        const onClick = vi.fn();
        render(
            <Button onClick={onClick} disabled>
                Go
            </Button>,
        );
        const el = screen.getByText('Go') as HTMLButtonElement;
        expect(el.disabled).toBe(true);
        fireEvent.click(el);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('merges a custom className', () => {
        render(
            <Button className="extra-class" variant="danger">
                Delete
            </Button>,
        );
        const el = screen.getByText('Delete');
        expect(el.className).toContain('btn-danger');
        expect(el.className).toContain('extra-class');
    });
});
