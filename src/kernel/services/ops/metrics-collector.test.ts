import { describe, expect, it } from 'vitest';
import { MetricsCollector } from './metrics-collector';
import { MetricsService } from './metrics-service';

function makeEvents() {
    const reg: Record<string, Array<(d?: unknown) => void>> = {};
    return {
        on: (e: string, cb: (d?: unknown) => void) => {
            (reg[e] ??= []).push(cb);
            return () => {};
        },
        emit: (e: string, d?: unknown) => {
            (reg[e] ?? []).forEach((cb) => cb(d));
        },
    };
}

describe('MetricsCollector', () => {
    it('пишет llm.request/llm.latency/tokens на chat:stream:end', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('chat:stream:end', { latency: 120, tokens: { input: 10, output: 20 } });
        const snap = metrics.snapshot();
        expect(snap['llm.request'].summary.sum).toBe(1);
        expect(snap['llm.latency'].summary.max).toBe(120);
        expect(snap['llm.tokens_output'].summary.sum).toBe(20);
    });

    it('пишет llm.error на chat:stream:error', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('chat:stream:error');
        expect(metrics.snapshot()['llm.error'].summary.sum).toBe(1);
    });

    it('пишет tool.exec/tool.latency на tool:executed', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('tool:executed', { tool: 't-web', ok: true, latencyMs: 42 });
        const snap = metrics.snapshot();
        expect(snap['tool.exec{tool=t-web}'].summary.sum).toBe(1);
        expect(snap['tool.latency'].summary.max).toBe(42);
    });

    it('пишет memory.writes на memory:updated', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('memory:updated');
        expect(metrics.snapshot()['memory.writes'].summary.sum).toBe(1);
    });

    it('destroy отписывает подписки', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        collector.destroy();
        events.emit('chat:stream:end', { latency: 1 });
        expect(metrics.snapshot()['llm.request']).toBeUndefined();
    });

    it('пишет router.decision/router.fallback на router:signal', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('router:signal', { provider: 'x', success: true, wasFallback: false });
        events.emit('router:signal', { provider: 'y', success: true, wasFallback: true });
        const snap = metrics.snapshot();
        expect(snap['router.decision'].summary.sum).toBe(2);
        expect(snap['router.fallback'].summary.sum).toBe(1);
    });

    it('пишет debate.rounds на debate:runtime:round:ended', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('debate:runtime:round:ended', { sessionId: 's1', round: 1 });
        events.emit('debate:runtime:round:ended', { sessionId: 's1', round: 2 });
        expect(metrics.snapshot()['debate.rounds'].summary.sum).toBe(2);
    });

    it('пишет memory.reads на memory:remembered и debate.agent_turns на agent:responded', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('memory:remembered', { memoryId: 'm1' });
        events.emit('debate:runtime:agent:responded', { sessionId: 's1', agentId: 'a1' });
        const snap = metrics.snapshot();
        expect(snap['memory.reads'].summary.sum).toBe(1);
        expect(snap['debate.agent_turns'].summary.sum).toBe(1);
    });

    it('пишет tool.error на tool:execution:error', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('tool:execution:error', { toolId: 't-web', error: 'x' });
        expect(metrics.snapshot()['tool.error'].summary.sum).toBe(1);
    });

    it('пишет policy.violations на policy:violation', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('policy:violation', { policyId: 'p1' });
        expect(metrics.snapshot()['policy.violations'].summary.sum).toBe(1);
    });

    it('пишет debate.verdicts/verdict_confidence на verdict:generated', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('debate:verdict:generated', { sessionId: 's1', confidence: 0.8 });
        const snap = metrics.snapshot();
        expect(snap['debate.verdicts'].summary.sum).toBe(1);
        expect(snap['debate.verdict_confidence'].summary.max).toBe(0.8);
    });

    it('пишет provider.probe/active/latency на key:probe:result', () => {
        const events = makeEvents();
        const metrics = new MetricsService();
        const collector = new MetricsCollector(events as never, metrics);
        collector.start();
        events.emit('key:probe:result', { provider: 'gemini', status: 'active', latency: 80 });
        const snap = metrics.snapshot();
        expect(snap['provider.probe'].summary.sum).toBe(1);
        expect(snap['provider.active{provider=gemini}'].summary.sum).toBe(1);
        expect(snap['provider.latency{provider=gemini}'].summary.max).toBe(80);
    });
});
