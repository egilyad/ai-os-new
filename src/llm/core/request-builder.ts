import type { ChatMessage, SendMessageOptions, Tool, ToolCall } from './types';

export class LLMRequestBuilder {
  private messages: ChatMessage[] = [];
  private options: SendMessageOptions = {};

  static create(): LLMRequestBuilder {
    return new LLMRequestBuilder();
  }

  addSystemMessage(content: string): this {
    this.messages.push({ role: 'system', content });
    return this;
  }

  addUserMessage(content: string): this {
    this.messages.push({ role: 'user', content });
    return this;
  }

  addAssistantMessage(content: string, toolCalls?: ToolCall[]): this {
    this.messages.push({ role: 'assistant', content, toolCalls });
    return this;
  }

  addToolMessage(content: string, toolCallId: string, name: string): this {
    this.messages.push({ role: 'tool', content, toolCallId, name });
    return this;
  }

  addMessages(messages: ChatMessage[]): this {
    this.messages.push(...messages);
    return this;
  }

  setTemperature(temp: number): this {
    this.options.temperature = temp;
    return this;
  }

  setMaxOutputTokens(tokens: number): this {
    this.options.maxOutputTokens = tokens;
    return this;
  }

  setStopSequences(stop: string[]): this {
    this.options.stopSequences = stop;
    return this;
  }

  addTool(tool: Tool): this {
    if (!this.options.tools) this.options.tools = [];
    this.options.tools.push(tool);
    return this;
  }

  setTools(tools: Tool[]): this {
    this.options.tools = tools;
    return this;
  }

  setResponseFormat(type: 'text' | 'json_object', schema?: unknown): this {
    this.options.responseFormat = { type, schema };
    return this;
  }

  addSafetySetting(category: string, threshold: string): this {
    if (!this.options.safetySettings) this.options.safetySettings = [];
    this.options.safetySettings.push({ category, threshold });
    return this;
  }

  build(): { messages: ChatMessage[]; options: SendMessageOptions } {
    return {
      messages: [...this.messages],
      options: structuredClone(this.options),
    };
  }
}
