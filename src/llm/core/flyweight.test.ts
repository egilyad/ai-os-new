import { describe, it, expect } from 'vitest';
import { LLMFlyweightConfig } from './flyweight';

describe('LLMFlyweightConfig', () => {
  it('should pool identical options and return frozen instances', () => {
    LLMFlyweightConfig.clear();

    const opt1 = { temperature: 0.7, maxOutputTokens: 256 };
    const opt2 = { temperature: 0.7, maxOutputTokens: 256 };

    const flyweight1 = LLMFlyweightConfig.get(opt1);
    const flyweight2 = LLMFlyweightConfig.get(opt2);

    expect(flyweight1).toBe(flyweight2); // Same frozen reference in heap memory
    expect(Object.isFrozen(flyweight1)).toBe(true);
    expect(LLMFlyweightConfig.getPoolSize()).toBe(1);
  });

  it('should handle different parameters as distinct objects in pool', () => {
    LLMFlyweightConfig.clear();

    const opt1 = { temperature: 0.7 };
    const opt2 = { temperature: 0.9 };

    const flyweight1 = LLMFlyweightConfig.get(opt1);
    const flyweight2 = LLMFlyweightConfig.get(opt2);

    expect(flyweight1).not.toBe(flyweight2);
    expect(LLMFlyweightConfig.getPoolSize()).toBe(2);
  });
});
