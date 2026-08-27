import type React from 'react';
import type { CounterfactualOverride } from '../../kernel/contracts/counterfactual';

export const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
};

export const PILL: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    fontSize: '0.6rem',
    fontWeight: 600,
};

export const RATE_PRESETS: CounterfactualOverride[] = [
    { global: { providerHealth: { groq: 'offline' } }, keys: {} },
    { global: { providerHealth: { gemini: 'offline' } }, keys: {} },
    { global: { providerHealth: { groq: 'degraded' } }, keys: {} },
    { global: { providerHealth: { nvidia: 'offline' } }, keys: {} },
];

export const PRESET_LABELS = ['Groq offline', 'Gemini offline', 'Groq degraded', 'NVIDIA offline'];
