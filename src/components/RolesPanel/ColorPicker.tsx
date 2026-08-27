import React, { useState } from 'react';

const PRESET_COLORS = [
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
    '#8b5cf6',
    '#6d28d9',
    '#a78bfa',
    '#10b981',
    '#059669',
    '#34d399',
    '#f59e0b',
    '#d97706',
    '#fbbf24',
    '#ef4444',
    '#dc2626',
    '#f87171',
    '#ec4899',
    '#db2777',
    '#f472b6',
    '#06b6d4',
    '#0891b2',
    '#22d3ee',
    '#f97316',
    '#ea580c',
    '#fb923c',
    '#84cc16',
    '#65a30d',
    '#a3e635',
    '#6366f1',
    '#4f46e5',
    '#818cf8',
    '#14b8a6',
    '#0d9488',
    '#2dd4bf',
    '#e11d48',
    '#be123c',
    '#fb7185',
];

interface ColorPickerProps {
    value?: string;
    onChange: (color: string | undefined) => void;
    swatchSize?: number;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, swatchSize = 28 }) => {
    const [customHex, setCustomHex] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const handleCustomApply = () => {
        const hex = customHex.trim();
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
            onChange(hex);
            setShowCustom(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => onChange(value === color ? undefined : color)}
                        style={{
                            width: swatchSize,
                            height: swatchSize,
                            borderRadius: 6,
                            border:
                                value === color
                                    ? '2px solid white'
                                    : '1px solid rgba(255,255,255,0.1)',
                            background: color,
                            cursor: 'pointer',
                            outline: value === color ? `2px solid ${color}` : 'none',
                            transition: 'all 0.1s',
                        }}
                        title={color}
                    />
                ))}
                <button
                    onClick={() => setShowCustom(!showCustom)}
                    style={{
                        width: swatchSize,
                        height: swatchSize,
                        borderRadius: 6,
                        border: '1px dashed rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--slate-400)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Custom color"
                >
                    +
                </button>
            </div>
            {showCustom && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="#hex"
                        value={customHex}
                        onChange={(e) => setCustomHex(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCustomApply();
                        }}
                        style={{
                            flex: 1,
                            padding: '0.3rem 0.6rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleCustomApply}
                        style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: 6,
                            border: 'none',
                            background: 'rgba(59,130,246,0.2)',
                            color: '#60a5fa',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 700,
                        }}
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
};
