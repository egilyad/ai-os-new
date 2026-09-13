import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type { IFormatService, IArgTechService } from '../contracts/debateplus';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase39 e2e chain (L)', () => {
    it('format → swing → dung → toulmin → brier → claimtree → store', async () => {
        const format = get<IFormatService>('formatService');
        expect((await format.listFormats()).length).toBeGreaterThan(0);

        const argtech = get<IArgTechService>('argTechService');
        expect((await argtech.mineClaims('Solar is cheap. Bills fell 20% per report.')).length).toBeGreaterThan(0);

        const toulmin = await argtech.createToulmin({ claim: 'Solar wins', grounds: 'Bills fell' });
        expect(toulmin.completeness).toBeDefined();

        await argtech.addDungArgument('a1', 'Solar is cheap');
        expect((await argtech.groundedExtension()).length).toBeGreaterThan(0);

        await argtech.forecast('c1', 'u1', 0.7);
        expect((await argtech.resolveClaim('c1', true)).brier).toBeDefined();

        const treeId = await argtech.plantThesis('Solar power');
        expect((await argtech.treeScore(treeId)).verdict).toBeDefined();
    }, 60000);
});
