import { GoogleGenerativeAI, type GenerativeModel, type Part } from '@google/generative-ai';
import { rootLogger } from './logger-service';
import type {
    ChatMessage,
    SendMessageOptions,
    ProviderResponse,
    GroundingMetadata,
    VertexSearchConfig,
} from '../../kernel/types/llm-types';

const LOGGER = rootLogger.child('GoogleGenAI');

function buildSDKContents(messages: ChatMessage[]): {
    contents: { role: 'user' | 'model'; parts: Part[] }[];
    systemInstruction?: { role: 'user'; parts: Part[] };
} {
    const contents: { role: 'user' | 'model'; parts: Part[] }[] = [];
    let systemParts: Part[] | undefined;

    for (const m of messages) {
        if (m.role === 'system') {
            if (m.content) {
                if (!systemParts) systemParts = [];
                systemParts.push({ text: m.content });
            }
            continue;
        }

        const role = m.role === 'assistant' ? 'model' : 'user';
        const parts: Part[] = [];

        if (m.inlineData) {
            for (const d of m.inlineData) {
                parts.push({
                    inlineData: { mimeType: d.mimeType, data: d.data },
                } as unknown as Part);
            }
        }

        if (m.content) {
            parts.push({ text: m.content });
        }

        if (m.toolCalls) {
            for (const tc of m.toolCalls) {
                try {
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments),
                        },
                    } as unknown as Part);
                } catch {
                    parts.push({ text: `[tool_call: ${tc.function.name}]` });
                }
            }
        }

        if (m.role === 'tool' && m.content) {
            let parsedResponse: unknown;
            try {
                parsedResponse = JSON.parse(m.content);
            } catch {
                parsedResponse = { raw: m.content, _parseError: true };
            }
            parts.push({
                functionResponse: {
                    name: m.name || 'unknown',
                    response: parsedResponse,
                },
            } as unknown as Part);
        }

        if (parts.length > 0) {
            contents.push({ role, parts });
        }
    }

    return {
        contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: '' }] }],
        systemInstruction: systemParts ? { role: 'user', parts: systemParts } : undefined,
    };
}

export class GoogleGenAIService {
    #client: GoogleGenerativeAI | null = null;
    #apiKey: string | null = null;
    #lastKeyFetch = 0;
    #KEY_CACHE_TTL = 60_000;

    setApiKey(apiKey: string): void {
        if (apiKey === this.#apiKey && this.#client) return;
        this.#apiKey = apiKey;
        this.#client = new GoogleGenerativeAI(apiKey);
    }

    clearApiKey(): void {
        this.#apiKey = null;
        this.#client = null;
        this.#lastKeyFetch = 0;
    }

    get isConfigured(): boolean {
        return !!this.#client;
    }

    async ensureConfigured(): Promise<void> {
        if (this.#client && Date.now() - this.#lastKeyFetch < this.#KEY_CACHE_TTL) return;
        const { keyService } = await import('../instances/core-references');
        const key = keyService.selectFromPool('gemini');
        if (!key?.key) {
            this.clearApiKey();
            throw new Error('No Gemini key available — add a Gemini key in Key Manager');
        }
        if (key.key !== this.#apiKey) {
            this.#apiKey = key.key;
            this.#client = new GoogleGenerativeAI(key.key);
        }
        this.#lastKeyFetch = Date.now();
    }

    #model(modelName = 'gemini-3.1-flash-lite', options?: SendMessageOptions): GenerativeModel {
        if (!this.#client) throw new Error('GoogleGenAI not configured — call setApiKey() first');
        const generationConfig: Record<string, unknown> = {};
        if (options?.temperature !== undefined) generationConfig.temperature = options.temperature;
        if (options?.maxOutputTokens !== undefined)
            generationConfig.maxOutputTokens = options.maxOutputTokens;
        if (options?.stopSequences) generationConfig.stopSequences = options.stopSequences;
        if (options?.responseFormat?.type === 'json_object') {
            generationConfig.responseMimeType = 'application/json';
        }
        // thinkingConfig is part of generationConfig in Gemini API
        if (options?.thinkingConfig) {
            generationConfig.thinkingConfig = options.thinkingConfig;
        }
        // tools, safetySettings are top-level model params, NOT generationConfig.
        // Passing them inside generationConfig causes "Unknown name 'tools'" 400.
        const modelParams: Record<string, unknown> = {
            model: modelName,
            generationConfig,
        };
        if (options?.googleSearchGrounding) {
            modelParams.tools = [{ googleSearch: {} }];
        }
        if (options?.vertexSearchGrounding) {
            const tools = (modelParams.tools as Array<Record<string, unknown>>) || [];
            const vs: VertexSearchConfig =
                typeof options.vertexSearchGrounding === 'object'
                    ? options.vertexSearchGrounding
                    : {};
            if (vs.datastore) {
                tools.push({
                    retrieval: {
                        vertexAiSearch: { datastore: vs.datastore },
                        ...(vs.includeWebFallback ? { disableAttribution: false } : {}),
                    },
                });
                if (vs.includeWebFallback) {
                    tools.push({ googleSearch: {} });
                }
            } else {
                const retrievalTool: Record<string, unknown> = {
                    googleSearchRetrieval: {},
                };
                if (vs.dynamicRetrievalConfig) {
                    retrievalTool.googleSearchRetrieval = {
                        dynamicRetrievalConfig: vs.dynamicRetrievalConfig,
                    };
                }
                tools.push(retrievalTool);
            }
            modelParams.tools = tools as never;
        }
        if (options?.safetySettings) {
            modelParams.safetySettings = options.safetySettings;
        }
        return this.#client.getGenerativeModel(modelParams as never);
    }

    async generateContent(
        messages: ChatMessage[],
        model = 'gemini-3.1-flash-lite',
        options?: SendMessageOptions,
        signal?: AbortSignal,
    ): Promise<ProviderResponse> {
        await this.ensureConfigured();
        const start = Date.now();
        const m = this.#model(model, options);
        const { contents, systemInstruction } = buildSDKContents(messages);

        try {
            const req: Record<string, unknown> = { contents };
            if (systemInstruction) {
                req.systemInstruction = systemInstruction;
            }
            const result = await m.generateContent(req as never, { signal });
            const resp = result.response;
            const text = resp.text();
            const latency = Date.now() - start;

            let groundingMetadata: GroundingMetadata | undefined;
            const raw = resp as unknown as { groundingMetadata?: GroundingMetadata };
            if (raw.groundingMetadata) {
                groundingMetadata = raw.groundingMetadata;
            }

            return {
                content: text,
                latency,
                tokens: resp.usageMetadata?.totalTokenCount ?? 0,
                finishReason: 'STOP' as const,
                groundingMetadata,
            };
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            const latency = Date.now() - start;
            const errMsg = e instanceof Error ? e.message : String(e);
            LOGGER.error('GoogleGenAI', 'generateContent failed', { error: errMsg });
            return {
                content: '',
                latency,
                tokens: 0,
                error: errMsg,
                finishReason: 'OTHER' as const,
            };
        }
    }

    async streamContent(
        messages: ChatMessage[],
        onChunk: (text: string) => void,
        model = 'gemini-3.1-flash-lite',
        options?: SendMessageOptions,
        signal?: AbortSignal,
    ): Promise<ProviderResponse> {
        await this.ensureConfigured();
        const start = Date.now();
        const m = this.#model(model, options);
        const { contents, systemInstruction } = buildSDKContents(messages);

        try {
            const req: Record<string, unknown> = { contents };
            if (systemInstruction) {
                req.systemInstruction = systemInstruction;
            }
            const result = await m.generateContentStream(req as never, { signal });

            let fullText = '';
            for await (const chunk of result.stream) {
                const t = chunk.text();
                fullText += t;
                onChunk(t);
            }
            const resp = await result.response;
            const latency = Date.now() - start;

            let groundingMetadata: GroundingMetadata | undefined;
            const raw = resp as unknown as { groundingMetadata?: GroundingMetadata };
            if (raw.groundingMetadata) {
                groundingMetadata = raw.groundingMetadata;
            }

            return {
                content: fullText,
                latency,
                tokens: resp.usageMetadata?.totalTokenCount ?? 0,
                finishReason: 'STOP' as const,
                groundingMetadata,
            };
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
            const latency = Date.now() - start;
            const errMsg = e instanceof Error ? e.message : String(e);
            LOGGER.error('GoogleGenAI', 'streamContent failed', { error: errMsg });
            return {
                content: '',
                latency,
                tokens: 0,
                error: errMsg,
                finishReason: 'OTHER' as const,
            };
        }
    }

    async countTokens(text: string, model = 'gemini-3.1-flash-lite'): Promise<number> {
        await this.ensureConfigured();
        try {
            const m = this.#model(model);
            const result = await m.countTokens(text);
            return result.totalTokens;
        } catch {
            return 0;
        }
    }

    async generateImage(
        prompt: string,
        options?: { aspectRatio?: string; personGeneration?: string; safetyFilterLevel?: string },
    ): Promise<{ images: string[]; mimeType: string }> {
        await this.ensureConfigured();
        if (!this.#client) throw new Error('GoogleGenAI not configured');
        const imagenConfig: Record<string, unknown> = {
            responseModalities: ['image', 'text'],
            ...(options?.aspectRatio ? { aspectRatio: options.aspectRatio } : {}),
            ...(options?.personGeneration ? { personGeneration: options.personGeneration } : {}),
            ...(options?.safetyFilterLevel ? { safetyFilterLevel: options.safetyFilterLevel } : {}),
        };
        const m = this.#client.getGenerativeModel({
            model: 'imagen-3.0-generate-001',
            generationConfig: imagenConfig,
        });
        try {
            const result = await m.generateContent(prompt);
            const resp = result.response;
            const candidates = resp.candidates;
            const images: string[] = [];
            let mimeType = 'image/png';
            if (candidates) {
                for (const c of candidates) {
                    for (const part of c.content?.parts || []) {
                        if (part.inlineData) {
                            images.push(part.inlineData.data);
                            mimeType = part.inlineData.mimeType;
                        }
                    }
                }
            }
            return { images, mimeType };
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            LOGGER.error('GoogleGenAI', 'generateImage failed', { error: errMsg });
            return { images: [], mimeType: 'image/png' };
        }
    }

    async getEmbedding(text: string): Promise<number[]> {
        await this.ensureConfigured();
        if (!this.#client) throw new Error('GoogleGenAI not configured');
        try {
            const m = this.#client.getGenerativeModel({ model: 'text-embedding-004' });
            const result = await m.embedContent(text);
            const embedding = result.embedding?.values;
            return embedding ?? [];
        } catch (e) {
            LOGGER.error('GoogleGenAI', 'getEmbedding failed', { error: String(e) });
            return [];
        }
    }

    async getEmbeddings(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];
        // Batch in chunks of 10 to avoid Gemini rate limits (audit1#14)
        const BATCH_SIZE = 10;
        const results: number[][] = [];
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE);
            const chunk = await Promise.all(batch.map((t) => this.getEmbedding(t)));
            results.push(...chunk);
        }
        return results;
    }

    async clusterMemories(
        texts: string[],
        numClusters = 3,
    ): Promise<{ cluster: number; text: string }[]> {
        if (texts.length === 0) return [];
        const embeddings = await this.getEmbeddings(texts);
        if (embeddings.some((e) => e.length === 0)) {
            return texts.map((text) => ({ cluster: 0, text }));
        }
        const dim = embeddings[0]!.length;
        const centroids: number[][] = [];
        for (let i = 0; i < numClusters; i++) {
            centroids.push(embeddings[Math.floor((i * embeddings.length) / numClusters)]!.slice());
        }
        const assignments: number[] = new Array(texts.length).fill(0);
        for (let iter = 0; iter < 20; iter++) {
            let changed = false;
            for (let i = 0; i < embeddings.length; i++) {
                let bestDist = Infinity;
                let bestCluster = 0;
                for (let c = 0; c < numClusters; c++) {
                    let dist = 0;
                    for (let d = 0; d < dim; d++) {
                        dist += (embeddings[i]![d]! - centroids[c]![d]!) ** 2;
                    }
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestCluster = c;
                    }
                }
                if (assignments[i] !== bestCluster) {
                    assignments[i] = bestCluster;
                    changed = true;
                }
            }
            if (!changed) break;
            for (let c = 0; c < numClusters; c++) {
                const members = embeddings.filter((_, i) => assignments[i] === c);
                if (members.length > 0) {
                    for (let d = 0; d < dim; d++) {
                        centroids[c]![d] =
                            members.reduce((sum, m) => sum + m[d]!, 0) / members.length;
                    }
                }
            }
        }
        return texts.map((text, i) => ({ cluster: assignments[i]!, text }));
    }

    async getModels(): Promise<string[]> {
        await this.ensureConfigured();
        const apiKey = this.#apiKey;
        if (!apiKey) return ['gemini-3.1-flash-lite', 'gemini-3.1-pro'];
        try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1/models', {
                headers: { 'x-goog-api-key': apiKey },
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return ['gemini-3.1-flash-lite', 'gemini-3.1-pro'];
            }
            const data = (await res.json()) as {
                models?: Array<{ name?: string }>;
            };
            const models = (data.models ?? [])
                .map((m) => (m.name ?? '').replace(/^models\//, ''))
                .filter((m) => m.length > 0);
            // gemini-3.1-flash is NOT available via the v1beta generateContent API
            // (live 404s) — keep only models actually returned by the API.
            return models.length > 0 ? models : ['gemini-3.1-flash-lite', 'gemini-3.1-pro'];
        } catch {
            return ['gemini-3.1-flash-lite', 'gemini-3.1-pro'];
        }
    }
}
