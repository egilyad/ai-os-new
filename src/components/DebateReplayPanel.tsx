import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { debateEngine } from '../kernel/instances';
import type { DebateSessionSnapshot, TimelineEntry } from '../kernel/contracts/debate-runtime';
import { usePolling } from './Common/usePolling';
import PanelLoader from './PanelLoader';
import { TimelinePlayer, toTimelineEvent, statusColor } from './DebateReplayTypes';
import DebateReplaySidebar from './DebateReplaySidebar';
import DebateReplayControls from './DebateReplayControls';
import DebateReplayEventDetail from './DebateReplayEventDetail';
import DebateReplayTimeline from './DebateReplayTimeline';
import DebateReplayLiveControls from './DebateReplayLiveControls';

const DebateReplayPanel: React.FC = () => {
    const [sessions, setSessions] = useState<DebateSessionSnapshot[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [replayStatus, setReplayStatus] = useState<'idle' | 'playing' | 'paused' | 'completed'>(
        'idle',
    );
    const [playSpeed, setPlaySpeed] = useState(1);
    const [stepMode, setStepMode] = useState<'auto' | 'manual'>('manual');

    const engineRef = useRef<TimelinePlayer | null>(null);

    useEffect(() => {
        return () => {
            engineRef.current?.destroy();
        };
    }, []);

    usePolling(() => setSessions(debateEngine.getAllSessions() ?? []), 5000);

    const selectSession = useCallback((id: string) => {
        setSelectedId(id);
        const entries = debateEngine.getTimeline(id) ?? [];
        setTimeline(entries);
        engineRef.current?.destroy();
        const engine = new TimelinePlayer();
        engine.onEvent((_event, idx) => {
            setCurrentIndex(idx);
        });
        engine.onStatusChange((status) => {
            setReplayStatus(status);
        });
        engine.onRewind((_oldIdx, newIdx) => {
            setCurrentIndex(newIdx);
        });
        engine.load(entries.map(toTimelineEvent));
        engineRef.current = engine;
        setCurrentIndex(-1);
        setReplayStatus('idle');
    }, []);

    useEffect(() => {
        engineRef.current?.setSpeed(playSpeed);
    }, [playSpeed]);
    useEffect(() => {
        engineRef.current?.setStepMode(stepMode);
    }, [stepMode]);

    const canStepBack = currentIndex > 0;
    const canStepFwd = currentIndex < timeline.length - 1;

    const handlePlay = useCallback(() => {
        if (stepMode === 'manual') setStepMode('auto');
        const e = engineRef.current;
        if (!e) return;
        if (replayStatus === 'completed') {
            e.stop();
            setCurrentIndex(-1);
        }
        setTimeout(() => engineRef.current?.play(), 50);
    }, [stepMode, replayStatus]);

    const handlePause = useCallback(() => {
        engineRef.current?.pause();
    }, []);
    const handleStop = useCallback(() => {
        engineRef.current?.stop();
        setCurrentIndex(-1);
    }, []);
    const handleStepForward = useCallback(() => {
        engineRef.current?.stepForward();
    }, []);
    const handleStepBackward = useCallback(() => {
        engineRef.current?.stepBackward();
    }, []);
    const handleJumpToStart = useCallback(() => {
        engineRef.current?.jumpTo(0);
    }, []);
    const handleJumpToEnd = useCallback(() => {
        engineRef.current?.jumpTo(timeline.length - 1);
    }, [timeline.length]);

    const totalEvents = timeline.length;
    const progress = totalEvents > 0 ? ((currentIndex + 1) / totalEvents) * 100 : 0;
    const currentEvent =
        currentIndex >= 0 && currentIndex < timeline.length
            ? (timeline[currentIndex] ?? null)
            : null;

    const visibleEvents = useMemo(() => {
        if (!selectedId || currentIndex < 0) return [];
        const result: Array<{
            round: number;
            agentId: string;
            content: string;
            type: string;
            index: number;
            ts: string;
        }> = [];
        for (let i = 0; i <= Math.min(currentIndex, timeline.length - 1); i++) {
            const e = timeline[i]!;
            const ts = new Date(e.timestamp).toLocaleTimeString();
            if (e.type === 'round:start' && e.payload) {
                const p = e.payload as { round: number };
                result.push({
                    round: p.round,
                    index: i,
                    agentId: '',
                    content: `Round ${p.round} started`,
                    type: 'marker',
                    ts,
                });
            } else if (e.type === 'agent:responded' && e.payload) {
                const p = e.payload as { agentId: string; content: string; round?: number };
                result.push({
                    round: p.round ?? 0,
                    index: i,
                    agentId: p.agentId,
                    content: p.content,
                    type: 'response',
                    ts,
                });
            } else if (e.type === 'round:end' && e.payload) {
                const p = e.payload as { round: number };
                result.push({
                    round: p.round,
                    index: i,
                    agentId: '',
                    content: `Round ${p.round} ended`,
                    type: 'marker',
                    ts,
                });
            } else if (
                e.type === 'session:completed' ||
                e.type === 'session:failed' ||
                e.type === 'session:cancelled'
            ) {
                result.push({
                    round: 0,
                    index: i,
                    agentId: '',
                    content: `Session ${e.type.split(':')[1]}`,
                    type: 'marker',
                    ts,
                });
            } else if (e.type === 'agent:error' && e.payload) {
                const p = e.payload as { agentId: string; error: string };
                result.push({
                    round: 0,
                    index: i,
                    agentId: p.agentId,
                    content: `Error: ${p.error.slice(0, 120)}`,
                    type: 'error',
                    ts,
                });
            } else if (e.type === 'consensus:reached') {
                result.push({
                    round: 0,
                    index: i,
                    agentId: '',
                    content: 'Consensus reached',
                    type: 'marker',
                    ts,
                });
            }
        }
        return result;
    }, [timeline, currentIndex, selectedId]);

    const eventsEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleEvents.length]);

    const selectedSession = sessions.find((s) => s.id === selectedId);

    const currentRoundLabel = useMemo(() => {
        if (currentIndex < 0 || !currentEvent) return '—';
        for (let i = Math.min(currentIndex, timeline.length - 1); i >= 0; i--) {
            if (timeline[i]!.type === 'round:start') {
                const r = (timeline[i]!.payload as { round: number }).round ?? 1;
                return `Round ${r}`;
            }
        }
        return 'Round 1';
    }, [currentIndex, timeline, currentEvent]);

    const isLive =
        selectedSession &&
        (selectedSession.phase === 'active' ||
            selectedSession.phase === 'paused' ||
            selectedSession.phase === 'deliberating');

    return (
        <PanelLoader title="Debate Replay">
            <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 200px)' }}>
                <DebateReplaySidebar
                    sessions={sessions}
                    selectedId={selectedId}
                    selectSession={selectSession}
                />

                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        minWidth: 0,
                    }}
                >
                    {!selectedSession ? (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                            }}
                        >
                            Select a debate to replay
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {selectedSession.topic}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {selectedSession.id} · {selectedSession.totalTokens} tokens
                                        · {selectedSession.round} rounds
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        background: `${statusColor[selectedSession.phase]}20`,
                                        color: statusColor[selectedSession.phase],
                                        flexShrink: 0,
                                    }}
                                >
                                    {selectedSession.phase}
                                </span>
                            </div>

                            <DebateReplayControls
                                canStepBack={canStepBack}
                                canStepFwd={canStepFwd}
                                replayStatus={replayStatus}
                                playSpeed={playSpeed}
                                stepMode={stepMode}
                                progress={progress}
                                totalEvents={totalEvents}
                                currentRoundLabel={currentRoundLabel}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onStop={handleStop}
                                onStepForward={handleStepForward}
                                onStepBackward={handleStepBackward}
                                onJumpToStart={handleJumpToStart}
                                onJumpToEnd={handleJumpToEnd}
                                onSpeedChange={setPlaySpeed}
                                onModeToggle={() =>
                                    setStepMode((m) => (m === 'auto' ? 'manual' : 'auto'))
                                }
                            />

                            <DebateReplayEventDetail
                                currentEvent={currentEvent}
                                replayStatus={replayStatus}
                            />

                            <DebateReplayTimeline
                                visibleEvents={visibleEvents}
                                currentIndex={currentIndex}
                                eventsEndRef={eventsEndRef}
                            />

                            {isLive && <DebateReplayLiveControls selectedId={selectedId} />}
                        </>
                    )}
                </div>
            </div>
        </PanelLoader>
    );
};

export default DebateReplayPanel;
