import type { ILifecycle } from './lifecycle';

/** I.1 — Copilot Studio-style topics/entities/variables/generative answers. */
export interface ICopilotService extends ILifecycle {
    defineTopic(input: { name: string; triggerPhrases: string[]; reply?: string }): Promise<string>;
    defineEntity(topicId: string, name: string, kind: 'list' | 'pattern', values: string[]): Promise<void>;
    handleMessage(conversationId: string, text: string): Promise<string>;
    setVariable(conversationId: string, key: string, value: unknown): Promise<void>;
}

/** I.1 — Bedrock-style action groups + KB profiles + guardrails + trace. */
export interface IBedrockService extends ILifecycle {
    defineActionGroup(name: string, tools: string[]): Promise<string>;
    callAction(groupId: string, tool: string, args?: Record<string, unknown>): Promise<string>;
    ingestWithProfile(title: string, content: string, chunking?: 'fixed' | 'semantic' | 'hierarchical'): Promise<string>;
    guard(text: string): Promise<{ ok: boolean; redacted: string; hits: string[] }>;
    addDeniedTopic(topic: string): Promise<void>;
    trace(): Promise<string[]>;
}

/** I.1 — Dialogflow CX-style flows/pages/routes/parameters/fulfillment. */
export interface ICxfService extends ILifecycle {
    createFlow(name: string): Promise<string>;
    addPage(flowId: string, name: string, entryMessage?: string): Promise<string>;
    addRoute(flowId: string, fromPage: string, intent: string, toPage: string): Promise<void>;
    handleMessage(flowId: string, sessionId: string, text: string, params?: Record<string, unknown>): Promise<string>;
}

/** I.1 — Agentforce-style topics with reasoning transcript + trust check. */
export interface IAgentforceService extends ILifecycle {
    defineTopic(input: { label: string; instructions: string; actions?: string[] }): Promise<string>;
    run(topicId: string, request: string): Promise<{ transcript: string; result: string }>;
}

/** I.2 — Kore.ai-style entity extractors. */
export interface IEntityService extends ILifecycle {
    extractList(text: string, values: string[]): Promise<string[]>;
    extractPattern(text: string, pattern: string): Promise<string[]>;
    extractDatetime(text: string): Promise<string[]>;
}

/** I.2 — Kore.ai-style dialog task with interruption. */
export interface IKoreService extends ILifecycle {
    startDialog(botId: string, sessionId: string): Promise<string>;
    sendMessage(dialogId: string, text: string): Promise<string>;
}

/** I.2 — Yellow.ai-style outbound campaigns. */
export interface ICampaignService extends ILifecycle {
    createCampaign(name: string, message: string, audience?: string[]): Promise<string>;
    addAudience(campaignId: string, userId: string): Promise<void>;
    broadcast(campaignId: string): Promise<{ delivered: number }>;
    stats(campaignId: string): Promise<Record<string, number>>;
}

/** I.2 — Lindy-style AI employees. */
export interface IEmployeeService extends ILifecycle {
    hire(input: { name: string; personaId?: string; toolkitId?: string; triggers?: string[] }): Promise<string>;
    fire(employeeId: string): Promise<void>;
    listEmployees(): Promise<Array<{ id: string; name: string; triggers: string[] }>>;
    runOnTrigger(trigger: string, payload?: string): Promise<string[]>;
}

/** I.3 — SmolAgents-style code-as-action (mini-DSL over ToolRunner). */
export interface ICodeAgentService extends ILifecycle {
    run(task: string, maxSteps?: number): Promise<{ answer: string; steps: string[] }>;
}

/** I.3 — StackAI-style assistants (persona + dataset + toolkit). */
export interface IAssistantService extends ILifecycle {
    defineAssistant(input: { name: string; personaId?: string; datasetId?: string; toolkitId?: string }): Promise<string>;
    chat(assistantId: string, message: string): Promise<string>;
    listAssistants(): Promise<Array<{ id: string; name: string }>>;
}

/** I.3 — Gumloop-style forms + for-each + vault refs. */
export interface IGumService extends ILifecycle {
    defineForm(formId: string, fields: string[]): Promise<void>;
    submitForm(formId: string, values: Record<string, string>): Promise<void>;
    forEach(items: string[], kind: 'crew' | 'graph', refId: string): Promise<string[]>;
    vaultRef(key: string): Promise<string>;
}
