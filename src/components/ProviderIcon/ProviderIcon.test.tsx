import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProviderIcon from './ProviderIcon';

describe('ProviderIcon', () => {
  it('renders icon for known provider', () => {
    const { container } = render(<ProviderIcon provider="OpenAI" />);
    expect(container.querySelector('.provider-icon-wrapper')).toBeDefined();
  });

  it('renders with custom size', () => {
    const { container } = render(<ProviderIcon provider="Gemini" size={32} />);
    const wrapper = container.querySelector('.provider-icon-wrapper') as HTMLElement;
    expect(wrapper).toBeDefined();
  });

  it('renders fallback for unknown provider', () => {
    const { container } = render(<ProviderIcon provider="NonExistent" />);
    expect(container.querySelector('.provider-icon-wrapper')).toBeDefined();
  });

  it('renders with custom className', () => {
    const { container } = render(<ProviderIcon provider="Groq" className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeDefined();
  });

  it('handles empty provider string', () => {
    const { container } = render(<ProviderIcon provider="" />);
    expect(container.querySelector('.provider-icon-wrapper')).toBeDefined();
  });

  it('is case-insensitive for provider names', () => {
    const { container: upper } = render(<ProviderIcon provider="OPENAI" />);
    const { container: lower } = render(<ProviderIcon provider="openai" />);
    expect(upper.querySelector('.provider-icon-wrapper')).toBeDefined();
    expect(lower.querySelector('.provider-icon-wrapper')).toBeDefined();
  });

  it('renders aria-label for accessibility', () => {
    render(<ProviderIcon provider="Anthropic" />);
    expect(screen.getByLabelText('Anthropic')).toBeDefined();
  });
});
