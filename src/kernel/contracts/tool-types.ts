export type ToolCategory = 'search' | 'code' | 'web' | 'data' | 'connector' | 'utility' | 'custom';

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  type: 'script' | 'api' | 'database';
  category?: ToolCategory;
  language?: 'python' | 'javascript' | 'sql';
  code?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
  rateLimit?: number;
  timeout?: number;
  allowedDomains?: string[];
  parameters?: unknown;
};
