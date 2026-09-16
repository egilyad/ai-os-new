import type { IDiagnosticsEngine, DiagnosticFinding, ProviderDiagnostic } from '../../contracts/advisor'
import { CONFIG } from '../config-registry';

export interface DiagnosticsEngineDeps {
  keyService: {
    getKeys: () => Array<{
      id: string; provider: string; status: string; label?: string; latency?: number;
      createdAt?: number;
      stats?: {
        successCount?: number; errorCount?: number;
        extended?: {
          usageToday?: { requests: number };
          errorBreakdown?: { rateLimit?: number; timeout?: number };
        };
      };
    }>;
  };
  freeTierLimits: Record<string, { requestsPerDay: number; tokensPerDay: number }>;
}

export class DiagnosticsEngine implements IDiagnosticsEngine {
  private deps: DiagnosticsEngineDeps;
  private providerErrorHistory: Record<string, Array<{ message: string; count: number; firstSeen: number; lastSeen: number }>> = {};
  private readonly config = CONFIG.services.diagnostics;

  constructor(deps: DiagnosticsEngineDeps) {
    this.deps = deps;
  }

  private trackError(provider: string, error: string) {
    if (!this.providerErrorHistory[provider]) this.providerErrorHistory[provider] = [];
    const existing = this.providerErrorHistory[provider].find(e => e.message === error);
    if (existing) { existing.count++; existing.lastSeen = Date.now(); }
    else { this.providerErrorHistory[provider].push({ message: error, count: 1, firstSeen: Date.now(), lastSeen: Date.now() }); }
    if (this.providerErrorHistory[provider].length > this.config.providerErrorHistoryLimit) this.providerErrorHistory[provider].shift();
  }

  analyzeProviderError(provider: string, error: string): ProviderDiagnostic {
    this.trackError(provider, error);

    const errHistory = this.providerErrorHistory[provider] || [];
    const recentCount = errHistory.filter(e => Date.now() - e.lastSeen < this.config.recentErrorWindowMs).reduce((s, e) => s + e.count, 0);
    const escalation = recentCount > this.config.escalationRecentCount ? ' — escalating rapidly' : '';
    const findings: DiagnosticFinding[] = [];
    const now = Date.now();

    let title: string;
    let description: string;
    let impact: 'high' | 'medium' | 'low';

    if (error.includes('401') || (error.includes('API key') && error.includes('invalid'))) {
      const keys = this.deps.keyService.getKeys().filter(k => k.provider.toLowerCase() === provider.toLowerCase());
      const keyAge = keys.length > 0 ? Math.round((Date.now() - (keys[0]?.createdAt ?? Date.now())) / 3600000) : 0;
      title = `${provider} Key Authentication Failure${escalation}`;
      description = keyAge < 1
        ? `This ${provider} key was just added (${keyAge}h ago) — it may be incorrectly copied or missing required permissions.`
        : `This ${provider} key is returning 401/unauthorized. Keys typically expire or are revoked via the provider dashboard.`;
      description += ` ${recentCount > 0 ? `Failed ${recentCount} time(s) in the last 5 minutes.` : ''} Recommended: generate a new key in the ${provider} dashboard.`;
      impact = 'high';
      findings.push({ severity: 'critical', category: 'auth', message: title, explanation: description, suggestion: `Generate a new key in the ${provider} dashboard.`, timestamp: now });
    } else if (error.includes('403') || error.includes('forbidden')) {
      title = `${provider} Access Forbidden`;
      description = `The ${provider} key lacks permissions for the requested model or endpoint. This often happens after account downgrade or API changes. Check your ${provider} account billing and enabled APIs.`;
      impact = 'high';
      findings.push({ severity: 'critical', category: 'auth', message: title, explanation: description, suggestion: `Check ${provider} account billing and enabled APIs.`, timestamp: now });
    } else if (error.includes('Rate limit') || error.includes('429')) {
      const keys = this.deps.keyService.getKeys().filter(k => k.provider.toLowerCase() === provider.toLowerCase());
      const activeKeys = keys.filter(k => k.status === 'active').length;
      const suggestion = activeKeys < this.config.activeKeyScaleTarget
        ? `Only ${activeKeys} active key(s) found. Adding more keys distributes load and reduces 429 probability.`
        : `${activeKeys} active keys already configured. Consider adding queue delay or switching to a less loaded provider.`;
      title = `${provider} Rate Limited${escalation}`;
      description = `Provider ${provider} is returning 429 (rate limited). ${suggestion} Current error frequency: ${recentCount} in 5min.`;
      impact = recentCount > this.config.escalationRecentCount * 2 ? 'high' : 'medium';
      findings.push({ severity: impact === 'high' ? 'critical' : 'warning', category: 'quota', message: title, explanation: description, suggestion: 'Add queue delay or distribute load across multiple keys.', metric: `${recentCount} in 5min`, timestamp: now });
    } else if (error.includes('timeout') || error.includes('timed out')) {
      title = `${provider} Request Timeout`;
      description = `Requests to ${provider} are timing out. ${recentCount > 0 ? `Error frequency: ${recentCount} in 5min.` : ''}`;
      impact = 'medium';
      findings.push({ severity: 'warning', category: 'latency', message: title, explanation: description, suggestion: 'Consider switching to a faster provider for this request type.', timestamp: now });
    } else if (error.includes('quota') || error.includes('exceeded')) {
      title = `${provider} Quota Exhausted`;
      description = `The ${provider} account has exceeded its allocation. This key will be skipped until quota resets. Add a second ${provider} key to increase daily capacity.`;
      impact = 'high';
      findings.push({ severity: 'critical', category: 'quota', message: title, explanation: description, suggestion: `Add another ${provider} key to increase daily capacity.`, timestamp: now });
    } else if (error.includes('model') && (error.includes('not found') || error.includes('unavailable'))) {
      title = `${provider} Model Unavailable`;
      description = `The requested model is not available on this ${provider} key. The model may have been deprecated or the key may not have access.`;
      impact = 'medium';
      findings.push({ severity: 'warning', category: 'usage', message: title, explanation: description, suggestion: 'Try switching to a different model or provider.', timestamp: now });
    } else {
      title = `${provider} Error${escalation}`;
      description = `Provider ${provider} returned an error: "${error.slice(0, 200)}". ${recentCount > this.config.escalationRecentCount ? 'High error rate suggests provider degradation.' : 'Check provider status page for ongoing incidents.'}`;
      impact = recentCount > this.config.escalationRecentCount * 2 ? 'high' : 'medium';
      findings.push({ severity: impact === 'high' ? 'critical' : 'warning', category: 'reliability', message: title, explanation: description, suggestion: 'Check provider status page for ongoing incidents.', timestamp: now });
    }

    return { provider, error, title, description, impact, findings, healthScore: this.getHealthScore(findings) };
  }

  analyzeKey(keyId: string): DiagnosticFinding[] {
    const keys = this.deps.keyService.getKeys();
    const key = keys.find(k => k.id === keyId);
    if (!key) return [];

    const findings: DiagnosticFinding[] = [];
    const ext = key.stats?.extended;
    const now = Date.now();

    if (key.status === 'error') {
      findings.push({
        severity: 'critical', category: 'auth', timestamp: now,
        message: `${key.provider} key is in error state`,
        explanation: `Key "${key.label}" has been marked as error. This often indicates an invalid or revoked API key.`,
        suggestion: `Try re-entering the key or generating a new one from the ${key.provider} dashboard.`,
      });
    }

    if (key.status === 'inactive') {
      findings.push({
        severity: 'warning', category: 'auth', timestamp: now,
        message: `${key.provider} key is inactive`,
        explanation: `Key "${key.label}" was manually disabled or automatically suspended after repeated failures.`,
        suggestion: 'Enable the key from the providers list or check the provider dashboard for any account issues.',
      });
    }

    const usageToday = ext?.usageToday?.requests || 0;
    const limit = this.deps.freeTierLimits[key.provider.toLowerCase()]?.requestsPerDay;
    if (limit && usageToday > 0) {
      const pct = (usageToday / limit) * 100;
      if (pct >= this.config.quotaCriticalPct) {
        findings.push({
          severity: 'critical', category: 'quota', timestamp: now,
          message: `${key.label} at ${Math.round(pct)}% daily quota`,
          explanation: `This key has used ${usageToday.toLocaleString()} of ${limit.toLocaleString()} daily requests (${Math.round(pct)}%).`,
          suggestion: `Add another ${key.provider} key to distribute the load.`,
          metric: `${usageToday}/${limit}`,
        });
      } else if (pct >= this.config.quotaWarningPct) {
        findings.push({
          severity: 'warning', category: 'quota', timestamp: now,
          message: `${key.label} at ${Math.round(pct)}% daily quota`,
          explanation: `This key has used ${usageToday.toLocaleString()} of ${limit.toLocaleString()} daily requests (${Math.round(pct)}%).`,
          suggestion: 'Monitor the quota trend. Consider adding redundant keys.',
          metric: `${usageToday}/${limit}`,
        });
      }
    }

    if (key.latency) {
      if (key.latency > this.config.latencyCriticalMs) {
        findings.push({
          severity: 'critical', category: 'latency', timestamp: now,
          message: `${key.label} latency is very high (${key.latency}ms)`,
          explanation: `Average response time is ${key.latency}ms, which is significantly above the normal range.`,
          suggestion: 'Try switching to a different model or provider.',
          metric: `${key.latency}ms`,
        });
      } else if (key.latency > this.config.latencyWarningMs) {
        findings.push({
          severity: 'warning', category: 'latency', timestamp: now,
          message: `${key.label} latency is elevated (${key.latency}ms)`,
          explanation: `Average response time is ${key.latency}ms. While still usable, this is above the optimal range.`,
          suggestion: 'Monitor the trend. Consider switching to a faster provider.',
          metric: `${key.latency}ms`,
        });
      }
    }

    const errors = ext?.errorBreakdown;
    if (errors) {
      if ((errors.rateLimit || 0) > this.config.rateLimitWarningCount) {
        findings.push({
          severity: 'warning', category: 'reliability', timestamp: now,
          message: `High rate-limiting on ${key.label}`,
          explanation: `This key has been rate-limited ${errors.rateLimit} times. The provider is throttling requests.`,
          suggestion: 'Add a small queue delay (200-500ms) between requests, or distribute load across multiple keys.',
          metric: `${errors.rateLimit} rate limits`,
        });
      }
      if ((errors.timeout || 0) > this.config.timeoutCriticalCount) {
        findings.push({
          severity: 'critical', category: 'reliability', timestamp: now,
          message: `Frequent timeouts on ${key.label}`,
          explanation: `This key has timed out ${errors.timeout} times. Persistent timeouts indicate the provider or model is not responding.`,
          suggestion: 'Increase the timeout threshold for this provider, or switch to a more responsive alternative.',
          metric: `${errors.timeout} timeouts`,
        });
      }
    }

    const successCount = key.stats?.successCount || 0;
    const errorCount = key.stats?.errorCount || 0;
    const totalRequests = successCount + errorCount;
    if (totalRequests > this.config.successRateMinRequests) {
      const successRate = successCount / totalRequests;
      if (successRate < this.config.successRateCritical) {
        findings.push({
          severity: 'critical', category: 'reliability', timestamp: now,
          message: `Low success rate on ${key.label} (${Math.round(successRate * 100)}%)`,
          explanation: `Only ${Math.round(successRate * 100)}% of requests to this key succeed (${errorCount} errors out of ${totalRequests} total).`,
          suggestion: 'Verify the key is still valid in the provider dashboard.',
          metric: `${Math.round(successRate * 100)}%`,
        });
      } else if (successRate < this.config.successRateWarning) {
        findings.push({
          severity: 'warning', category: 'reliability', timestamp: now,
          message: `Success rate declining on ${key.label} (${Math.round(successRate * 100)}%)`,
          explanation: `Success rate is ${Math.round(successRate * 100)}% (${errorCount} errors out of ${totalRequests} total).`,
          suggestion: 'Monitor the trend. If the success rate continues to drop, investigate the error types.',
          metric: `${Math.round(successRate * 100)}%`,
        });
      }
    }

    return findings;
  }

  generateSummary(findings: DiagnosticFinding[]): string {
    if (findings.length === 0) return 'All systems nominal. No issues detected.';
    const critical = findings.filter(f => f.severity === 'critical');
    const warnings = findings.filter(f => f.severity === 'warning');
    let summary = '';
    if (critical.length > 0) summary += `${critical.length} critical issue${critical.length > 1 ? 's' : ''} detected`;
    if (warnings.length > 0) { if (summary) summary += ', '; summary += `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`; }
    if (!summary) summary = `${findings.length} informational finding${findings.length > 1 ? 's' : ''}`;
    return summary;
  }

  getHealthScore(findings: DiagnosticFinding[]): number {
    if (findings.length === 0) return 100;
    let score = 100;
    for (const f of findings) {
      if (f.severity === 'critical') score -= 25;
      else if (f.severity === 'warning') score -= 10;
      else score -= 3;
    }
    return Math.max(0, score);
  }
}
