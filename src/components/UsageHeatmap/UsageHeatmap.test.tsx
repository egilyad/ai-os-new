import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ApiKey } from '../../types/metrics';

vi.mock('lucide-react', () => ({
  BarChart3: () => null,
  Activity: () => null,
}));

describe('UsageHeatmap', () => {
  it('renders Usage Pattern Heatmap heading', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    render(<UsageHeatmap keys={[]} />);
    expect(await screen.findByText('Usage Pattern Heatmap')).toBeDefined();
  });

  it('shows empty state when no keys', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    render(<UsageHeatmap keys={[]} />);
    expect(await screen.findByText(/No keys configured/)).toBeDefined();
  });

  it('renders key rows when keys provided', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    const keys = [
      { id: 'k1', provider: 'groq', label: 'Groq Key', status: 'active', key: 'sk-1', stats: { extended: { hourlyUsage: new Array(24).fill(0), usageToday: { requests: 10, tokens: 100, weightedTokens: 0, estimatedCost: 0 } } } },
    ];
    render(<UsageHeatmap keys={keys as ApiKey[]} />);
    expect(await screen.findByText('Groq Key')).toBeDefined();
    expect(screen.getByText('groq')).toBeDefined();
  });

  it('shows usage count for each key', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    const keys = [
      { id: 'k1', provider: 'groq', label: 'Groq Key', status: 'active', key: 'sk-1', stats: { extended: { hourlyUsage: new Array(24).fill(0), usageToday: { requests: 10, tokens: 100, weightedTokens: 0, estimatedCost: 0 } } } },
    ];
    render(<UsageHeatmap keys={keys as ApiKey[]} />);
    expect(await screen.findByText(/10/)).toBeDefined();
  });

  it('renders 24 hourly bars per key', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    const keys = [
      { id: 'k1', provider: 'groq', label: 'Key', status: 'active', key: 'sk-1', stats: { extended: { hourlyUsage: new Array(24).fill(0), usageToday: { requests: 100, tokens: 100, weightedTokens: 0, estimatedCost: 0 } } } },
    ];
    const { container } = render(<UsageHeatmap keys={keys as ApiKey[]} />);
    const bars = container.querySelectorAll('[title$="req"]');
    expect(bars.length).toBe(24);
  });

  it('renders day labels per key', async () => {
    const UsageHeatmap = (await import('./UsageHeatmap')).default;
    const keys = [
      { id: 'k1', provider: 'groq', label: 'Key', status: 'active', key: 'sk-1', stats: { extended: { hourlyUsage: new Array(24).fill(0), usageToday: { requests: 0, tokens: 0, weightedTokens: 0, estimatedCost: 0 } } } },
    ];
    render(<UsageHeatmap keys={keys as ApiKey[]} />);
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      expect(screen.getByText(day)).toBeDefined();
    });
  });
});
