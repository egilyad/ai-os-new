import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, string | number>) => {
            const map: Record<string, string> = {
                'decision_log.reason': 'Reason',
                'decision_log.policies': 'Policies',
                'decision_log.scoring': 'Scoring',
                'decision_log.rejected': 'Rejected ({count})',
                'decision_log.no_rejections': 'No rejections',
            };
            let text = map[key] ?? key;
            for (const [k, v] of Object.entries(params ?? {})) {
                text = text.replace(`{${k}}`, String(v));
            }
            return text;
        },
    }),
}));

const legacyEntry = {
    chosenProvider: 'groq',
    chosenModel: 'llama-3',
    timestamp: Date.now(),
} as never;

describe('DecisionCard', () => {
    it('renders a legacy entry without scoring or collections', async () => {
        const { DecisionCard } = await import('./DecisionCard');
        render(<DecisionCard entry={legacyEntry} isExpanded={false} onToggle={() => {}} />);
        expect(await screen.findByText('groq')).toBeDefined();
        // Missing cost renders a dash, not a crash or NaN.
        expect(screen.getByText('$—')).toBeDefined();
    });

    it('expands a legacy entry without crashing', async () => {
        const { DecisionCard } = await import('./DecisionCard');
        const Wrapper = () => {
            const [expanded, setExpanded] = useState(false);
            return (
                <>
                    <button onClick={() => setExpanded(true)}>expand</button>
                    <DecisionCard
                        entry={legacyEntry}
                        isExpanded={expanded}
                        onToggle={() => setExpanded((v) => !v)}
                    />
                </>
            );
        };
        render(<Wrapper />);
        fireEvent.click(screen.getByText('expand'));
        expect(await screen.findByText('No rejections')).toBeDefined();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
});
