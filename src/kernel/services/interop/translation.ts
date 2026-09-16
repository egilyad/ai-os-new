/**
 * Protocol Translation Layer — Wave 6.5 (pure functions, no dependencies).
 *
 * Translates between A2A ↔ MCP ↔ ACP ↔ webhook ↔ websocket ↔ internal
 * EventBus envelopes. Every external message normalizes to GatewayEnvelope;
 * `translate()` re-frames it for the target protocol.
 */
import type { GatewayEnvelope, InteropProtocol } from '../../types/interop-types';
import { genId } from '../../../utils/gen-id';

const PROTOCOL_HINTS: Record<InteropProtocol, string> = {
    a2a: 'a2a/v1',
    mcp: 'json-rpc/2.0',
    acp: 'acp/v1',
    webhook: 'http-post',
    websocket: 'ws-frame',
    internal: 'eventbus',
};

export function toEnvelope(input: {
    from: string;
    to: string;
    protocol: InteropProtocol;
    kind?: GatewayEnvelope['kind'];
    payload?: Record<string, unknown>;
    traceId?: string;
}): GatewayEnvelope {
    return {
        id: genId('gw'),
        from: input.from,
        to: input.to,
        protocol: input.protocol,
        kind: input.kind ?? 'task',
        payload: { ...(input.payload ?? {}), _via: PROTOCOL_HINTS[input.protocol] },
        traceId: input.traceId,
        createdAt: Date.now(),
    };
}

export function translateEnvelope(envelope: GatewayEnvelope, target: InteropProtocol): GatewayEnvelope {
    if (envelope.protocol === target) return { ...envelope };
    const converted: Record<string, unknown> = { ...envelope.payload };
    // MCP frames as JSON-RPC; A2A/ACP keep task/result semantics; webhooks flatten.
    if (target === 'mcp') {
        converted['jsonrpc'] = '2.0';
        converted['method'] = envelope.kind === 'result' ? 'task/result' : 'task/send';
    }
    if (target === 'webhook') {
        converted['event'] = `agent.${envelope.kind}`;
        converted['traceId'] = envelope.traceId ?? envelope.id;
    }
    return {
        ...envelope,
        id: genId('gw'),
        protocol: target,
        payload: { ...converted, _via: PROTOCOL_HINTS[target], _from: envelope.protocol },
    };
}

/** A2A error contract (code + message + retryable hint). */
export function a2aError(code: string, message: string, retryable = true): Record<string, unknown> {
    return { error: { code, message: message.slice(0, 500), retryable } };
}
