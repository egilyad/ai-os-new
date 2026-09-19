/**
 * LearnHubPanel — Learn hub (tutorials + docs + patterns + decision-log).
 *
 * Consolidates 4 learning/reference routes into one tabbed surface.
 * Tab content reuses the existing panels unchanged (own files, own tests).
 * Services untouched: tutorialService, storageAdapter, eventBus, i18n content.
 */
import React, { useState, Suspense } from 'react';
import { GraduationCap, BookOpen, LayoutGrid, ClipboardList } from 'lucide-react';
import TutorialPanel from './TutorialPanel';
import DocumentationPanel from './DocumentationPanel/DocumentationPanel';
import PatternsPanel from './PatternsPanel/PatternsPanel';
import DecisionLogPanel from './DecisionLogPanel';

type LearnTab = 'tutorials' | 'docs' | 'patterns' | 'decision-log';

const TABS: Array<{ id: LearnTab; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'tutorials', label: 'Tutorials', Icon: GraduationCap },
    { id: 'docs', label: 'Docs', Icon: BookOpen },
    { id: 'patterns', label: 'Patterns', Icon: LayoutGrid },
    { id: 'decision-log', label: 'Decision Log', Icon: ClipboardList },
];

const LearnHubPanel: React.FC = () => {
    const [tab, setTab] = useState<LearnTab>('tutorials');
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {TABS.map(({ id, label, Icon }) => {
                    const active = tab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                border: 'none',
                                borderBottom: active ? '2px solid #a855f7' : '2px solid transparent',
                                background: 'transparent',
                                color: active ? 'var(--slate-100)' : 'var(--slate-400)',
                                fontWeight: active ? 700 : 500,
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    );
                })}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Suspense fallback={null}>
                    {tab === 'tutorials' && <TutorialPanel />}
                    {tab === 'docs' && <DocumentationPanel />}
                    {tab === 'patterns' && <PatternsPanel />}
                    {tab === 'decision-log' && <DecisionLogPanel />}
                </Suspense>
            </div>
        </div>
    );
};

export default LearnHubPanel;
