import { Zap, Blocks, FileJson, Shield, HelpCircle, BookText } from 'lucide-react';

export type DocSection =
    'getting-started' | 'architecture' | 'api-reference' | 'safety' | 'faq' | 'changelog';

export interface DocSearchResult {
    section: DocSection;
    title: string;
    content: string;
    matchIndex: number;
}

interface NavItemDef {
    id: DocSection;
    icon: React.ReactNode;
    labelKey: string;
}

export const NAV_ITEMS: NavItemDef[] = [
    { id: 'getting-started', icon: <Zap size={18} />, labelKey: 'docs.nav.getting_started' },
    { id: 'architecture', icon: <Blocks size={18} />, labelKey: 'docs.nav.architecture' },
    { id: 'api-reference', icon: <FileJson size={18} />, labelKey: 'docs.nav.api_reference' },
    { id: 'safety', icon: <Shield size={18} />, labelKey: 'docs.nav.safety' },
    { id: 'faq', icon: <HelpCircle size={18} />, labelKey: 'docs.nav.faq' },
    { id: 'changelog', icon: <BookText size={18} />, labelKey: 'docs.nav.changelog' },
];

export const ALL_CONTENT: Record<DocSection, { title: string; content: string }> = {
    'getting-started': {
        title: 'Getting Started',
        content:
            'Configure providers, manage memory, assign agent roles, and orchestrate multi-model cognitive workflows. Add Providers, Configure Routing, Memory & Semantic Search, SuperAgents, Execute & Monitor.',
    },
    architecture: {
        title: 'System Architecture',
        content:
            'Kernel Layer, Services, Contracts & Types, Persistence. Kernel Service Map. Layering & Dependency Rule. Transaction boundary, ILifecycle, ILogger, EventBus.',
    },
    'api-reference': {
        title: 'API Reference',
        content:
            'Core service APIs and event contracts. EventBus, Kernel, RouterService, OrchestrationService, MemoryService, KeyService. Event reference for key events.',
    },
    safety: {
        title: 'Safety & Invariants',
        content:
            'Weights Normalization, Zero-Trust Architecture, Deterministic Telemetry, Safety Drift Cap, MCP Server Isolation, Cognitive Trace Completeness, Schema Versioning, Role Validation, Concurrency Throttling, Audit Trail.',
    },
    faq: {
        title: 'F.A.Q.',
        content:
            'Common questions about API key storage, costs, semantic search, data persistence, local models, Smart Routing, MCP Connectors, Orama vs embedding search, data export, provider key failures.',
    },
    changelog: {
        title: 'Changelog',
        content:
            'Version history from v4.1.0 down to v3.6.0. Kernel Consolidation, Kernel Hardening, Runtime Stability, Orama Worker, IndexedDB.',
    },
};
