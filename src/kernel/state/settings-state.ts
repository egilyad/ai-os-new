export interface SettingsStateSnapshot {
  readonly theme: 'dark' | 'light';
  readonly language: 'en' | 'ru';
  readonly streamingEnabled: boolean;
  readonly fallbackEnabled: boolean;
  readonly debugMode: boolean;
  readonly autoHealthCheck: boolean;
  readonly explorationFactor: number;
  readonly slaMode: string;
  readonly defaultMode: string;
  readonly activeProfile: string | null;
  readonly profileCount: number;
}
