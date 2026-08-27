import { describe, it, expect, vi } from 'vitest';
import { LLMRequestBuilder } from './request-builder';
import {
  MiddlewarePipeline,
  ValidationMiddleware,
  ModerationMiddleware,
  LoggingMiddleware,
} from './middleware-pipeline';
import type { MiddlewareContext, LLMMiddleware } from './middleware-pipeline';

describe('LLMRequestBuilder', () => {
  it('should build request objects using chainable methods fluently', () => {
    const { messages, options } = LLMRequestBuilder.create()
      .addSystemMessage('You are a helpful assistant')
      .addUserMessage('Hello, system!')
      .setTemperature(0.8)
      .setMaxOutputTokens(500)
      .addTool({ type: 'function', function: { name: 'calculator' } })
      .setResponseFormat('json_object')
      .addSafetySetting('HARM_CATEGORY_HARASSMENT', 'BLOCK_LOW_AND_ABOVE')
      .build();

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].content).toBe('Hello, system!');
    expect(options.temperature).toBe(0.8);
    expect(options.maxOutputTokens).toBe(500);
    expect(options.responseFormat?.type).toBe('json_object');
    expect(options.tools).toHaveLength(1);
    expect(options.safetySettings).toHaveLength(1);
  });
});

describe('MiddlewarePipeline', () => {
  const dummySender = async (ctx: MiddlewareContext) => {
    return {
      content: `Response from ${ctx.model}`,
      latency: 50,
      tokens: 10,
    };
  };

  it('should execute middleware chain sequentially and return response', async () => {
    const pipeline = new MiddlewarePipeline();
    const mockOrder: string[] = [];

    const middleware1: LLMMiddleware = {
      name: 'M1',
      process: async (ctx, next) => {
        mockOrder.push('M1_start');
        const res = await next(ctx);
        mockOrder.push('M1_end');
        return res;
      },
    };

    const middleware2: LLMMiddleware = {
      name: 'M2',
      process: async (ctx, next) => {
        mockOrder.push('M2_start');
        const res = await next(ctx);
        mockOrder.push('M2_end');
        return res;
      },
    };

    pipeline.use(middleware1).use(middleware2);

    const context: MiddlewareContext = {
      messages: [{ role: 'user', content: 'test' }],
      model: 'test-model',
      apiKey: 'key',
    };

    const response = await pipeline.execute(context, dummySender);

    expect(response.content).toBe('Response from test-model');
    expect(mockOrder).toEqual(['M1_start', 'M2_start', 'M2_end', 'M1_end']);
  });

  it('should throw errors in ValidationMiddleware when context is invalid', async () => {
    const pipeline = new MiddlewarePipeline().use(new ValidationMiddleware());

    const badContext: MiddlewareContext = {
      messages: [],
      model: 'test',
      apiKey: '',
    };

    await expect(pipeline.execute(badContext, dummySender)).rejects.toThrow('API key is missing');
  });

  it('should moderates toxic content in ModerationMiddleware', async () => {
    const pipeline = new MiddlewarePipeline().use(new ModerationMiddleware(['toxic_input']));

    const context: MiddlewareContext = {
      messages: [{ role: 'user', content: 'hello toxic_input world' }],
      model: 'test',
      apiKey: 'key',
    };

    await expect(pipeline.execute(context, dummySender)).rejects.toThrow('contains banned phrase');
  });

  it('should trigger logging handlers in LoggingMiddleware', async () => {
    const logSpy = vi.fn();
    const pipeline = new MiddlewarePipeline().use(new LoggingMiddleware(logSpy));

    const context: MiddlewareContext = {
      messages: [{ role: 'user', content: 'hello' }],
      model: 'test-model',
      apiKey: 'key',
    };

    await pipeline.execute(context, dummySender);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        success: true,
      }),
    );
  });
});
