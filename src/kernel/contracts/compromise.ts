export type WebhookSource = 'github' | 'sentry' | 'custom';

export interface CompromiseSignal {
  id?: string;
  fingerprint?: string;
  source: WebhookSource;
  raw?: unknown;
}

export interface GitHubSecretAlert {
  alert?: {
    secret_type_display?: string;
    push_protection_bypassed?: boolean;
    validity?: string;
  };
  action?: string;
  repository?: { full_name?: string };
}

export interface SentryAlert {
  event?: { event_id?: string };
  triggered_rule?: string;
  url?: string;
  issue?: { title?: string; culprit?: string };
}
