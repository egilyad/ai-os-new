export const FEATURE_FLAGS = {
  MEMORY_ENABLED: 'memory.enabled',
  MEMORY_SEMANTIC: 'memory.semantic',
  MEMORY_RAG_ON_CHAT: 'memory.ragOnChat',
  MEMORY_AUTO_STORE: 'memory.autoStore',
  DEBATE_RUNTIME_ENGINE: 'debate.runtimeEngine',
  DEBATE_ENGINE_ONLY: 'debate.engineOnly',
  EXPERIMENTAL_VISUALS: 'ui.experimentalVisuals',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
