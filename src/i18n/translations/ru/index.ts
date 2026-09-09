import { nav } from './nav';
import { common } from './common';
import { errors } from './errors';
import { settings } from './settings';
import { debate } from './debate';
import { agents } from './agents';
import { memory } from './memory';
import { chat } from './chat';
import { providers } from './providers';
import { dashboard } from './dashboard';
import { analytics } from './analytics';
import { quality } from './quality';
import { budget } from './budget';
import { observability } from './observability';
import { integrations } from './integrations';
import { governance } from './governance';
import { workspace } from './workspace';

const ru: Record<string, string> = {
    ...nav,
    ...common,
    ...errors,
    ...settings,
    ...debate,
    ...agents,
    ...memory,
    ...chat,
    ...providers,
    ...dashboard,
    ...analytics,
    ...quality,
    ...budget,
    ...observability,
    ...integrations,
    ...governance,
    ...workspace,
};

export { ru };
