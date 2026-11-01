import type {
    IAgentSecurityGuard,
    SecretScanResult,
} from '../../contracts/agent-security';

const SECRET_PATTERNS: Array<{ category: string; re: RegExp }> = [
    { category: 'api_key', re: /\b(sk-[A-Za-z0-9]{20,}|[A-Za-z0-9]{32,})\b/g },
    { category: 'telegram_token', re: /\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g },
    { category: 'bearer', re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g },
    { category: 'slack_token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
    { category: 'private_key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const SUSPICIOUS_PHRASES = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /disregard\s+(?:all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+/i,
    /system\s+prompt/i,
    /do\s+not\s+follow\s+(?:the\s+)?instructions/i,
    /print\s+your\s+system\s+prompt/i,
    /reveal\s+your\s+(?:system\s+)?prompt/i,
];

/**
 * AgentSecurityGuard — детерминированные хелперы безопасности (SPEC_12).
 * Без LLM/сети — быстрые regex-проверки для гейтов.
 */
export class AgentSecurityGuard implements IAgentSecurityGuard {
    detectSecretsInPrompt(prompt: string): SecretScanResult {
        const categories = new Set<string>();
        let count = 0;
        for (const { category, re } of SECRET_PATTERNS) {
            const matches = prompt.match(re);
            if (matches && matches.length > 0) {
                categories.add(category);
                count += matches.length;
            }
        }
        return { found: count > 0, categories: [...categories], count };
    }

    redactSensitive(text: string): string {
        let out = text;
        for (const { re } of SECRET_PATTERNS) {
            out = out.replace(re, '[REDACTED]');
        }
        return out;
    }

    enforceMaxIterations(iterations: number, max: number): boolean {
        return iterations < max;
    }

    isSuspiciousInstruction(text: string): boolean {
        return SUSPICIOUS_PHRASES.some((re) => re.test(text));
    }
}
