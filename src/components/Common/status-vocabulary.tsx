import { normalizeHealthStatus } from '../../kernel/contracts/health';

// ── Status → Color Mapping ──────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
    active: '#10b981',
    healthy: '#10b981',
    online: '#10b981',
    ok: '#10b981',
    ready: '#10b981',
    completed: '#10b981',
    connected: '#10b981',
    done: '#10b981',
    acting: '#10b981',
    degraded: '#f59e0b',
    warning: '#f59e0b',
    checking: '#f59e0b',
    paused: '#f59e0b',
    quota_exhausted: '#f59e0b',
    routing: '#f59e0b',
    waiting: '#f59e0b',
    pending: '#3b82f6',
    running: '#3b82f6',
    info: '#3b82f6',
    thinking: '#3b82f6',
    todo: '#3b82f6',
    generating: '#3b82f6',
    error: '#ef4444',
    critical: '#ef4444',
    offline: '#ef4444',
    failed: '#ef4444',
    invalid: '#ef4444',
    timed_out: '#ef4444',
    disconnected: '#64748b',
    inactive: '#64748b',
    idle: '#64748b',
    initializing: '#64748b',
    default: '#64748b',
    unknown: '#a1a1aa',
    duplicate: '#a855f7',
    debating: '#a855f7',
    synthesizing: '#a855f7',
    quarantined: '#ec4899',
    probation: '#f97316',
    high_pressure: '#f97316',
};

// ── Pressure level colors (distinct green/amber shades) ──────────
export function getPressureLevelColor(level: string): string {
    const map: Record<string, string> = {
        low: '#22c55e',
        normal: '#eab308',
        medium: '#f59e0b',
        high: '#f97316',
        critical: '#ef4444',
    };
    return map[level.toLowerCase()] ?? '#64748b';
}

// ── Policy dimension colors ──────────────────────────────────────
export function getPolicyDimensionColor(dim: string): string {
    const map: Record<string, string> = {
        latency: '#f59e0b',
        privacy: '#10b981',
        cost: '#ef4444',
        safety: '#a855f7',
        rate_limit: '#3b82f6',
        content: '#06b6d4',
        block: '#ef4444',
        warn: '#f59e0b',
        log: '#3b82f6',
        throttle: '#a855f7',
        mask: '#06b6d4',
    };
    return map[dim.toLowerCase()] ?? '#64748b';
}

export function getStatusColor(status: string): string {
    return STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS.default!;
}

// ── Threshold-based colors (3-tier: healthy / warning / critical) ─
export function thresholdColor(value: number, warnAt: number, critAt: number): string {
    if (value >= critAt) return '#ef4444';
    if (value >= warnAt) return '#f59e0b';
    return '#10b981';
}

export function pctColor(pct: number): string {
    return pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
}

export function latencyColor(ms: number): string {
    if (ms === 0) return '#64748b';
    return ms < 500 ? '#10b981' : ms < 1500 ? '#f59e0b' : '#ef4444';
}

export function repColor(reputation: number): string {
    if (reputation === 0) return '#52525b';
    return reputation > 80 ? '#10b981' : reputation > 50 ? '#f59e0b' : '#ef4444';
}

export function okErrColor(ok: boolean): string {
    return ok ? '#10b981' : '#ef4444';
}

export function canonicalHealthLabel(status: string | boolean | null | undefined): string {
    return normalizeHealthStatus(status).toUpperCase();
}

export function canonicalHealthColor(status: string | boolean | null | undefined): string {
    return getStatusColor(normalizeHealthStatus(status));
}

// ── Status Badge component ───────────────────────────────────────
interface BadgeProps {
    status: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    icon?: React.ReactNode;
    style?: React.CSSProperties;
}

const SIZE_MAP = {
    sm: { padding: '0.15rem 0.4rem', fontSize: '0.6rem' },
    md: { padding: '0.3rem 0.8rem', fontSize: '0.65rem' },
    lg: { padding: '0.4rem 0.8rem', fontSize: '0.7rem' },
};

export function StatusBadge({ status, label, size = 'md', color, icon, style }: BadgeProps) {
    const resolvedColor = color ?? getStatusColor(status);
    const s = SIZE_MAP[size];
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: s.padding,
                borderRadius: 100,
                fontSize: s.fontSize,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                background: `${resolvedColor}15`,
                color: resolvedColor,
                border: `1px solid ${resolvedColor}30`,
                ...style,
            }}
        >
            {icon}
            {label ?? status}
        </span>
    );
}

// ── Threshold Bar component ──────────────────────────────────────
interface BarProps {
    pct: number;
    height?: number;
    radius?: number;
    color?: string;
}

export function ThresholdBar({ pct, height = 4, radius = 3, color }: BarProps) {
    const barColor = color ?? pctColor(pct);
    return (
        <div
            style={{
                width: '100%',
                height,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: radius,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: `${Math.min(100, Math.max(0, pct))}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: radius,
                }}
            />
        </div>
    );
}

// ── Tag Pill component ───────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
    env: '#3b82f6',
    tier: '#10b981',
};

export function TagPill({ tag }: { tag: string }) {
    const prefix = tag.split(':')[0]!;
    const color = TAG_COLORS[prefix] ?? '#a855f7';
    const label = tag.replace(/^(env|tier):/, '');
    return (
        <span
            style={{
                fontSize: '0.6rem',
                padding: '0.15rem 0.4rem',
                borderRadius: 4,
                background: `${color}15`,
                color,
                border: `1px solid ${color}30`,
                fontWeight: 600,
            }}
        >
            {label}
        </span>
    );
}

// ── Provider → Color Mapping ─────────────────────────────────────
export const PROVIDER_COLORS: Record<string, string> = {
    openrouter: '#3b82f6',
    gemini: '#8b5cf6',
    groq: '#10b981',
    nvidia: '#f59e0b',
    openai: '#10a37f',
    anthropic: '#da7756',
    together: '#a855f7',
    fireworks: '#f97316',
    deepseek: '#06b6d4',
    mistral: '#6366f1',
    cohere: '#84cc16',
    azure: '#2563eb',
    huggingface: '#fbbf24',
    cerebras: '#ec4899',
    cloudflare: '#f6821f',
    perplexity: '#1a1a1a',
    google: '#8b5cf6',
    mock: '#64748b',
    default: '#94a3b8',
};

export function getProviderColor(provider: string): string {
    return PROVIDER_COLORS[provider.toLowerCase()] ?? PROVIDER_COLORS.default!;
}

// ── Active Toggle style helper ───────────────────────────────────
export function activeToggleStyle(active: boolean, accent = '#3b82f6'): React.CSSProperties {
    return {
        padding: '0.4rem 0.8rem',
        fontSize: '0.75rem',
        borderRadius: 8,
        cursor: 'pointer',
        border: active ? `1px solid ${accent}50` : '1px solid rgba(255,255,255,0.1)',
        background: active ? `${accent}25` : 'transparent',
        color: active ? accent : '#64748b',
        fontWeight: active ? 700 : 600,
    };
}
