import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Wand2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusScope } from '@react-aria/focus';
import type { AdapterMessage } from '../../kernel/contracts/provider-adapter';
import { agentService, adapterRegistry, keyService } from '../../kernel/instances';
import { AgentGenerator } from '../../kernel/services/agent-generator';
import { AgentAvatar } from './AgentAvatar';
import { useTranslation } from '../../i18n/useTranslation';

interface AgentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated?: (agentId: string) => void;
}

interface GeneratedConfig {
  name: string;
  roleName: string;
  description: string;
  prompt: string;
  tools: string[];
  temperature: number;
  category: string;
}

const TOOL_LIST = [
  'code_execution', 'file_read', 'file_write', 'web_search', 'web_fetch',
  'data_analysis', 'terminal', 'git', 'database_query', 'api_call',
  'memory_read', 'memory_write', 'agent_spawn', 'notification',
];

export const AgentWizard: React.FC<AgentWizardProps> = ({ isOpen, onClose, onAgentCreated }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const generator = React.useMemo(() => new AgentGenerator({
    sendMessage: async (messages, model, apiKey) => {
      const providers = ['groq', 'gemini', 'openrouter'];
      let adapter = null;
      for (const p of providers) {
        adapter = adapterRegistry.getAdapter(p);
        if (adapter) break;
      }
      if (!adapter) throw new Error('No adapter available');
      const res = await adapter.sendMessage(messages as AdapterMessage[], model, apiKey);
      return { content: res.content };
    },
    getApiKey: (provider) => {
      const keys = keyService.getKeys();
      const key = keys.find(k => k.provider.toLowerCase() === provider.toLowerCase() && k.status === 'active');
      return key?.key;
    },
  }), []);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generator.generate(description);
      setConfig(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!config || !refineInstruction.trim()) return;
    setIsRefining(true);
    setError(null);
    try {
      const result = await generator.refine(config, refineInstruction);
      setConfig(result);
      setRefineInstruction('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Refinement failed');
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreate = async () => {
    if (!config) return;
    setIsCreating(true);
    setError(null);
    try {
      const spawnArgs = generator.configToSpawnArgs(config);
      const agentId = agentService.spawnAgent(spawnArgs.name, undefined, spawnArgs.config);
      if (agentId) {
        setCreated(true);
        onAgentCreated?.(agentId);
        setTimeout(() => { onClose(); setCreated(false); setConfig(null); setDescription(''); }, 1500);
      } else {
        setError('Failed to create agent. Make sure a topology is active.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTool = (tool: string) => {
    if (!config) return;
    const tools = config.tools.includes(tool) ? config.tools.filter(t => t !== tool) : [...config.tools, tool];
    setConfig({ ...config, tools });
  };

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <FocusScope contain restoreFocus autoFocus>
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wizard-title"
            tabIndex={-1}
            style={{ width: 'min(560px, 92vw)', maxHeight: '85vh', overflow: 'auto', background: 'linear-gradient(145deg, rgba(20,20,40,0.98), rgba(15,15,30,0.98))', borderRadius: 16, border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', outline: 'none' }}
          >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(100,116,139,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wand2 size={18} color="white" />
              </div>
              <div>
                <h3 id="wizard-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--slate-200)' }}>{t('agent_wizard.title')}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-500)' }}>{t('agent_wizard.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: '0.5rem' }} aria-label={t('common.close')}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-400)', marginBottom: 6 }}>
                {t('agent_wizard.prompt_label')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('agent_wizard.prompt_placeholder')}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)', background: 'rgba(30,30,50,0.6)', color: 'var(--slate-200)', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              />
              <button
                onClick={handleGenerate}
                disabled={!description.trim() || isGenerating}
                style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: isGenerating ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isGenerating ? <Loader2 size={14} className="provider-spin" /> : <Sparkles size={14} />}
                {isGenerating ? 'Generating...' : 'Generate Agent'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--error-tint)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: '0.8rem', marginBottom: 12 }}>
                {error}
              </div>
            )}

            {/* Generated Config Preview */}
            {config && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(30,30,50,0.5)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <AgentAvatar agentId={`wizard-${config.name}`} size={40} />
                    <div style={{ flex: 1 }}>
                      <input
                        value={config.name}
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--slate-200)', fontSize: '0.95rem', fontWeight: 700, outline: 'none', padding: 0 }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--purple)' }}>{config.roleName}</div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>
                      {config.category}
                    </span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: 4 }}>System Prompt</label>
                    <textarea
                      value={config.prompt}
                      onChange={e => setConfig({ ...config, prompt: e.target.value })}
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(20,20,40,0.5)', color: 'var(--slate-200)', fontSize: '0.8rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: 4 }}>Temperature: {config.temperature.toFixed(1)}</label>
                      <input
                        type="range" min={0} max={2} step={0.1} value={config.temperature}
                        onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginBottom: 6 }}>Tools</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {TOOL_LIST.map(tool => (
                        <button
                          key={tool}
                          onClick={() => handleToggleTool(tool)}
                          style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', border: `1px solid ${config.tools.includes(tool) ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.2)'}`, background: config.tools.includes(tool) ? 'rgba(16,185,129,0.1)' : 'rgba(30,30,50,0.5)', color: config.tools.includes(tool) ? '#10b981' : '#64748b', cursor: 'pointer' }}
                        >
                          {config.tools.includes(tool) && <Check size={10} style={{ marginRight: 3 }} />}
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Refine */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    value={refineInstruction}
                    onChange={e => setRefineInstruction(e.target.value)}
                    placeholder="Refine: 'Make it more creative' / 'Add web search tool'"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(30,30,50,0.5)', color: 'var(--slate-200)', fontSize: '0.8rem', outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleRefine(); }}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={!refineInstruction.trim() || isRefining}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'var(--purple-tint)', color: 'var(--purple)', cursor: isRefining ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                  >
                    {isRefining ? <Loader2 size={12} className="provider-spin" /> : <RefreshCw size={12} />}
                    Refine
                  </button>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || created}
                  style={{ marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: created ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)', color: created ? '#10b981' : 'white', fontWeight: 700, fontSize: '0.85rem', cursor: isCreating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {created ? <><Check size={16} /> Agent Created!</> : isCreating ? <><Loader2 size={16} className="provider-spin" /> Creating...</> : <> <Sparkles size={16} /> Create Agent</>}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
        </FocusScope>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
