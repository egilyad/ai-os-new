import { useState, useCallback, useRef, useEffect } from 'react';
import { runtime } from '../kernel/runtime';
import { eventBus } from '../kernel/events/event-bus';
import { rootLogger } from '../kernel/instances';
import { EVENTS } from '../kernel/events/event-names';
import type { KeyImportReport, KeyIntelligenceInput } from '../kernel/contracts/key-intelligence';

interface UseKeyIntelligenceReturn {
    report: KeyImportReport | null;
    loading: boolean;
    error: string;
    runPipeline: (input: KeyIntelligenceInput) => Promise<void>;
    reset: () => void;
}

export function useKeyIntelligence(): UseKeyIntelligenceReturn {
    const [report, setReport] = useState<KeyImportReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const runPipeline = useCallback(async (input: KeyIntelligenceInput) => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const ac = new AbortController();
        abortRef.current = ac;

        setLoading(true);
        setError('');
        setReport(null);
        try {
            const result = await runtime
                .getService<{ run(input: KeyIntelligenceInput): Promise<KeyImportReport> }>(
                    'keyIntelligencePipeline',
                )
                .run(input);
            if (!mountedRef.current || ac.signal.aborted) return;
            setReport(result);
        } catch (err: unknown) {
            if (!mountedRef.current || ac.signal.aborted) return;
            const msg = err instanceof Error ? err.message : 'Pipeline execution failed';
            setError(msg);
            // OBS-82: emit pipeline error to monitoring
            eventBus.emit(EVENTS.KEY_INTELLIGENCE_PIPELINE_ERROR, { message: msg, input });
            rootLogger.error('useKeyIntelligence', 'Pipeline execution failed', { error: msg });
        } finally {
            setLoading(false);
            if (abortRef.current === ac) abortRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setReport(null);
        setLoading(false);
        setError('');
    }, []);

    return { report, loading, error, runPipeline, reset };
}
