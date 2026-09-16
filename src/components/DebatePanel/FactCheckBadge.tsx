import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePolling } from '../Common/usePolling';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { debateService } from '../../kernel/instances';
import type { FactCheckResult, FactVerdict } from '../../kernel/services/fact-check-service';

const VERDICT_CONFIG: Record<
    FactVerdict,
    { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
    verified: {
        icon: <CheckCircle2 size={12} />,
        color: 'var(--success)',
        bg: 'rgba(16,185,129,0.12)',
        label: 'Verified',
    },
    disputed: {
        icon: <AlertTriangle size={12} />,
        color: 'var(--warning)',
        bg: 'rgba(245,158,11,0.12)',
        label: 'Disputed',
    },
    false: {
        icon: <XCircle size={12} />,
        color: 'var(--error)',
        bg: 'rgba(239,68,68,0.12)',
        label: 'False',
    },
    no_evidence: {
        icon: <HelpCircle size={12} />,
        color: 'var(--slate-500)',
        bg: 'rgba(100,116,139,0.12)',
        label: 'Unverified',
    },
    pending: {
        icon: <Loader2 size={12} className="provider-spin" />,
        color: 'var(--purple)',
        bg: 'rgba(139,92,246,0.12)',
        label: 'Checking...',
    },
    error: {
        icon: <AlertTriangle size={12} />,
        color: 'var(--error)',
        bg: 'rgba(239,68,68,0.12)',
        label: 'Error',
    },
};

interface FactCheckBadgeProps {
    argumentId: string;
}

export const FactCheckBadge: React.FC<FactCheckBadgeProps> = ({ argumentId }) => {
    const [results, setResults] = useState<FactCheckResult[] | null>(null);
    const [expanded, setExpanded] = useState(false);
    const badgeRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!expanded) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                badgeRef.current &&
                !badgeRef.current.contains(e.target as Node) &&
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node)
            ) {
                setExpanded(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExpanded(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [expanded]);

    const check = useCallback(() => {
        const fc = debateService.factCheckService.getForArgument(argumentId);
        if (fc) setResults(fc.results);
    }, [argumentId]);
    usePolling(check, 10000, expanded);

    if (!results) return null;

    const verdictCounts = results.reduce(
        (acc, r) => {
            acc[r.verdict] = (acc[r.verdict] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const dominantVerdict = (Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'no_evidence') as FactVerdict;
    const config = VERDICT_CONFIG[dominantVerdict];

    return (
        <div ref={badgeRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                    color: config.color,
                    background: config.bg,
                    border: `1px solid ${config.color}30`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
            >
                {config.icon}
                {results.length > 1 ? `${results.length} claims` : config.label}
            </button>

            {expanded &&
                badgeRef.current &&
                createPortal(
                    <div
                        ref={popoverRef}
                        style={{
                            position: 'fixed',
                            zIndex: 9999,
                            padding: 8,
                            borderRadius: 8,
                            minWidth: 280,
                            maxWidth: 360,
                            background: 'rgba(15,15,25,0.95)',
                            border: '1px solid rgba(100,116,139,0.2)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            ...(badgeRef.current
                                ? {
                                      top: badgeRef.current.getBoundingClientRect().bottom + 4,
                                      left: badgeRef.current.getBoundingClientRect().left,
                                  }
                                : {}),
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--slate-200)',
                                marginBottom: 6,
                            }}
                        >
                            Fact-Check Results
                        </div>
                        {results.map((r, _i) => {
                            const vc = VERDICT_CONFIG[r.verdict];
                            return (
                                <div
                                    key={r.claim}
                                    style={{
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        marginBottom: 4,
                                        background: 'rgba(30,30,50,0.6)',
                                        border: `1px solid ${vc.color}20`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span style={{ color: vc.color, display: 'flex' }}>
                                            {vc.icon}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: vc.color,
                                            }}
                                        >
                                            {vc.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: 'var(--slate-500)',
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            {Math.round((r.confidence ?? 0) * 100)}%
                                        </span>
                                    </div>
                                    <div
                                        style={{ fontSize: 10, color: 'var(--slate-400)', lineHeight: 1.3 }}
                                    >
                                        {r.claim.length > 80
                                            ? r.claim.slice(0, 80) + '...'
                                            : r.claim}
                                    </div>
                                    {r.reasoning && (
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: 'var(--slate-500)',
                                                marginTop: 2,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {r.reasoning}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </div>
    );
};
