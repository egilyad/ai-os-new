import type { DebatePhase } from '../../kernel/instances';
import { PHASE_COLORS } from './debate-runtime-constants';

const PHASES: DebatePhase[] = [
    'created',
    'queued',
    'initializing',
    'active',
    'deliberating',
    'consensus',
    'summarizing',
    'paused',
    'completed',
    'failed',
    'cancelled',
];

const LABEL_MAP: Record<string, string> = {
    created: 'Created',
    queued: 'Queued',
    initializing: 'Init',
    active: 'Active',
    deliberating: 'Deliberate',
    consensus: 'Consensus',
    summarizing: 'Summary',
    paused: 'Paused',
    completed: 'Done',
    failed: 'Failed',
    cancelled: 'Cancelled',
};

export function PhaseTimeline({ phase }: { phase: DebatePhase }) {
    const currentIdx = PHASES.indexOf(phase);
    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {PHASES.map((p, i) => {
                const isCurrent = i === currentIdx;
                const isPast = i <= currentIdx;
                return (
                    <div
                        key={p}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            minWidth: 32,
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: isPast ? PHASE_COLORS[p] : '#2a2a3a',
                                opacity: isCurrent ? 1 : 0.5,
                                transition: 'all 0.3s',
                            }}
                            title={p}
                        />
                        <span
                            style={{
                                fontSize: 9,
                                color: isCurrent ? '#e2e8f0' : isPast ? '#94a3b8' : '#475569',
                                fontWeight: isCurrent ? 700 : 400,
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {LABEL_MAP[p] || p}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
