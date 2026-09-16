import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IN8nService,
    IMakeService,
    IZapierService,
    ITemporalService,
    IAssetService,
    ISensorService,
    IVoiceAgentService,
    ISupportService,
    IVerifyService,
    IDeckService,
} from '../contracts/rivals6';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase38 e2e chain (K)', () => {
    it('n8n → make → zap → temporal → asset → sensor → voice → support → verify → deck', async () => {
        const n8n = get<IN8nService>('n8nService');
        expect(
            (await n8n.defineWorkflow({ name: 'w', nodes: [{ id: 't', type: 'trigger' }], edges: [], entryId: 't' })).length,
        ).toBeGreaterThan(0);

        const make = get<IMakeService>('makeService');
        expect(await make.runScenario({ modules: [], initial: { x: 1 } })).toEqual({ x: 1 });

        const zap = get<IZapierService>('zapierService');
        expect((await zap.createZap({ name: 'z', trigger: 'app.event', actions: [] })).length).toBeGreaterThan(0);

        const temporal = get<ITemporalService>('temporalService');
        expect((await temporal.startRun({ name: 'etl', steps: [{ name: 'checkpoint' }] })).length).toBeGreaterThan(0);

        const asset = get<IAssetService>('assetService');
        await asset.defineAsset('raw', []);
        expect(await asset.freshness('raw')).toBeDefined();

        const sensor = get<ISensorService>('sensorService');
        expect((await sensor.poke({ tool: 'any', expect: '', timeoutMs: 1000 })).ok).toBe(true);

        const voice = get<IVoiceAgentService>('voiceService');
        expect((await voice.startCall('+79990001122', 'Hello!')).length).toBeGreaterThan(0);

        const support = get<ISupportService>('supportService');
        expect((await support.openTicket('Login fails', 'Cannot login')).length).toBeGreaterThan(0);

        const verify = get<IVerifyService>('verifyService');
        expect((await verify.submitAnswer('What is X?', 'X is Y.')).length).toBeGreaterThan(0);

        const deck = get<IDeckService>('deckService');
        expect((await deck.buildDeck('Q3 results', 3)).slides.length).toBe(3);
    }, 60000);
});
