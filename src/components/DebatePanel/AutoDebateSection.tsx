import React, { useState } from 'react'
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { Zap, Loader2, BarChart3, RefreshCw, Play, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion'
import type { AutoDebateResult, BatchTestResult, ProviderWinRate } from '../../kernel/contracts/auto-debate';

interface Props {
  onAutoDebate: (options?: { topic?: string; category?: string; maxParticipants?: number; maxRounds?: number }) => Promise<AutoDebateResult>;
  onStressTest: (count?: number) => Promise<AutoDebateResult[]>;
  onBatchTest: (topic: string, runs?: number) => Promise<BatchTestResult>;
  results: AutoDebateResult[];
  winRates: ProviderWinRate[];
  onClear: () => void;
}

const TOPIC_CATEGORIES = [
  { value: '', label: 'Random (any)' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'society', label: 'Society' },
  { value: 'philosophy', label: 'Philosophy' },
];

const AutoDebateSection: React.FC<Props> = ({ onAutoDebate, onStressTest, onBatchTest, results, winRates, onClear }) => {
  const [category, setCategory] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [maxRounds, setMaxRounds] = useState(3);
  const [loading, setLoading] = useState<'single' | 'stress' | 'batch' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchTopic, setBatchTopic] = useState('');
  const [batchRuns, setBatchRuns] = useState(3);
  const [stressCount, setStressCount] = useState(5);
  const [batchResult, setBatchResult] = useState<BatchTestResult | null>(null);
  const clearError = useAutoClearError(setError);

  const handleQuick = async () => {
    setLoading('single'); setError(null);
    try {
      await onAutoDebate({
        topic: customTopic || undefined,
        category: category || undefined,
        maxParticipants,
        maxRounds,
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); clearError(); }
    finally { setLoading(null); }
  };

  const handleStress = async () => {
    setLoading('stress'); setError(null);
    try { await onStressTest(stressCount); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); clearError(); }
    finally { setLoading(null); }
  };

  const handleBatch = async () => {
    if (!batchTopic) { setError('Enter a topic for batch test'); clearError(); return; }
    setLoading('batch'); setBatchResult(null); setError(null);
    try { const r = await onBatchTest(batchTopic, batchRuns); setBatchResult(r); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); clearError(); }
    finally { setLoading(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <Zap size={22} color="#f59e0b" />
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}>Auto-Debate</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', background: 'rgba(100,116,139,0.15)', padding: '2px 8px', borderRadius: 6 }}>BETA</span>
      </div>

      {error && (
        <div style={{ padding: '0.5rem 1rem', background: 'var(--error-tint)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)} style={{ cursor: 'pointer', marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', padding: 0 }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <select value={category} onChange={e => setCategory(e.target.value)} className="debate-input debate-select" aria-label="Topic category">
          {TOPIC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="number" min={2} max={20} value={maxParticipants} onChange={e => setMaxParticipants(parseInt(e.target.value) || 6)} className="debate-input" aria-label="Max participants" placeholder="Max participants" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)} className="debate-input" placeholder="Custom topic (optional)" aria-label="Custom topic" />
        <input type="number" min={1} max={20} value={maxRounds} onChange={e => setMaxRounds(parseInt(e.target.value) || 3)} className="debate-input" aria-label="Max rounds" placeholder="Max rounds" />
      </div>

      <button onClick={handleQuick} disabled={loading !== null} className="btn-primary" style={{ padding: '0.85rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(90deg, #f59e0b, #d97706)', fontWeight: 800 }}>
        {loading === 'single' ? <Loader2 size={20} className="spinning" /> : <Play size={20} fill="currentColor" />} Run Auto-Debate
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontWeight: 600 }}>Stress Test</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min={1} max={50} value={stressCount} onChange={e => setStressCount(parseInt(e.target.value) || 5)} className="debate-input" style={{ width: 70 }} aria-label="Stress test count" />
            <button onClick={handleStress} disabled={loading !== null} className="btn-secondary" style={{ flex: 1, padding: '0.5rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
              {loading === 'stress' ? <Loader2 size={16} className="spinning" /> : <RefreshCw size={16} />} Run
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontWeight: 600 }}>Batch Test</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min={1} max={20} value={batchRuns} onChange={e => setBatchRuns(parseInt(e.target.value) || 3)} className="debate-input" style={{ width: 50 }} aria-label="Batch runs" />
            <input type="text" value={batchTopic} onChange={e => setBatchTopic(e.target.value)} className="debate-input" style={{ flex: 1 }} placeholder="Topic for batch" aria-label="Batch topic" />
            <button onClick={handleBatch} disabled={loading !== null} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
              {loading === 'batch' ? <Loader2 size={16} className="spinning" /> : <BarChart3 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Batch results */}
      {batchResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--slate-50)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color="#10b981" /> Batch Results: "{batchResult.topic}"
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {batchResult.winRates.map(w => (
              <div key={w.provider} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: 100, fontSize: '0.8rem', color: 'var(--slate-400)', fontWeight: 600, flexShrink: 0 }}>{w.provider}</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${w.winRate * 100}%` }} transition={{ duration: 0.5 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, #10b981, #059669)`, borderRadius: 4 }} />
                </div>
                <span style={{ width: 50, textAlign: 'right', fontSize: '0.8rem', color: 'var(--slate-50)', fontWeight: 700 }}>{Math.round(w.winRate * 100)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* History summary */}
      {results.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-50)' }}>History ({results.length} debates)</h4>
            <button onClick={onClear} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: 8, color: 'var(--error)' }}>
              <X size={12} /> Clear
            </button>
          </div>
          {winRates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {winRates.map(w => (
                <div key={w.provider} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ width: 90, color: 'var(--slate-400)', fontWeight: 600 }}>{w.provider}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${w.winRate * 100}%` }} transition={{ duration: 0.5 }}
                      style={{ height: '100%', background: w.winRate > 0.6 ? '#10b981' : w.winRate > 0.3 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                  </div>
                  <span style={{ width: 40, textAlign: 'right', fontWeight: 700, color: 'var(--slate-50)' }}>{Math.round(w.winRate * 100)}%</span>
                  <span style={{ color: 'var(--slate-500)' }}>({w.wins}/{w.debates})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoDebateSection;
