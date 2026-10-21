import React, { useCallback, useEffect, useState } from 'react';
import { ShieldQuestion, Check, X } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { toolApprovalService } from '../../kernel/instances';
import type { ToolApprovalRequest } from '../../kernel/contracts/tool-approval';
import { ModalShell } from '../ModalShell';

/**
 * ToolApprovalLayer — the human-in-the-loop surface of the tool waterfall.
 *
 * The kernel publishes `tool:approval:requested` whenever a tool call needs a
 * decision; this layer renders the question and answers it through the
 * approval service. Denying is the default (timeout, unmount, unknown id).
 */
export const ToolApprovalLayer: React.FC = () => {
    const [pending, setPending] = useState<ToolApprovalRequest[]>([]);

    // Announce that a human is watching: while nobody is attended the kernel
    // denies an approval request immediately instead of waiting.
    useEffect(() => {
        try {
            toolApprovalService.setAttended(true);
        } catch {
            /* service not registered — the kernel denies on its own */
        }
        return () => {
            try {
                toolApprovalService.setAttended(false);
            } catch {
                /* ignore */
            }
        };
    }, []);

    useEffect(() => {
        const unsub = eventBus.onSafe<ToolApprovalRequest>(
            EVENTS.TOOL_APPROVAL_REQUESTED,
            (request) => {
                setPending((prev) =>
                    prev.some((p) => p.id === request.id)
                        ? prev
                        : [...prev, request],
                );
            },
        );
        return unsub;
    }, []);

    const decide = useCallback((id: string, decision: 'allow' | 'deny') => {
        try {
            toolApprovalService.resolve(id, decision);
        } catch {
            /* service not registered — the request times out on the kernel side */
        }
        setPending((prev) => prev.filter((p) => p.id !== id));
    }, []);

    if (pending.length === 0) return null;

    const request = pending[0]!;
    const inputText =
        request.input === undefined || request.input === null
            ? ''
            : JSON.stringify(request.input, null, 2).slice(0, 1200);

    return (
        <ModalShell
            open
            onClose={() => decide(request.id, 'deny')}
            width={520}
            zIndex={10001}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldQuestion size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Требуется подтверждение</h3>
            </div>

            <p style={{ margin: '0.75rem 0 0.25rem', fontSize: '0.85rem', opacity: 0.85 }}>
                {request.reason}
            </p>

            <div
                style={{
                    margin: '0.5rem 0',
                    fontSize: '0.78rem',
                    opacity: 0.7,
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                }}
            >
                <span>Инструмент: {request.toolId}</span>
                {request.action && <span>Действие: {request.action}</span>}
                {request.agentId && <span>Агент: {request.agentId}</span>}
            </div>

            {inputText && (
                    <pre
                        style={{
                            margin: '0.5rem 0',
                            padding: '0.6rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontSize: '0.72rem',
                            maxHeight: 180,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                    {inputText}
                </pre>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                }}
            >
                <button
                    className="btn btn-secondary"
                    onClick={() => decide(request.id, 'deny')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                    <X size={14} />
                    Отклонить
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => decide(request.id, 'allow')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                    <Check size={14} />
                    Разрешить
                </button>
            </div>

            {pending.length > 1 && (
                <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', opacity: 0.6 }}>
                    Ещё {pending.length - 1} запрос в очереди
                </p>
            )}
        </ModalShell>
    );
};

export default ToolApprovalLayer;
