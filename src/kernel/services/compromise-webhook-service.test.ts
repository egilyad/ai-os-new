import { describe, it, expect, vi } from 'vitest';
import { CompromiseWebhookService } from './compromise-webhook-service';

function makeDeps() {
  return {
    eventBus: { emit: vi.fn() },
    keyService: { compromiseByFingerprint: vi.fn().mockReturnValue(true) },
  };
}

describe('CompromiseWebhookService', () => {
  it('should handle GitHub secret scanning payload', () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    const payload = {
      action: 'created',
      alert: { secret_type_display: 'OpenAI API Key' },
      repository: { full_name: 'user/repo' },
    };
    const ok = svc.handleGitHubPayload(payload);
    expect(ok).toBe(true);
    expect(deps.eventBus.emit).toHaveBeenCalledWith('key:compromise:signal', {
      fingerprint: 'openai',
      source: 'GitHub Secret Scanning (user/repo, OpenAI API Key)',
    });
  });

  it('should skip resolved GitHub alerts', () => {
    const svc = new CompromiseWebhookService(makeDeps());
    const ok = svc.handleGitHubPayload({ action: 'resolved' });
    expect(ok).toBe(false);
  });

  it('should skip GitHub payload without alert', () => {
    const svc = new CompromiseWebhookService(makeDeps());
    const ok = svc.handleGitHubPayload({ action: 'created' });
    expect(ok).toBe(false);
  });

  it('should handle Sentry alert payload', () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    const payload = {
      triggered_rule: 'API Key Leak',
      issue: { title: 'Exposed secret in env' },
    };
    const ok = svc.handleSentryPayload(payload);
    expect(ok).toBe(true);
    expect(deps.eventBus.emit).toHaveBeenCalledWith('key:compromise:signal', {
      id: undefined,
      fingerprint: 'Exposed secret in env',
      source: 'Sentry Alert (API Key Leak)',
    });
  });

  it('should handle empty Sentry payload gracefully', () => {
    const svc = new CompromiseWebhookService(makeDeps());
    const ok = svc.handleSentryPayload({});
    expect(ok).toBe(true);
  });

  it('should emit custom signal', () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    const ok = svc.emitSignal({ id: 'custom-1', source: 'custom' });
    expect(ok).toBe(true);
    expect(deps.eventBus.emit).toHaveBeenCalledWith('key:compromise:signal', {
      id: 'custom-1',
      fingerprint: undefined,
      source: 'custom',
    });
  });

  it('should reject signal without id or fingerprint', () => {
    const svc = new CompromiseWebhookService(makeDeps());
    const ok = svc.emitSignal({ source: 'custom' });
    expect(ok).toBe(false);
  });

  it('should route webhook requests by source', async () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    await svc.onWebhookRequest('custom', { id: 'route-test', source: 'custom' });
    expect(deps.eventBus.emit).toHaveBeenCalled();
  });

  it('should call compromiseByFingerprint on manual compromise', () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    const ok = svc.manuallyCompromise('key-1');
    expect(ok).toBe(true);
    expect(deps.keyService.compromiseByFingerprint).toHaveBeenCalledWith('key-1', 'manual');
  });

  it('should infer provider from secret type string', () => {
    const deps = makeDeps();
    const svc = new CompromiseWebhookService(deps);
    const tests: [string, string][] = [
      ['OpenAI API Key', 'openai'],
      ['openrouter token', 'openrouter'],
      ['Anthropic key', 'anthropic'],
      ['gemini secret', 'gemini'],
      ['groq api', 'groq'],
      ['unknown type', 'unknown type'],
    ];
    for (const [input, expected] of tests) {
      svc.handleGitHubPayload({
        action: 'created',
        alert: { secret_type_display: input },
      });
      expect(deps.eventBus.emit).toHaveBeenLastCalledWith('key:compromise:signal', {
        fingerprint: expected,
        source: expect.stringContaining(input),
      });
    }
  });
});
