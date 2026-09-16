import React, { useState } from 'react';

export type SettingsTab =
    | 'general'
    | 'writing'
    | 'reading'
    | 'alerts'
    | 'prompts'
    | 'advanced'
    | 'notifications'
    | 'appearance';

export const SettingRow = ({
    icon,
    title,
    description,
    children,
    accent = '#3b82f6',
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    accent?: string;
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            marginBottom: '1rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
        }}
    >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flex: 1 }}>
            <div
                style={{
                    background: `${accent}15`,
                    border: `1px solid ${accent}30`,
                    padding: '0.75rem',
                    borderRadius: 12,
                    color: accent,
                    boxShadow: `inset 0 0 10px ${accent}20`,
                }}
            >
                {icon}
            </div>
            <div>
                <div
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        marginBottom: '0.4rem',
                        color: 'var(--slate-50)',
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--slate-400)',
                        lineHeight: 1.6,
                        maxWidth: 450,
                    }}
                >
                    {description}
                </div>
            </div>
        </div>
        <div style={{ marginLeft: '2rem', flexShrink: 0 }}>{children}</div>
    </div>
);

export const Toggle = ({
    checked,
    onChange,
    accent = '#3b82f6',
    ariaLabel = 'Toggle setting',
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    accent?: string;
    ariaLabel?: string;
}) => (
    <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
            width: 48,
            height: 26,
            borderRadius: 13,
            position: 'relative',
            background: checked ? accent : 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.3s',
            boxShadow: checked ? `0 0 12px ${accent}40` : 'none',
            flexShrink: 0,
        }}
        aria-label={ariaLabel}
    >
        <div
            style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: checked ? 25 : 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
            }}
        />
    </button>
);

export interface ConfigInputProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    step?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
}

export const ConfigInput = ({
    label,
    value,
    onChange,
    step = '1',
    min = 0,
    max = Infinity,
    defaultValue = 0,
}: ConfigInputProps) => {
    const [error, setError] = useState<string | null>(null);
    const handleChange = (raw: string) => {
        const parsed = parseFloat(raw);
        if (isNaN(parsed)) {
            setError('Invalid number');
            onChange(defaultValue);
            return;
        }
        if (parsed < min) {
            setError(`Min ${min}`);
            onChange(min);
            return;
        }
        if (parsed > max) {
            setError(`Max ${max}`);
            onChange(max);
            return;
        }
        setError(null);
        onChange(parsed);
    };
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
            }}
        >
            <label style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {error && <span style={{ color: 'var(--error)', fontSize: '0.7rem' }}>{error}</span>}
                <input
                    type="number"
                    value={value}
                    step={step}
                    onChange={(e) => handleChange(e.target.value)}
                    style={{
                        width: 100,
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: 'var(--slate-200)',
                        textAlign: 'right',
                        fontSize: '0.78rem',
                        outline: 'none',
                    }}
                />
            </div>
        </div>
    );
};

export type RuntimeConfigForm = {
    healthCheckStaleIntervalMs: number;
    latencyPenaltyThresholdMs: number;
    errorRatePenaltyThreshold: number;
    successRatePenaltyFloor: number;
    alertPenaltyPerAlert: number;
    metricsHistoryLimit: number;
    metricsInterval: number;
    tracesMaxEntries: number;
    tracesDbLoadLimit: number;
    tracesTokenEstimateDivisor: number;
};
