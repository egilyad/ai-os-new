import React, { useState, useEffect } from 'react';
import { Zap, Activity, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveWorkspace from './LiveWorkspace';

import { advisorService } from '../../kernel/instances';
import type { OptimizationSuggestion } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { adminService } from '../../kernel/instances';

const MissionControl: React.FC = () => {
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [health, setHealth] = useState<{
        vitals?: { cpu?: number; memory?: number };
        status?: string;
    } | null>(null);

    useEffect(() => {
        const tryInit = () => {
            try {
                setSuggestions(advisorService.getSuggestions());
            } catch {
                /* not ready yet */
            }
            try {
                setHealth(adminService.getSystemHealth());
            } catch {
                /* not ready yet */
            }
        };
        tryInit();

        const unsubSugg = eventBus.on(EVENTS.ADVISOR_SUGGESTION, () => {
            try {
                setSuggestions([...advisorService.getSuggestions()]);
            } catch {
                /* not ready */
            }
        });
        const unsubExec = eventBus.on(EVENTS.ADVISOR_SUGGESTION_EXECUTED, () => {
            try {
                setSuggestions([...advisorService.getSuggestions()]);
            } catch {
                /* not ready */
            }
        });

        // P1-13: subscribe to kernel:updated instead of polling every 2s
        const unsubHealth = eventBus.on(EVENTS.KERNEL_UPDATED, () => {
            try {
                setHealth(adminService.getSystemHealth());
            } catch {
                /* not ready */
            }
        });

        return () => {
            unsubSugg();
            unsubExec();
            unsubHealth();
        };
    }, []);

    const handleExecuteFix = (id: string) => {
        try {
            advisorService.executeFix(id);
        } catch {
            /* not ready */
        }
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: '1rem',
                overflow: 'hidden',
            }}
        >
            {/* Primary Intelligence Feed */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateRows: '1fr 300px',
                    gap: '1rem',
                    overflow: 'hidden',
                }}
            >
                <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 15,
                            left: 15,
                            zIndex: 10,
                            display: 'flex',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                padding: '0.4rem 0.8rem',
                                background: 'var(--accent-tint)',
                                borderRadius: 8,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: 'var(--accent)',
                                border: '1px solid rgba(59,130,246,0.2)',
                            }}
                        >
                            MISSION_LIVE_STREAMS
                        </div>
                    </div>
                    <LiveWorkspace />
                </div>

                <div
                    className="glass-panel"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                    }}
                >
                    System monitoring idle — view detailed knowledge graph in{' '}
                    <strong style={{ marginLeft: 4 }}>Knowledge</strong> panel
                </div>
            </div>

            {/* Autonomous Advisor & Control Plane */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.2)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.25rem',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Zap size={18} color="#f59e0b" /> Autonomous Advisor
                        </h3>
                        <span
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                color: 'var(--warning)',
                                background: 'var(--warning-tint)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 4,
                            }}
                        >
                            {suggestions.length} NEW
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {suggestions.slice(0, 3).map((s) => (
                            <div
                                key={s.id}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    {s.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        lineHeight: 1.4,
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    {s.description}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 800,
                                            color: s.impact === 'high' ? '#ef4444' : '#f59e0b',
                                        }}
                                    >
                                        IMPACT: {s.impact.toUpperCase()}
                                    </span>
                                    <button
                                        onClick={() => handleExecuteFix(s.id)}
                                        className="btn-primary"
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.6rem' }}
                                    >
                                        Execute Fix
                                    </button>
                                </div>
                            </div>
                        ))}
                        {suggestions.length === 0 && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    textAlign: 'center',
                                    padding: '2rem',
                                }}
                            >
                                Monitoring system traces for optimization opportunities...
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Activity size={18} color="#10b981" /> System Pulse
                    </h3>

                    <div
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.75rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>Collective CPU</span>
                                <span>{(health?.vitals?.cpu ?? 0).toFixed(1)}%</span>
                            </div>
                            <div
                                style={{
                                    height: 4,
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 2,
                                }}
                            >
                                <motion.div
                                    animate={{ width: `${health?.vitals?.cpu ?? 0}%` }}
                                    style={{
                                        height: '100%',
                                        background: 'var(--accent)',
                                        borderRadius: 2,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.75rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>Memory Usage</span>
                                <span>{health?.vitals?.memory ?? 0} MB</span>
                            </div>
                            <div
                                style={{
                                    height: 4,
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 2,
                                }}
                            >
                                <motion.div
                                    animate={{
                                        width: `${Math.min(100, ((health?.vitals?.memory ?? 0) / 1024) * 100)}%`,
                                    }}
                                    style={{
                                        height: '100%',
                                        background: 'var(--success)',
                                        borderRadius: 2,
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: 'auto',
                                padding: '1rem',
                                background: 'rgba(59,130,246,0.05)',
                                borderRadius: 10,
                                border: '1px solid rgba(59,130,246,0.2)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: '0.75rem',
                                    color: 'var(--accent)',
                                    fontWeight: 800,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <Command size={14} />{' '}
                                {health?.status === 'healthy'
                                    ? 'AUTONOMOUS_ACTIVE'
                                    : 'SYSTEM_WARNING'}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'white',
                                    opacity: 0.8,
                                    lineHeight: 1.5,
                                }}
                            >
                                {health?.status === 'healthy'
                                    ? 'System is currently performing self-optimization. All cognitive services operational.'
                                    : 'System has detected potential issues. Review advisor suggestions for tier switching.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionControl;
