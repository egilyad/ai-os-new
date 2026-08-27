import { CONFIG } from '../config-registry';

export function getRoundDelayMs(): number {
    return CONFIG?.services?.debate?.roundDelayMs ?? 1000;
}
