import React, { useState } from 'react';
import PanelLoader from '../PanelLoader';
import { RichTextEditor } from './RichTextEditor';
import { CodeEditor } from './CodeEditor';
import { DslCanvas } from './DslCanvas';
import { JsonSchemaEditor } from './JsonSchemaEditor';

const EXAMPLE_SCHEMA = {
    type: 'object' as const,
    title: 'Debate Config',
    properties: {
        topic: { type: 'string' as const, title: 'Topic', description: 'Debate topic' },
        maxRounds: {
            type: 'integer' as const,
            title: 'Max Rounds',
            default: 3,
            minimum: 1,
            maximum: 20,
        },
        temperature: {
            type: 'number' as const,
            title: 'Temperature',
            default: 0.7,
            minimum: 0,
            maximum: 1,
        },
        strategy: {
            type: 'string' as const,
            title: 'Strategy',
            enum: ['round_robin', 'socratic', 'argument_tree', 'jury_trial'],
            default: 'round_robin',
        },
        enableAudience: { type: 'boolean' as const, title: 'Enable Audience', default: true },
    },
    required: ['topic'],
};

const EditorsPanel: React.FC = () => {
    const [tab, setTab] = useState<'richtext' | 'code' | 'canvas' | 'schema'>('richtext');
    const [richtextValue, setRichtextValue] = useState(
        '<p>Welcome to <strong>SuperAgents OS</strong>.</p><p>This is a rich text editor powered by <em>TipTap</em>.</p>',
    );
    const [codeValue, setCodeValue] = useState(
        '// SuperAgents DSL\nconst topology = {\n  id: "debate-flow",\n  nodes: [\n    { id: "router", type: "router" },\n    { id: "agent-1", type: "agent", config: { role: "pro" } },\n    { id: "agent-2", type: "agent", config: { role: "con" } },\n    { id: "judge", type: "judge" },\n  ],\n  edges: [\n    { from: "router", to: "agent-1" },\n    { from: "router", to: "agent-2" },\n    { from: "agent-1", to: "judge" },\n    { from: "agent-2", to: "judge" },\n  ],\n};',
    );
    const [schemaValue, setSchemaValue] = useState<Record<string, unknown>>({
        topic: 'AI Safety',
        maxRounds: 5,
        temperature: 0.7,
        strategy: 'round_robin',
        enableAudience: true,
    });
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: '0.5rem',
                }}
            >
                {[
                    { id: 'richtext' as const, label: 'Rich Text', icon: '📝' },
                    { id: 'code' as const, label: 'Code Editor', icon: '💻' },
                    { id: 'canvas' as const, label: 'DSL Canvas', icon: '🔷' },
                    { id: 'schema' as const, label: 'JSON Schema', icon: '📋' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: tab === t.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                            color: tab === t.id ? '#60a5fa' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: tab === t.id ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}
                    >
                        <span>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Rich Text Tab */}
            {tab === 'richtext' && (
                <div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        TipTap Rich Text Editor — for prompts, descriptions, documentation
                    </div>
                    <RichTextEditor
                        value={richtextValue}
                        onChange={setRichtextValue}
                        placeholder="Start writing your debate prompt..."
                        height={300}
                    />
                    <details style={{ marginTop: '0.5rem' }}>
                        <summary
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            HTML Output
                        </summary>
                        <pre
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--text-muted)',
                                overflow: 'auto',
                                maxHeight: 100,
                                marginTop: '0.3rem',
                                padding: '0.5rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '4px',
                            }}
                        >
                            {richtextValue}
                        </pre>
                    </details>
                </div>
            )}

            {/* Code Editor Tab */}
            {tab === 'code' && (
                <div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Monaco Code Editor — for DSL topologies, TypeScript, JSON, YAML
                    </div>
                    <CodeEditor
                        value={codeValue}
                        onChange={setCodeValue}
                        language="typescript"
                        height={400}
                    />
                </div>
            )}

            {/* DSL Canvas Tab */}
            {tab === 'canvas' && (
                <div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        DSL Canvas — visual topology editor with React Flow. Drag nodes, connect
                        them, build your debate DAG.
                    </div>
                    <DslCanvas height={500} />
                </div>
            )}

            {/* JSON Schema Tab */}
            {tab === 'schema' && (
                <div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        JSON Schema Editor — visual config editing from schema definitions
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div
                            style={{
                                flex: 1,
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    padding: '0.3rem 0.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                FORM
                            </div>
                            <JsonSchemaEditor
                                schema={EXAMPLE_SCHEMA}
                                value={schemaValue}
                                onChange={setSchemaValue}
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    padding: '0.3rem 0.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                JSON OUTPUT
                            </div>
                            <pre
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-primary)',
                                    overflow: 'auto',
                                    margin: 0,
                                    padding: '0.5rem',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {JSON.stringify(schemaValue, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function EditorsPanelWrapper() {
    return (
        <PanelLoader title="Editors">
            <EditorsPanel />
        </PanelLoader>
    );
}
