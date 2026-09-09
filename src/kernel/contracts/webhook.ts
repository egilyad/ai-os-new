import { EVENTS } from '../events/event-names';

export type WebhookProvider = 'slack' | 'telegram' | 'discord';
export type WebhookEventType = typeof EVENTS.NOTIFICATION | typeof EVENTS.KEY_QUOTA_EXCEEDED | 'policy:violation' | typeof EVENTS.KEY_STATE_CHANGED | 'chat:stream:error' | typeof EVENTS.COMPROMISE_SIGNAL | 'key:compromised' | 'key:rotated';

export interface WebhookConfig {
  id: string;
  provider: WebhookProvider;
  name: string;
  webhookUrl: string;
  enabled: boolean;
  events: WebhookEventType[];
  createdAt: number;
  template?: string;
}
