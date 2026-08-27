/**
 * Cognitive-aux / research panel (Experimental).
 * Debate-system research scratchpad — research-grade, not production surface (P1.21).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Lightbulb,
    Zap,
    BookOpen,
    Route,
    Shield,
    Eye,
    ExternalLink,
    Clock,
} from 'lucide-react';
import { hypothesisService, researchRunService } from '../../kernel/instances';
import type { ResearchHypothesis } from '../../kernel/types/research-types';
import { useTranslation } from '../../i18n/useTranslation';
import { usePolling } from '../Common/usePolling';
import ResearchRunHistory from './ResearchRunHistory';
import { HypothesisMarketplace } from './HypothesisMarketplace';
import { ExperimentComparison } from './ExperimentComparison';
import ResearchExportPanel from './ResearchExportPanel';

interface ModuleCard {
    id: string;
    route: string;
    icon: React.ReactNode;
    labelKey: string;
    color: string;
    descriptionKey: string;
}

const MODULES: ModuleCard[] = [
    {
        id: 'project-os',
        route: '/project-os',
        icon: <Search size={20} />,
        labelKey: 'nav.project_os_explorer',
        color: 'var(--purple)',
        descriptionKey: 'project_os_explorer.subtitle',
    },
    {
        id: 'hypothesis-gen',
        route: '/hypothesis-gen',
        icon: <Lightbulb size={20} />,
        labelKey: 'nav.hypothesis_generator',
        color: 'var(--warning)',
        descriptionKey: 'hypothesis_generator.subtitle',
    },
    {
        id: 'arch-review',
        route: '/arch-review',
        icon: <Zap size={20} />,
        labelKey: 'nav.architecture_review',
        color: '#a855f7',
        descriptionKey: 'arch_review.subtitle',
    },
    {
        id: 'prompt-audit',
        route: '/prompt-audit',
        icon: <BookOpen size={20} />,
        labelKey: 'nav.prompt_strategy_audit',
        color: 'var(--accent)',
        descriptionKey: 'prompt_audit.subtitle',
    },
    {
        id: 'routing-experiments',
        route: '/routing-experiments',
        icon: <Route size={20} />,
        labelKey: 'nav.model_routing_experiments',
        color: 'var(--warning)',
        descriptionKey: 'routing_experiments.subtitle',
    },
    {
        id: 'gov-stress-test',
        route: '/gov-stress-test',
        icon: <Shield size={20} />,
        labelKey: 'nav.governance_stress_test',
        color: 'var(--success)',
        descriptionKey: 'gov_stress_test.subtitle',
    },
    {
        id: 'obs-gaps',
        route: '/obs-gaps',
        icon: <Eye size={20} />,
        labelKey: 'nav.observability_gaps_scanner',
        color: '#06b6d4',
        descriptionKey: 'obs_gaps.subtitle',
    },
];

const DebateSystemResearch: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [hypotheses, setHypotheses] = useState<ResearchHypothesis[]>([]);

    useEffect(() => {
        setHypotheses(hypothesisService.getAll());
    }, []);

    usePolling(() => setHypotheses(hypothesisService.getAll()), 15000);

    const activeCount = hypotheses.filter(
        (h) => h.status === 'active' || h.status === 'debating',
    ).length;
    const recent = [...hypotheses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h1
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        margin: '0 0 0.5rem',
                        color: 'var(--slate-50)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <Search size={28} color="#8b5cf6" />
                    {t('nav.debate_system_research')}
                </h1>
                <p
                    style={{
                        color: 'var(--slate-400)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        marginBottom: '1rem',
                        maxWidth: 700,
                    }}
                >
                    {t('debate_system_research.subtitle')}
                </p>

                {hypotheses.length > 0 && (
                    <div
                        style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: 12,
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.2)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--warning)',
                                marginBottom: 8,
                            }}
                        >
                            {activeCount} active / {hypotheses.length} hypotheses
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {recent.map((h) => (
                                <button
                                    key={h.id}
                                    type="button"
                                    onClick={() => navigate('/hypothesis-gen')}
                                    style={{
                                        textAlign: 'left',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0.5rem 0.75rem',
                                        cursor: 'pointer',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.78rem',
                                    }}
                                >
                                    <span style={{ color: 'var(--slate-400)', marginRight: 8 }}>
                                        {h.status}
                                    </span>
                                    {h.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {MODULES.map((mod) => (
                        <div
                            key={mod.id}
                            onClick={() => navigate(mod.route)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') navigate(mod.route);
                            }}
                            role="button"
                            tabIndex={0}
                            style={{
                                padding: '1.25rem',
                                borderRadius: 16,
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: mod.color, display: 'flex' }}>
                                    {mod.icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-50)',
                                        flex: 1,
                                    }}
                                >
                                    {t(mod.labelKey)}
                                </span>
                                <ExternalLink size={14} color="#475569" />
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '0.78rem',
                                    color: 'var(--slate-500)',
                                    lineHeight: 1.5,
                                }}
                            >
                                {t(mod.descriptionKey)}
                            </p>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: '0.75rem',
                        }}
                    >
                        <Clock size={16} color="#f59e0b" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            Recent Research Runs
                        </span>
                    </div>
                    <ResearchRunHistory module="all" runService={researchRunService} />
                </div>

                {/* Hypothesis Marketplace */}
                <div style={{ marginTop: '2rem', height: 500 }}>
                    <HypothesisMarketplace />
                </div>

                {/* Experiment Comparison */}
                <div style={{ marginTop: '2rem' }}>
                    <ExperimentComparison />
                </div>

                {/* Research Export */}
                <div style={{ marginTop: '2rem' }}>
                    <ResearchExportPanel />
                </div>

                <div
                    style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.15)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#60a5fa',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Reference Docs
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[
                            'docs/events.md',
                            'docs/DEBT_REPORT.md',
                            'docs/ПОЛНЫЙ_РЕЕСТР.md',
                            'docs/01-system-architecture_RU.md',
                        ].map((doc) => (
                            <a
                                key={doc}
                                href={`/${doc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#60a5fa',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 4,
                                    background: 'var(--accent-tint)',
                                    textDecoration: 'none',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {doc}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebateSystemResearch;
