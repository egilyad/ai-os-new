/**
 * Cognitive-aux / research panel (Experimental).
 * Meta-learning insights — research-grade, not production surface (P1.21).
 */
import React, { useState, useCallback } from 'react';
import { Brain, Lightbulb, TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { metaLearningService } from '../kernel/instances';
import { usePolling } from './Common/usePolling';
import type { MetaLearningState, LearnedPattern } from '../kernel/contracts/meta-learning';

const MetaLearningPanelContent: React.FC = () => {
    const [state, setState] = useState<MetaLearningState>(() => metaLearningService.getState());
    const [suggestions, setSuggestions] = useState<LearnedPattern[]>(() =>
        metaLearningService.getSuggestions(),
    );

    const refresh = useCallback(() => {
        setState(metaLearningService.getState());
        setSuggestions(metaLearningService.getSuggestions());
    }, []);

    // C-95: usePolling gates on document.hidden
    usePolling(refresh, 2000);

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Brain size={20} color="#a855f7" /> Meta-Learning Engine
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--slate-400)' }}>
                        Self-improving AI that learns from past decisions
                    </p>
                </div>
                <button
                    onClick={refresh}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'var(--slate-900)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                {[
                    { label: 'Observations', value: state.totalObservations, color: 'var(--accent)' },
                    { label: 'Patterns Found', value: state.patternsFound, color: '#a855f7' },
                    { label: 'Adjustments', value: state.adjustmentsApplied, color: 'var(--success)' },
                    {
                        label: 'Accuracy',
                        value: `${(state.accuracy * 100).toFixed(0)}%`,
                        color: state.accuracy > 0.7 ? '#22c55e' : '#f59e0b',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '14px 16px',
                            borderRadius: 10,
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}
                    >
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 4 }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            marginBottom: 4,
                        }}
                    >
                        Learning Rate
                    </label>
                    <input
                        type="range"
                        min="0.01"
                        max="1"
                        step="0.01"
                        value={state.learningRate}
                        onChange={(e) => {
                            metaLearningService.setLearningRate(parseFloat(e.target.value));
                            refresh();
                        }}
                        style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                        {state.learningRate.toFixed(2)}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            marginBottom: 4,
                        }}
                    >
                        Exploration Rate
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={state.explorationRate}
                        onChange={(e) => {
                            metaLearningService.setExplorationRate(parseFloat(e.target.value));
                            refresh();
                        }}
                        style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>
                        {state.explorationRate.toFixed(2)}
                    </div>
                </div>
            </div>

            <h3
                style={{
                    margin: '0 0 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--slate-200)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <Lightbulb size={16} /> Discovered Patterns ({suggestions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.length === 0 ? (
                    <div
                        style={{ padding: 20, textAlign: 'center', color: 'var(--slate-600)', fontSize: 13 }}
                    >
                        No patterns yet. Route some requests and run debates to build observations.
                    </div>
                ) : (
                    suggestions.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                background: 'var(--slate-900)',
                                border: `1px solid ${p.impact === 'positive' ? 'rgba(34,197,94,0.2)' : p.impact === 'negative' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'}`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 4,
                                }}
                            >
                                {p.impact === 'positive' ? (
                                    <TrendingUp size={14} color="#22c55e" />
                                ) : p.impact === 'negative' ? (
                                    <TrendingDown size={14} color="#ef4444" />
                                ) : (
                                    <Minus size={14} color="#64748b" />
                                )}
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--slate-200)',
                                        fontWeight: 600,
                                        flex: 1,
                                    }}
                                >
                                    {p.description}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                    {(p.confidence * 100).toFixed(0)}% confidence
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                    marginBottom: 6,
                                    display: 'flex',
                                    gap: 12,
                                }}
                            >
                                <span>Action: {p.suggestedAction}</span>
                                <span>{p.observationCount} observations</span>
                            </div>
                            <button
                                onClick={() => {
                                    metaLearningService.applySuggestion(p.id);
                                    refresh();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: 'rgba(168,85,247,0.15)',
                                    color: '#a855f7',
                                }}
                            >
                                <Zap size={12} /> Apply Suggestion
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const MetaLearningPanel: React.FC = () => (
    <PanelLoader name="Meta-Learning">
        <MetaLearningPanelContent />
    </PanelLoader>
);

export default MetaLearningPanel;
