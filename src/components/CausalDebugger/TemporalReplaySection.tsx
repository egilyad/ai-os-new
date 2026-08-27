import { Clock, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { textXxsMuted, flexCenterGap8 } from '../../styles/common';
import { CARD, SMALL_BUTTON } from './causal-debugger-constants';
import type { TemporalTrace } from '../../kernel/contracts/temporal-replay';

interface Props {
    replayTrace: TemporalTrace | null;
    replayFrame: number;
    replayLoading: boolean;
    onRun: () => void;
    onClear: () => void;
    onFrameChange: (frame: number) => void;
}

const ScoreBar: React.FC<{
    provider: string;
    score: number;
    maxScore: number;
    isLeader: boolean;
}> = ({ provider, score, maxScore, isLeader }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--slate-200)', minWidth: 70 }}>{provider}</span>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
            <div
                style={{
                    width: `${(score / maxScore) * 100}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: isLeader ? '#22d3ee' : '#3b82f6',
                    opacity: isLeader ? 1 : 0.5,
                }}
            />
        </div>
        <span
            style={{ color: 'var(--slate-300)', minWidth: 50, textAlign: 'right', fontFamily: 'monospace' }}
        >
            {score.toFixed(3)}
        </span>
    </div>
);

const TimelineScrubber: React.FC<{
    frames: TemporalTrace['frames'];
    currentFrame: number;
    flipFrame: number | null;
    onFrameChange: (frame: number) => void;
    onSeek: (pct: number) => void;
}> = ({ frames, currentFrame, flipFrame, onFrameChange, onSeek }) => (
    <div style={flexCenterGap8}>
        <Rewind
            size={12}
            color="#64748b"
            style={{ cursor: 'pointer' }}
            onClick={() => onFrameChange(0)}
        />
        <SkipBack
            size={12}
            color="#64748b"
            style={{ cursor: 'pointer' }}
            onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
        />
        <div
            style={{
                flex: 1,
                position: 'relative',
                height: 8,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 4,
                cursor: 'pointer',
            }}
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                onSeek(pct);
            }}
        >
            {frames.map((f, i) => (
                <div
                    key={`frame-${f.index}`}
                    style={{
                        position: 'absolute',
                        left: `${frames.length > 1 ? (i / (frames.length - 1)) * 100 : 50}%`,
                        top: 0,
                        width: 6,
                        height: 8,
                        borderRadius: 3,
                        background: f.rescored ? '#22d3ee' : 'rgba(255,255,255,0.15)',
                        transform: 'translateX(-50%)',
                        ...(flipFrame === f.index
                            ? { background: 'var(--warning)', width: 8, height: 10, top: -1 }
                            : {}),
                    }}
                />
            ))}
            <div
                style={{
                    position: 'absolute',
                    left: `${frames.length > 1 ? (currentFrame / (frames.length - 1)) * 100 : 50}%`,
                    top: -3,
                    width: 12,
                    height: 14,
                    borderRadius: 2,
                    background: '#22d3ee',
                    transform: 'translateX(-50%)',
                    transition: 'left 0.15s',
                }}
            />
        </div>
        <SkipForward
            size={12}
            color="#64748b"
            style={{ cursor: 'pointer' }}
            onClick={() => onFrameChange(Math.min(frames.length - 1, currentFrame + 1))}
        />
        <FastForward
            size={12}
            color="#64748b"
            style={{ cursor: 'pointer' }}
            onClick={() => onFrameChange(frames.length - 1)}
        />
    </div>
);

const ScoreEvolution: React.FC<{ replayTrace: TemporalTrace; replayFrame: number }> = ({
    replayTrace,
    replayFrame,
}) => {
    if (!replayTrace.frames.some((f) => f.scoreState)) return null;
    const cf = replayTrace.frames[replayFrame];
    if (!cf?.scoreState) return <div style={textXxsMuted}>No score data at this frame</div>;
    const maxScore = Math.max(...Object.values(cf.scoreState.scores), 1);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate-400)' }}>
                Score Evolution
            </div>
            {Object.entries(cf.scoreState.scores).map(([provider, score]) => (
                <ScoreBar
                    key={provider}
                    provider={provider}
                    score={score}
                    maxScore={maxScore}
                    isLeader={cf.scoreState!.ranking[0] === provider}
                />
            ))}
        </div>
    );
};

const TemporalReplaySection: React.FC<Props> = ({
    replayTrace,
    replayFrame,
    replayLoading,
    onRun,
    onClear,
    onFrameChange,
}) => (
    <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={14} color="#22d3ee" />
            <span
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#22d3ee',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}
            >
                Temporal Replay
            </span>
            <div style={{ marginLeft: 'auto' }}>
                {!replayTrace && (
                    <button
                        onClick={onRun}
                        disabled={replayLoading}
                        style={{
                            ...SMALL_BUTTON,
                            border: '1px solid rgba(34,211,238,0.3)',
                            background: replayLoading
                                ? 'rgba(34,211,238,0.05)'
                                : 'rgba(34,211,238,0.1)',
                            color: replayLoading ? '#64748b' : '#22d3ee',
                            cursor: replayLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {replayLoading ? 'Building...' : 'Run Replay'}
                    </button>
                )}
                {replayTrace && (
                    <button
                        onClick={onClear}
                        style={{
                            ...SMALL_BUTTON,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'var(--error-tint)',
                            color: 'var(--error)',
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>

        {replayTrace && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <TimelineScrubber
                    frames={replayTrace.frames}
                    currentFrame={replayFrame}
                    flipFrame={replayTrace.flipFrame}
                    onFrameChange={onFrameChange}
                    onSeek={(pct) => {
                        const frame = Math.min(
                            replayTrace.frames.length - 1,
                            Math.floor(pct * replayTrace.frames.length),
                        );
                        onFrameChange(frame);
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={textXxsMuted}>
                        Frame {replayFrame + 1}/{replayTrace.frames.length}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>
                        {replayTrace.frames[replayFrame]?.event.eventName ?? '—'}
                    </span>
                    {replayTrace.flipFrame !== null && (
                        <span
                            style={{
                                fontSize: '0.6rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 4,
                                background: 'var(--warning-tint)',
                                color: 'var(--warning)',
                            }}
                        >
                            Flip: Frame {replayTrace.flipFrame + 1}
                        </span>
                    )}
                </div>

                <ScoreEvolution replayTrace={replayTrace} replayFrame={replayFrame} />

                {replayTrace.flipFrame !== null && replayFrame >= replayTrace.flipFrame && (
                    <div
                        style={{
                            fontSize: '0.65rem',
                            padding: '0.3rem 0.5rem',
                            borderRadius: 4,
                            background: 'rgba(245,158,11,0.08)',
                            color: 'var(--warning)',
                        }}
                    >
                        Flip point reached at Frame {replayTrace.flipFrame + 1} —{' '}
                        {replayTrace.winner} took the lead
                    </div>
                )}

                <div style={{ ...textXxsMuted, display: 'flex', gap: 12 }}>
                    <span>
                        Initial leader:{' '}
                        <strong style={{ color: 'var(--slate-200)' }}>
                            {replayTrace.initialLeader || '(none)'}
                        </strong>
                    </span>
                    <span>
                        Final winner:{' '}
                        <strong style={{ color: '#22d3ee' }}>
                            {replayTrace.winner || '(none)'}
                        </strong>
                    </span>
                </div>
            </div>
        )}
    </div>
);

export default TemporalReplaySection;
