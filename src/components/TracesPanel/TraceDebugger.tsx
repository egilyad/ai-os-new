import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    Play,
    Pause,
    Code,
    Network,
    AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { CognitiveTrace } from '../../kernel/instances';
import CognitiveMicroscope from './CognitiveMicroscope';
import DecisionGraph from './DecisionGraph';
import { useTranslation } from '../../i18n/useTranslation';
import { iconBtnGhostMd, flexCenterGap2rem } from '../../styles/common';

interface TraceDebuggerProps {
    trace: CognitiveTrace;
    onClose: () => void;
}

const TraceDebugger: React.FC<TraceDebuggerProps> = ({ trace, onClose }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'audit' | 'graph'>('audit');
    const [replayIdx, setReplayIdx] = useState(trace.steps.length - 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const isMountedRef = useRef(true);
    const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (replayIdx >= trace.steps.length - 1) {
            if (
                replayIdx >= trace.steps.length - 1 &&
                replayIdx >= 0 &&
                isPlaying &&
                isMountedRef.current
            ) {
                setIsPlaying(false);
            }
            return;
        }
        if (!isPlaying) return;
        if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
        replayTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setReplayIdx((prev) => prev + 1);
            }
        }, 1000);
        return () => {
            if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
        };
    }, [isPlaying, replayIdx, trace.steps.length]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                borderRadius: 24,
            }}
        >
            <div
                style={{
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                }}
            >
                <div style={flexCenterGap2rem}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                        }}
                        aria-label="Close debugger"
                    >
                        <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: '#a855f7',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                marginBottom: '0.3rem',
                                textTransform: 'uppercase',
                            }}
                        >
                            {t('traces.debugger_title')}
                        </div>
                        <div
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                fontFamily: '"JetBrains Mono", monospace',
                                color: 'var(--slate-50)',
                            }}
                        >
                            {trace.traceId}
                        </div>
                    </div>

                    <div
                        style={{
                            width: 1,
                            height: 40,
                            background: 'var(--border-default)',
                            margin: '0 0.5rem',
                        }}
                        aria-hidden="true"
                    />

                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.4rem',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                        role="tablist"
                        aria-label="Trace debugger views"
                    >
                        <button
                            onClick={() => setViewMode('audit')}
                            role="tab"
                            aria-selected={viewMode === 'audit'}
                            style={{
                                padding: '0.6rem 1.25rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 10,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                    viewMode === 'audit' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: viewMode === 'audit' ? 'white' : '#64748b',
                            }}
                        >
                            <Code size={16} aria-hidden="true" /> {t('traces.tab.audit')}
                        </button>
                        <button
                            onClick={() => setViewMode('graph')}
                            role="tab"
                            aria-selected={viewMode === 'graph'}
                            style={{
                                padding: '0.6rem 1.25rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: 10,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background:
                                    viewMode === 'graph' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: viewMode === 'graph' ? 'white' : '#64748b',
                            }}
                        >
                            <Network size={16} aria-hidden="true" /> {t('traces.tab.neural')}
                        </button>
                    </div>
                </div>

                <div style={flexCenterGap2rem}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.5rem',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <button
                            onClick={() => setReplayIdx(Math.max(0, replayIdx - 1))}
                            style={iconBtnGhostMd}
                            aria-label={t('common.aria.previous_step')}
                        >
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{
                                padding: '0.6rem 1.5rem',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: isPlaying
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(59,130,246,0.15)',
                                color: isPlaying ? '#ef4444' : '#60a5fa',
                                border: `1px solid ${isPlaying ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                                fontWeight: 800,
                                cursor: 'pointer',
                            }}
                            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
                        >
                            {isPlaying ? (
                                <Pause size={18} aria-hidden="true" />
                            ) : (
                                <Play size={18} aria-hidden="true" />
                            )}{' '}
                            {isPlaying ? 'PAUSE' : 'PLAY'}
                        </button>
                        <button
                            onClick={() =>
                                setReplayIdx(Math.min(trace.steps.length - 1, replayIdx + 1))
                            }
                            style={iconBtnGhostMd}
                            aria-label={t('common.aria.next_step')}
                        >
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                        <button
                            onClick={() => {
                                setReplayIdx(0);
                                setIsPlaying(true);
                            }}
                            style={{
                                padding: '0.6rem',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-200)',
                                cursor: 'pointer',
                                marginLeft: '0.5rem',
                            }}
                            title="Restart Replay"
                            aria-label={t('common.aria.restart')}
                        >
                            <RefreshCcw size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            fontFamily: '"JetBrains Mono", monospace',
                            color: '#a855f7',
                            width: 100,
                            textAlign: 'center',
                            background: 'var(--purple-tint)',
                            padding: '0.6rem 1rem',
                            borderRadius: 10,
                            border: '1px solid rgba(168,85,247,0.2)',
                        }}
                    >
                        STEP {replayIdx + 1}/{trace.steps.length}
                    </div>
                </div>
            </div>

            {trace.metadata?.diagnostics
                ? (() => {
                      const diag = trace.metadata.diagnostics as {
                          activeIssueCount: number;
                          issues: Array<{ type: string; severity: string; message: string }>;
                      };
                      if (!diag.issues?.length) return null;
                      const sevColor = (s: string): string =>
                          s === 'critical'
                              ? '#dc2626'
                              : s === 'high'
                                ? '#ef4444'
                                : s === 'medium'
                                  ? '#f59e0b'
                                  : '#64748b';
                      return (
                          <div
                              style={{
                                  padding: '0.75rem 1.25rem',
                                  borderRadius: 16,
                                  border: '1px solid rgba(239,68,68,0.25)',
                                  background: 'rgba(239,68,68,0.06)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem',
                              }}
                          >
                              <div
                                  style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      fontSize: '0.8rem',
                                      fontWeight: 800,
                                      color: 'var(--error)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                  }}
                              >
                                  <AlertTriangle size={16} aria-hidden="true" />{' '}
                                  {t('traces.diagnostics')} ({diag.issues.length})
                              </div>
                              {diag.issues.map((iss, i) => (
                                  <div
                                      key={i}
                                      style={{
                                          display: 'flex',
                                          gap: 8,
                                          alignItems: 'baseline',
                                          fontSize: '0.8rem',
                                      }}
                                  >
                                      <span
                                          style={{
                                              fontWeight: 800,
                                              color: sevColor(iss.severity),
                                              textTransform: 'uppercase',
                                              minWidth: 70,
                                          }}
                                      >
                                          {iss.severity}
                                      </span>
                                      <span
                                          style={{
                                              color: 'var(--slate-400)',
                                              fontFamily: '"JetBrains Mono", monospace',
                                              minWidth: 150,
                                          }}
                                      >
                                          {iss.type}
                                      </span>
                                      <span style={{ color: 'var(--slate-200)' }}>{iss.message}</span>
                                  </div>
                              ))}
                          </div>
                      );
                  })()
                : null}

            <div
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                {viewMode === 'audit' ? (
                    <CognitiveMicroscope
                        trace={{
                            ...trace,
                            steps: trace.steps.slice(0, replayIdx + 1),
                        }}
                    />
                ) : (
                    <DecisionGraph
                        steps={trace.steps.slice(0, replayIdx + 1)}
                        edges={trace.decisionGraph.edges}
                        selectedId={trace.steps[replayIdx]?.id}
                    />
                )}
            </div>
        </motion.div>
    );
};

export default TraceDebugger;
