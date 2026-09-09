import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddKeyModal from './AddKeyModal';

vi.mock('../../i18n/useTranslation', () => {
    const labels: Record<string, string> = {
        'add_key.title_provider': 'Select AI Provider',
        'add_key.title_configure': 'Configure {0}',
        'add_key.error_required': 'Label and API key are required.',
        'add_key.add': 'Add Key',
        'add_key.save_close': 'Save & Close',
        'add_key.back': 'Back',
        'add_key.close_aria': 'Close',
        'add_key.show_aria': 'Show key',
        'add_key.hide_aria': 'Hide key',
    };
    return {
        useTranslation: () => ({
            t: (key: string) => labels[key] || key,
        }),
    };
});

describe('AddKeyModal', () => {
    it('renders with provider selection step', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        expect(screen.getByText('Select AI Provider')).toBeDefined();
        expect(screen.getByText('OpenRouter')).toBeDefined();
        expect(screen.getByText('OpenAI')).toBeDefined();
    });

    it('shows 14 provider options', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(14);
    });

    it('switches to detail step on provider click', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Groq Cloud'));
        expect(screen.getByText('Configure Groq')).toBeDefined();
    });

    it('shows form fields in detail step', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('OpenAI'));
        expect(screen.getByLabelText('Connection name')).toBeDefined();
        expect(screen.getByLabelText('API key')).toBeDefined();
    });

    it('calls onClose when backdrop clicked', () => {
        const onClose = vi.fn();
        render(<AddKeyModal onClose={onClose} />);
        const overlay = screen.getByRole('dialog');
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when X button clicked', () => {
        const onClose = vi.fn();
        render(<AddKeyModal onClose={onClose} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('shows error on submit with empty fields', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('OpenAI'));
        fireEvent.click(screen.getByText('Add Key'));
        expect(screen.getByText('Label and API key are required.')).toBeDefined();
    });

    it('toggles API key visibility', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('OpenAI'));
        const keyInput = screen.getByLabelText('API key') as HTMLInputElement;
        expect(keyInput.type).toBe('password');
        fireEvent.click(screen.getByLabelText('Show key'));
        expect(keyInput.type).toBe('text');
        fireEvent.click(screen.getByLabelText('Hide key'));
        expect(keyInput.type).toBe('password');
    });

    it('goes back to provider selection from details', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('OpenAI'));
        fireEvent.click(screen.getByText('Back'));
        expect(screen.getByText('Select AI Provider')).toBeDefined();
    });

    it('pre-fills label when provider is selected', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Google Gemini'));
        const nameInput = screen.getByLabelText('Connection name') as HTMLInputElement;
        expect(nameInput.value).toBe('google-gemini-01');
    });

    it('has dialog role and aria-modal', () => {
        render(<AddKeyModal onClose={vi.fn()} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('calls onClose after successful submit', async () => {
        const onClose = vi.fn();
        render(<AddKeyModal onClose={onClose} />);
        fireEvent.click(screen.getByText('OpenAI'));
        fireEvent.change(screen.getByLabelText('Connection name'), { target: { value: 'My Key' } });
        fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-test' } });
        fireEvent.click(screen.getByText('Save & Close'));
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });
});
