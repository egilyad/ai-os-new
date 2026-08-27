
interface ProviderAquariumShapeProps {
  provider: string;
  size: number;
  color: string;
  energy?: number;
}

type ProviderShape = 'default' | 'ray' | 'twin' | 'dart' | 'shell' | 'spiral' | 'crest';

function getShape(provider: string): ProviderShape {
  switch (provider.toLowerCase()) {
    case 'openrouter':
      return 'ray';
    case 'gemini':
      return 'twin';
    case 'groq':
      return 'dart';
    case 'nvidia':
      return 'shell';
    case 'openai':
      return 'spiral';
    case 'anthropic':
      return 'crest';
    default:
      return 'default';
  }
}

const ProviderAquariumShape: React.FC<ProviderAquariumShapeProps> = ({ provider, size, color, energy = 100 }) => {
  const shape = getShape(provider);
  const fillOpacity = energy > 50 ? 0.28 : 0.1;
  const common = {
    stroke: color,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {shape === 'ray' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M7 31c12-15 38-15 50 0-10 11-19 15-25 15S17 42 7 31Z" />
          <path {...common} fill="none" d="M32 18v28M22 30h20M16 36c6 2 26 2 32 0" />
        </>
      )}
      {shape === 'twin' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M10 32c9-10 24-12 34-2 4-4 8-7 12-9-1 6-3 10-7 13 4 3 6 7 7 13-4-2-8-5-12-9-10 10-25 8-34-2Z" />
          <path {...common} fill="none" d="M21 25c3 4 3 10 0 14M32 23c2 6 2 12 0 18" />
        </>
      )}
      {shape === 'dart' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M6 33 39 15l19 18-19 16Z" />
          <path {...common} fill="none" d="M20 32h25M39 15l-5 18 5 16" />
        </>
      )}
      {shape === 'shell' && (
        <>
          <ellipse {...common} cx="32" cy="32" rx="18" ry="13" fill={color} fillOpacity={fillOpacity} />
          <path {...common} fill="none" d="M18 32H8M56 32H46M25 20c4 7 4 17 0 24M32 19v26M39 20c-4 7-4 17 0 24" />
        </>
      )}
      {shape === 'spiral' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M8 32c8-11 22-14 34-7l14-7-5 14 5 14-14-7C30 46 16 43 8 32Z" />
          <path {...common} fill="none" d="M31 23c7 1 10 8 7 13-3 6-12 6-14 1-2-4 1-8 5-8 3 0 5 2 5 5" />
        </>
      )}
      {shape === 'crest' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M9 32c10-13 26-16 39-6l9-8-2 14 2 14-9-8C35 48 19 45 9 32Z" />
          <path {...common} fill="none" d="M23 23 35 32 23 41M38 25v14" />
        </>
      )}
      {shape === 'default' && (
        <>
          <path {...common} fill={color} fillOpacity={fillOpacity} d="M8 32c8-10 20-14 32-8l14-8-4 16 4 16-14-8C28 46 16 42 8 32Z" />
          <circle cx="21" cy="29" r="2.5" fill={color} />
          <path {...common} fill="none" d="M30 24c3 5 3 11 0 16" />
        </>
      )}
    </svg>
  );
};

export default ProviderAquariumShape;
