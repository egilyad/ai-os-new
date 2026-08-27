import type { ILogger } from './logger';
import type { ICrossTabStateSync } from './cross-tab-state';
import type { IEventBus } from '../types/interfaces';

export interface LLMContext {
    logger: ILogger;
    crossTabStateSync?: ICrossTabStateSync;
    eventBus?: IEventBus;
}
