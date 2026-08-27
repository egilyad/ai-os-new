import React from 'react';
import { Network, Code, GitBranch } from 'lucide-react';
import { flexColGap5, flexColGap6, docPageTitle, docPageSubtitle } from '../../styles/common';
import {
    StepCard,
    ArchCard,
    ApiCard,
    InvariantCard,
    FaqCard,
    ChangelogRelease,
    KernelServiceList,
    SectionPanel,
} from './doc-section-components';
import {
    GETTING_STARTED_STEPS,
    ARCH_CARDS_RENDER,
    KERNEL_SERVICES_LEFT,
    KERNEL_SERVICES_RIGHT,
    API_CARDS,
    EVENTS_REF,
    INVARIANTS,
    FAQ_ITEMS,
    RELEASES,
} from './doc-content-data';

export const GettingStarted: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>Getting Started</h1>
        <p style={docPageSubtitle}>
            Super-Agents OS is a local-first, browser-based inference operating system. Configure
            providers, manage memory, assign agent roles, and orchestrate multi-model cognitive
            workflows.
        </p>
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}
        >
            {GETTING_STARTED_STEPS.map((step) => (
                <StepCard key={step.title} {...step} />
            ))}
        </div>
    </div>
);

export const Architecture: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>System Architecture</h1>
        <p style={docPageSubtitle}>
            Built on a deterministic, event-sourced TypeScript kernel with service-oriented
            architecture designed for resilience, privacy, and hot-swappable components.
        </p>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginTop: '1rem',
            }}
        >
            {ARCH_CARDS_RENDER.map((card) => (
                <ArchCard key={card.title} {...card} />
            ))}
        </div>
        <SectionPanel
            title="Kernel Service Map"
            icon={<Network size={20} />}
            color="#60a5fa"
            bgGradient="linear-gradient(145deg, rgba(59,130,246,0.05) 0%, transparent 100%)"
            border="rgba(59,130,246,0.2)"
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--slate-300)',
                    lineHeight: 1.6,
                }}
            >
                <KernelServiceList items={KERNEL_SERVICES_LEFT} color="#60a5fa" />
                <KernelServiceList items={KERNEL_SERVICES_RIGHT} color="#60a5fa" />
            </div>
        </SectionPanel>
        <SectionPanel
            title="Layering & Dependency Rule"
            icon={<Code size={20} />}
            color="#a78bfa"
            bgGradient="linear-gradient(145deg, rgba(139,92,246,0.05) 0%, transparent 100%)"
            border="rgba(139,92,246,0.2)"
        >
            <p
                style={{
                    margin: '0 0 1rem',
                    fontSize: '0.9rem',
                    color: 'var(--slate-300)',
                    lineHeight: 1.6,
                }}
            >
                The kernel never imports UI, services, or types from legacy layers. All cross-layer
                communication goes through contract interfaces (I*). The bootstrap uses
                LifecycleManager for deterministic init→start→destroy ordering.
            </p>
            <blockquote
                className="glass-panel"
                style={{
                    padding: '1rem',
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.8,
                }}
            >{`// UI → Kernel contracts only\nkernel.transaction(async (tx) => {\n  kernel.setSLAMode('ECONOMY', tx);\n  kernel.setBaseWeights({...}, tx);\n});`}</blockquote>
        </SectionPanel>
    </div>
);

export const ApiReference: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>API Reference</h1>
        <p style={docPageSubtitle}>
            Core service APIs and event contracts for the Super-Agents OS platform.
        </p>
        {API_CARDS.map((api) => (
            <ApiCard key={api.title} {...api} />
        ))}
        <SectionPanel
            title="Event Reference (Key Events)"
            icon={<GitBranch size={20} />}
            color="#a78bfa"
            bgGradient="linear-gradient(145deg, rgba(139,92,246,0.05) 0%, transparent 100%)"
            border="rgba(139,92,246,0.2)"
        >
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 2 }}>
                {EVENTS_REF.map((ev) => (
                    <React.Fragment key={ev}>
                        <code style={{ color: 'var(--accent)' }}>{ev}</code>
                        <br />
                    </React.Fragment>
                ))}
            </div>
        </SectionPanel>
    </div>
);

export const Safety: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>Safety & Invariants</h1>
        <p style={docPageSubtitle}>
            To guarantee predictable execution, the OS enforces strict mathematical and logical
            invariants at runtime.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {INVARIANTS.map((rule) => (
                <InvariantCard key={rule.inv} {...rule} />
            ))}
        </div>
    </div>
);

export const FAQ: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>F.A.Q.</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--slate-400)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Common questions and troubleshooting steps for the Super-Agents ecosystem.
        </p>
        <div style={flexColGap5}>
            {FAQ_ITEMS.map((faq) => (
                <FaqCard key={faq.q} {...faq} />
            ))}
        </div>
    </div>
);

export const Changelog: React.FC = () => (
    <div style={flexColGap6}>
        <h1 style={docPageTitle}>Changelog</h1>
        <p style={docPageSubtitle}>Version history and release notes for Super-Agents OS.</p>
        {RELEASES.map((release) => (
            <ChangelogRelease key={release.version} {...release} />
        ))}
    </div>
);
