import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MetaAgentPanel from './MetaAgentPanel';

describe('MetaAgentPanel', () => {
    it('renders header', () => {
        render(<MetaAgentPanel />);
        expect(screen.getAllByText(/Meta Agent/i).length).toBeGreaterThan(0);
    });
    it('gets directive', () => {
        render(<MetaAgentPanel />);
        const btn = screen.getByRole('button', { name: /Get directive/i });
        fireEvent.click(btn);
        expect(document.body.textContent).toContain('Directive');
    });
    it('shows all agents', () => {
        render(<MetaAgentPanel />);
        expect(document.body.textContent).toContain('All agents');
    });
});
