export interface PoolDef {
  id: string;
  name: string;
  color: string;
  description: string;
  providers: string[];
}

export const POOL_DEFS: PoolDef[] = [
  { id: 'fast', name: 'Fast Compute', color: '#f59e0b', description: 'Low-latency inference for real-time agents', providers: ['groq', 'nvidia'] },
  { id: 'balanced', name: 'Balanced', color: '#3b82f6', description: 'General-purpose routing with cost-quality tradeoff', providers: ['gemini', 'openrouter', 'google'] },
  { id: 'free', name: 'Free Tier', color: '#10b981', description: 'Zero-cost models with quota limits for experimentation', providers: ['groq', 'google', 'openrouter'] },
  { id: 'experimental', name: 'Experimental', color: '#8b5cf6', description: 'New/unstable providers and bleeding-edge models', providers: ['nvidia', 'openrouter', 'together', 'fireworks', 'deepseek', 'mistral', 'cohere'] },
];
