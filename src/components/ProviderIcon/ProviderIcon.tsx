import React from 'react';
import { Sparkles, Network, Cpu, Zap, Eye, Box, Bot, Brain, Rocket, Cloud, Database, Layers, Globe, Wand2, Star, Wind, Sun, Shield } from 'lucide-react';

interface Props {
  provider: string;
  size?: number;
  className?: string;
}

const ProviderIcon: React.FC<Props> = ({ provider, size = 18, className = '' }) => {
  const norm = (provider || '').toLowerCase();

  const getIcon = (): { Icon: React.ElementType; color: string; bg: string } => {
    switch (norm) {
      case 'openai':
        return { Icon: Cpu, color: '#10a37f', bg: 'rgba(16, 163, 127, 0.1)' };
      case 'anthropic':
        return { Icon: Box, color: '#d97757', bg: 'rgba(217, 119, 87, 0.1)' };
      case 'gemini':
      case 'google':
        return { Icon: Sparkles, color: '#4285f4', bg: 'rgba(66, 133, 244, 0.1)' };
      case 'groq':
        return { Icon: Zap, color: '#f55036', bg: 'rgba(245, 80, 54, 0.1)' };
      case 'nvidia':
        return { Icon: Eye, color: '#76b900', bg: 'rgba(118, 185, 0, 0.1)' };
      case 'openrouter':
        return { Icon: Network, color: 'var(--purple)', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'mistral':
        return { Icon: Wind, color: '#ff7000', bg: 'rgba(255, 112, 0, 0.1)' };
      case 'cohere':
        return { Icon: Layers, color: '#3069d6', bg: 'rgba(48, 105, 214, 0.1)' };
      case 'perplexity':
        return { Icon: Brain, color: '#1a1a1a', bg: 'rgba(26, 26, 26, 0.1)' };
      case 'together':
        return { Icon: Rocket, color: '#0066ff', bg: 'rgba(0, 102, 255, 0.1)' };
      case 'fireworks':
        return { Icon: Sparkles, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
      case 'deepseek':
        return { Icon: Database, color: '#5569ff', bg: 'rgba(85, 105, 255, 0.1)' };
      case 'llama':
      case 'meta':
        return { Icon: Bot, color: '#0668e1', bg: 'rgba(6, 104, 225, 0.1)' };
      case 'huggingface':
      case 'hf':
        return { Icon: Star, color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.1)' };
      case 'azure':
        return { Icon: Cloud, color: '#008ad7', bg: 'rgba(0, 138, 215, 0.1)' };
      case 'aws':
      case 'bedrock':
        return { Icon: Globe, color: '#ff9900', bg: 'rgba(255, 153, 0, 0.1)' };
      case 'xai':
      case 'grok':
        return { Icon: Wand2, color: '#000000', bg: 'rgba(0, 0, 0, 0.1)' };
      case 'cerebras':
        return { Icon: Sun, color: '#ff6b35', bg: 'rgba(255, 107, 53, 0.1)' };
      case 'cloudflare':
        return { Icon: Shield, color: '#f38020', bg: 'rgba(243, 128, 32, 0.1)' };
      case 'blackbox':
        return { Icon: Box, color: '#1a1a2e', bg: 'rgba(26, 26, 46, 0.1)' };
      case 'scaleway':
        return { Icon: Globe, color: '#4f0599', bg: 'rgba(79, 5, 153, 0.1)' };
      case 'cometapi':
        return { Icon: Star, color: '#00b4d8', bg: 'rgba(0, 180, 216, 0.1)' };
      case 'github':
        return { Icon: Bot, color: '#6e40c9', bg: 'rgba(110, 64, 201, 0.1)' };
      default:
        return { Icon: Box, color: 'var(--slate-400)', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  const { Icon, color, bg } = getIcon();

  return (
    <div
      className={`provider-icon-wrapper ${className}`}
      aria-label={provider}
      style={{
        width: size + 8,
        height: size + 8,
        background: bg,
        border: `1px solid ${color}40`,
      }}
    >
      <Icon size={size} color={color} strokeWidth={2.5} />
    </div>
  );
};

export default React.memo(ProviderIcon);
