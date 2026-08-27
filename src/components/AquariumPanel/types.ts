export interface FishState {
  id: string;
  provider: string;
  x: number;
  y: number;
  scale: number;
  speed: number;
  direction: number;
  color: string;
  isPulsing?: boolean;
  energy: number;
  status: string;
  lastWords?: string;
  personality: 'brave' | 'shy' | 'lazy' | 'hyper';
  wagDuration: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type?: 'oxygen' | 'data' | 'error';
}

export interface Ripple {
  id: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Jellyfish {
  id: number;
  x: number;
  size: number;
  speed: number;
  delay: number;
  tentacles: Array<{ minHeight: number; maxHeight: number; duration: number }>;
}

export interface Seaweed {
  id: number;
  left: number;
  width: number;
  height: number;
  minRotate: number;
  maxRotate: number;
  duration: number;
  delay: number;
}
