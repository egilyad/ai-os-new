import React, { useState, useCallback } from 'react';
import { Bot, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { WorkflowManifest, WorkflowNodeType } from '../../kernel/types/builder-types';

const NODE_KEYWORDS: Array<{ keywords: string[]; type: WorkflowNodeType }> = [
    { keywords: ['debate', 'дискуссия', 'аргумент', 'спор'], type: 'debate' },
    { keywords: ['junction', 'соедин', 'связ', 'сопостав'], type: 'junction' },
    { keywords: ['forum', 'форум', 'обсужден'], type: 'forum' },
    { keywords: ['synthesis', 'синтез', 'обобщ'], type: 'synthesis' },
    { keywords: ['interpret', 'интерпрет', 'анализ'], type: 'interpretation' },
    { keywords: ['filter', 'фильтр', 'провер', 'услов', 'gate'], type: 'gate' },
];

function generateFromPrompt(prompt: string): WorkflowManifest {
    const lower = prompt.toLowerCase();
    const nodes: Array<{
        id: string;
        type: WorkflowNodeType;
        label: string;
        position: { x: number; y: number };
    }> = [];
    const edges: Array<{ id: string; from: string; to: string }> = [];

    nodes.push({ id: 'entry', type: 'agent', label: 'Entry Agent', position: { x: 250, y: 0 } });

    let lastNodeId = 'entry';
    let yPos = 120;

    for (const rule of NODE_KEYWORDS) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
            const nodeId = `${rule.type}_${nodes.length}`;
            nodes.push({
                id: nodeId,
                type: rule.type,
                label: rule.type.charAt(0).toUpperCase() + rule.type.slice(1),
                position: { x: 250, y: yPos },
            });
            edges.push({ id: `e_${lastNodeId}_${nodeId}`, from: lastNodeId, to: nodeId });
            lastNodeId = nodeId;
            yPos += 120;
        }
    }

    nodes.push({ id: 'exit', type: 'agent', label: 'Exit Agent', position: { x: 250, y: yPos } });
    edges.push({ id: `e_${lastNodeId}_exit`, from: lastNodeId, to: 'exit' });

    const now = Date.now();
    return {
        workflow_id: `wf_${now}_${Math.random().toString(36).slice(2, 8)}`,
        title: prompt.slice(0, 80),
        description: prompt,
        version: 1,
        status: 'draft',
        trigger: { kind: 'manual', source: 'prompt' },
        nodes: nodes.map((n) => ({ ...n, config: {} })),
        edges: edges.map((e) => ({ ...e, trigger: undefined, condition: undefined })),
        createdAt: now,
        updatedAt: now,
    };
}

interface BuilderAISidebarProps {
    onGenerate: (manifest: WorkflowManifest) => void;
}

const BuilderAISidebar: React.FC<BuilderAISidebarProps> = ({ onGenerate }) => {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [lastResult, setLastResult] = useState<string | null>(null);

    const handleGenerate = useCallback(() => {
        if (!input.trim()) return;
        setStatus('generating');
        try {
            const manifest = generateFromPrompt(input);
            setLastResult(
                `Generated: ${manifest.nodes.length} nodes, ${manifest.edges.length} edges`,
            );
            setStatus('success');
            onGenerate(manifest);
        } catch {
            setStatus('error');
            setLastResult('Failed to generate topology');
        }
    }, [input, onGenerate]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
            }
        },
        [handleGenerate],
    );

    return (
        <div
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                }}
            >
                <Bot size={16} color="#8b5cf6" aria-hidden="true" />
                AI Topology Generator
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                Describe your workflow and AI will generate a cognitive topology
            </p>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Run a debate on security, then synthesize findings..."
                rows={3}
                style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '0.5rem',
                    color: 'var(--slate-200)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                }}
            />
            <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={status === 'generating' || !input.trim()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                }}
            >
                {status === 'generating' ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                    <Send size={14} aria-hidden="true" />
                )}
                Generate
            </button>
            {lastResult && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.75rem',
                        color: status === 'error' ? '#ef4444' : '#10b981',
                    }}
                >
                    {status === 'error' ? (
                        <AlertCircle size={12} aria-hidden="true" />
                    ) : (
                        <CheckCircle size={12} aria-hidden="true" />
                    )}
                    {lastResult}
                </div>
            )}
        </div>
    );
};

export default BuilderAISidebar;
