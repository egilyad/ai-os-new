import { ProceduralAvatar } from './ProceduralAvatar';

const SHAPES: { id: string; label: string }[] = [
    { id: 'circle', label: 'Circle' },
    { id: 'square', label: 'Square' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'hexagon', label: 'Hexagon' },
    { id: 'shield', label: 'Shield' },
    { id: 'star', label: 'Star' },
];

interface ShapePickerProps {
    value?: string;
    onChange: (shape: string | undefined) => void;
    seed?: string;
}

export const ShapePicker: React.FC<ShapePickerProps> = ({ value, onChange, seed = 'default' }) => {
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SHAPES.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(value === s.id ? undefined : s.id)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0.5rem 0.6rem',
                        borderRadius: 10,
                        border:
                            value === s.id
                                ? '2px solid #3b82f6'
                                : '1px solid rgba(255,255,255,0.1)',
                        background:
                            value === s.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        minWidth: 64,
                    }}
                    title={s.label}
                >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <ProceduralAvatar seed={seed} size={28} shape={s.id as any} />
                    <span
                        style={{
                            fontSize: '0.6rem',
                            color: value === s.id ? '#60a5fa' : '#94a3b8',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                        }}
                    >
                        {s.label}
                    </span>
                </button>
            ))}
        </div>
    );
};
