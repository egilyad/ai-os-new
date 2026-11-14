import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ImageGeneration');

export interface GeneratedImage {
    dataB64: string;
    mimeType: string;
    width?: number;
    height?: number;
    provider: string;
    note?: string;
}

export interface ImageGenerationOptions {
    size?: '256x256' | '512x512' | '1024x1024' | '2048x2048';
    provider?: string;
}

export interface IImageGenerator {
    readonly id: string;
    generate(prompt: string, opts?: ImageGenerationOptions): Promise<GeneratedImage>;
}

/** 1x1 transparent PNG, base64 — safe stub output for offline/test runs. */
const STUB_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export class StubImageGenerator implements IImageGenerator {
    readonly id = 'stub';

    async generate(prompt: string, opts?: ImageGenerationOptions): Promise<GeneratedImage> {
        const size = opts?.size ?? '1024x1024';
        const [width, height] = size.split('x').map(Number);
        return {
            dataB64: STUB_PNG_B64,
            mimeType: 'image/png',
            width,
            height,
            provider: 'stub',
            note: `stub placeholder for prompt: ${prompt.slice(0, 80)}`,
        };
    }
}

/**
 * ImageGenerationService — text-to-image facade.
 *
 * Providers register under ids; the default is a stub generator (no API keys
 * required). Future providers (OpenAI images, Stability) plug in via the same
 * IImageGenerator contract.
 */
export class ImageGenerationService {
    private providers = new Map<string, IImageGenerator>();

    constructor(providers: IImageGenerator[] = [new StubImageGenerator()]) {
        for (const p of providers) this.providers.set(p.id, p);
    }

    registerProvider(provider: IImageGenerator): void {
        this.providers.set(provider.id, provider);
    }

    async generate(prompt: string, opts?: ImageGenerationOptions): Promise<GeneratedImage> {
        const provider =
            this.providers.get(opts?.provider ?? 'stub') ?? this.providers.get('stub')!;
        try {
            return await provider.generate(prompt, opts);
        } catch (e) {
            LOGGER.warn('generate failed, falling back to stub', String(e));
            return new StubImageGenerator().generate(prompt, opts);
        }
    }

    listProviders(): string[] {
        return [...this.providers.keys()];
    }
}
