import { describe, it, expect } from 'vitest';
import { WhatIfService } from './whatif-service';
import type { ISPolicy } from '../policy-service';

describe('WhatIfService - Policy Dry-Run', () => {
  const mockCognitive = {
    simulateTopologyChange: () => undefined,
    simulateParticipantChange: () => undefined,
  };
  const mockEventBus = { emit: () => {} };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new WhatIfService({ cognitiveIntelligenceService: mockCognitive as any, eventBus: mockEventBus });

  it('should simulate a latency threshold policy dry-run successfully', async () => {
    const policy: ISPolicy = {
      id: 'p-test-latency',
      type: 'latency',
      target_nodes: ['all'],
      value: 1000,
      action: 'block',
    };

    const res = await service.simulatePolicyDryRun(policy);
    expect(res.violationsCount).toBe(3); // Nodes 2, 3, 4 (2200, 1500, 4500)
    expect(res.blockedRequestsCount).toBe(3);
    expect(res.severityLevel).toBe('critical');
    expect(res.blockedNodes).toEqual(['node_2', 'node_3', 'node_4']);
    expect(res.projectedImpact).toContain('block requests on nodes');
  });

  it('should simulate a privacy policy dry-run successfully', async () => {
    const policy: ISPolicy = {
      id: 'p-test-privacy',
      type: 'privacy',
      target_nodes: ['all'],
      value: 'PII_REDACTION',
      action: 'block',
    };

    const res = await service.simulatePolicyDryRun(policy);
    expect(res.violationsCount).toBe(1); // Node_3 has secure@gmail.com
    expect(res.blockedRequestsCount).toBe(1);
    expect(res.blockedNodes).toEqual(['node_3']);
    expect(res.severityLevel).toBe('error');
  });

  it('should record policy dry-run simulation in history records', async () => {
    service.clearHistory();
    const policy: ISPolicy = {
      id: 'p-test-safety',
      type: 'content',
      target_nodes: ['all'],
      value: 'SAFETY_CHECK',
      action: 'mask',
    };

    await service.simulatePolicyDryRun(policy);
    const history = service.getSimulationHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('policy_dry_run');
    expect(history[0].result).toBeDefined();
  });
});
