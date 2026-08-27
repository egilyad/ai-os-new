import type { PlayerStatus } from './DebateReplayTypes';
import { btn, replayStatusLabel, replayStatusColor } from './DebateReplayTypes';

interface Props {
    canStepBack: boolean;
    canStepFwd: boolean;
    replayStatus: PlayerStatus;
    playSpeed: number;
    stepMode: 'auto' | 'manual';
    progress: number;
    totalEvents: number;
    currentRoundLabel: string;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onStepForward: () => void;
    onStepBackward: () => void;
    onJumpToStart: () => void;
    onJumpToEnd: () => void;
    onSpeedChange: (speed: number) => void;
    onModeToggle: () => void;
}

const DebateReplayControls: React.FC<Props> = ({
    canStepBack,
    canStepFwd,
    replayStatus,
    playSpeed,
    stepMode,
    progress,
    totalEvents,
    currentRoundLabel,
    onPlay,
    onPause,
    onStop,
    onStepForward,
    onStepBackward,
    onJumpToStart,
    onJumpToEnd,
    onSpeedChange,
    onModeToggle,
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
                onClick={onJumpToStart}
                disabled={!canStepBack}
                style={btn('rgba(255,255,255,0.05)', '#9ca3af', !canStepBack)}
                title="Jump to Start"
            >
                {'|◀'}
            </button>
            <button
                onClick={onStepBackward}
                disabled={!canStepBack}
                style={btn('rgba(255,255,255,0.05)', '#9ca3af', !canStepBack)}
                title="Step Backward"
            >
                {'◀'}
            </button>
            {(replayStatus === 'playing' || replayStatus === 'paused') && (
                <button
                    onClick={onPause}
                    style={btn('rgba(168,85,247,0.15)', '#a855f7')}
                    title="Pause"
                >
                    ⏸
                </button>
            )}
            {replayStatus !== 'playing' && (
                <button
                    onClick={onPlay}
                    style={btn('rgba(34,197,94,0.15)', '#22c55e')}
                    title="Play"
                >
                    ▶
                </button>
            )}
            <button onClick={onStop} style={btn('rgba(239,68,68,0.1)', '#ef4444')} title="Stop">
                ⏹
            </button>
            <button
                onClick={onStepForward}
                disabled={!canStepFwd}
                style={btn('rgba(255,255,255,0.05)', '#9ca3af', !canStepFwd)}
                title="Step Forward"
            >
                {'▶'}
            </button>
            <button
                onClick={onJumpToEnd}
                disabled={!canStepFwd}
                style={btn('rgba(255,255,255,0.05)', '#9ca3af', !canStepFwd)}
                title="Jump to End"
            >
                {'▶|'}
            </button>

            <div
                style={{
                    width: 1,
                    height: 20,
                    background: 'var(--border-default)',
                    margin: '0 0.3rem',
                }}
            />

            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Speed:</span>
            <input
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={playSpeed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                style={{ width: 80, accentColor: '#3b82f6' }}
            />
            <span
                style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontWeight: 600,
                    minWidth: '2.2rem',
                }}
            >
                {playSpeed}x
            </span>

            <div
                style={{
                    width: 1,
                    height: 20,
                    background: 'var(--border-default)',
                    margin: '0 0.3rem',
                }}
            />

            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mode:</span>
            <button
                onClick={onModeToggle}
                style={{
                    ...btn(
                        stepMode === 'auto' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                        stepMode === 'auto' ? '#60a5fa' : '#9ca3af',
                    ),
                    fontSize: '0.65rem',
                }}
            >
                {stepMode === 'auto' ? 'Auto' : 'Manual'}
            </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
                style={{
                    flex: 1,
                    height: 4,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: '100%',
                        background:
                            replayStatus === 'playing'
                                ? '#22c55e'
                                : replayStatus === 'paused'
                                  ? '#a855f7'
                                  : '#3b82f6',
                        borderRadius: 2,
                        transition: 'width 0.2s',
                    }}
                />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {totalEvents > 0 ? `${Math.round(progress)}%` : '0%'}
            </span>
            <span
                style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: replayStatusColor[replayStatus],
                    whiteSpace: 'nowrap',
                }}
            >
                {replayStatusLabel[replayStatus]}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#60a5fa', whiteSpace: 'nowrap' }}>
                {currentRoundLabel}
            </span>
        </div>
    </div>
);

export default DebateReplayControls;
