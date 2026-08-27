import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Cpu, AlertCircle, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { keyService } from '../../kernel/instances';
import { useConfirm } from '../../hooks/useConfirm';

interface ToolsTabProps {
  keyId: string;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

const ToolsTab: React.FC<ToolsTabProps> = ({ keyId }) => {
  const { confirm, ConfirmDialog } = useConfirm();
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});

  const runAction = async (action: string, fn: () => Promise<void>) => {
    setActionStates(prev => ({ ...prev, [action]: 'loading' }));
    try {
      await fn();
      setActionStates(prev => ({ ...prev, [action]: 'done' }));
      setTimeout(() => setActionStates(prev => ({ ...prev, [action]: 'idle' })), 2000);
    } catch {
      setActionStates(prev => ({ ...prev, [action]: 'error' }));
      setTimeout(() => setActionStates(prev => ({ ...prev, [action]: 'idle' })), 3000);
    }
  };

  const actionIcon = (action: string, defaultIcon: React.ReactNode, _defaultColor: string) => {
    const state = actionStates[action];
    if (state === 'loading') return <Loader2 size={24} color="#3b82f6" className="animate-spin" />;
    if (state === 'done') return <CheckCircle2 size={24} color="#10b981" />;
    return <>{defaultIcon}</>;
  };

  const actionLabel = (action: string, defaultLabel: string, loadingLabel: string, doneLabel: string) => {
    const state = actionStates[action];
    if (state === 'loading') return loadingLabel;
    if (state === 'done') return doneLabel;
    return defaultLabel;
  };

  const handleReset = async () => {
    if (!await confirm({ title: 'Reset Statistics', message: 'Reset all metrics and history? This action is irreversible.', variant: 'danger' })) return;
    runAction('reset', () => keyService.resetStats(keyId));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button 
          onClick={() => runAction('refresh', () => keyService.refreshModels(keyId))}
          disabled={actionStates['refresh'] === 'loading'}
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: actionStates['refresh'] === 'loading' ? 'wait' : 'pointer', border: '1px solid rgba(255,255,255,0.05)', opacity: actionStates['refresh'] === 'loading' ? 0.6 : 1 }}
        >
          {actionIcon('refresh', <RefreshCw size={24} color="#3b82f6" />, '#3b82f6')}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{actionLabel('refresh', 'Refresh Models', 'Refreshing...', 'Refreshed!')}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fetch available models via API</div>
          </div>
        </button>

        <button 
          onClick={() => runAction('stress', () => keyService.runBenchmark(keyId))}
          disabled={actionStates['stress'] === 'loading'}
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: actionStates['stress'] === 'loading' ? 'wait' : 'pointer', border: '1px solid rgba(255,255,255,0.05)', opacity: actionStates['stress'] === 'loading' ? 0.6 : 1 }}
        >
          {actionIcon('stress', <Cpu size={24} color="#10b981" />, '#10b981')}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{actionLabel('stress', 'Stress Test', 'Running...', 'Done!')}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Run benchmark to evaluate performance</div>
          </div>
        </button>

        <button 
          onClick={() => runAction('advisor', () => keyService.runAdvisor(keyId))}
          disabled={actionStates['advisor'] === 'loading'}
          className="glass-panel" 
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: actionStates['advisor'] === 'loading' ? 'wait' : 'pointer', border: '1px solid rgba(255,255,255,0.05)', opacity: actionStates['advisor'] === 'loading' ? 0.6 : 1 }}
        >
          {actionIcon('advisor', <Lightbulb size={24} color="#f59e0b" />, '#f59e0b')}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{actionLabel('advisor', 'Run Advisor', 'Analyzing...', 'Analyzed!')}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Analyze provider and suggest optimizations</div>
          </div>
        </button>
      </div>

      <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 12, padding: '1.25rem', border: '1px solid rgba(239,68,68,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertCircle size={14} color="#ef4444" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--error)' }}>DANGER ZONE</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Reset all metrics and history for this provider. This action is irreversible.</p>
        <button 
          onClick={handleReset}
          disabled={actionStates['reset'] === 'loading'}
          className="btn-secondary" 
          style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)', opacity: actionStates['reset'] === 'loading' ? 0.6 : 1 }}
        >
          {actionStates['reset'] === 'loading' ? 'Resetting...' : 'Reset Statistics'}
        </button>
      </div>
      <ConfirmDialog />
    </motion.div>
  );
};

export default ToolsTab;
