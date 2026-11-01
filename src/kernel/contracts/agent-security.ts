/**
 * Контракты безопасности агентов (SPEC_12 / OWASP LLM Top 10).
 *
 * Покрывает ключевые открытые риски:
 *  - LLM07 System Prompt Leakage → detectSecretsInPrompt;
 *  - LLM02 Sensitive Information Disclosure → redactSensitive;
 *  - LLM10 Unbounded Consumption → enforceMaxIterations;
 *  - LLM01 Indirect Prompt Injection → isSuspiciousInstruction.
 */

export interface SecretScanResult {
    found: boolean;
    /** Категории найденных секретов (api_key / telegram_token / bearer / ...). */
    categories: string[];
    count: number;
}

export interface IAgentSecurityGuard {
    detectSecretsInPrompt(prompt: string): SecretScanResult;
    redactSensitive(text: string): string;
    /** Санитизация текста перед отправкой в LLM (LLM02). */
    sanitizePromptForLLM(text: string): string;
    enforceMaxIterations(iterations: number, max: number): boolean;
    isSuspiciousInstruction(text: string): boolean;
}
