import { describe, it, expect } from 'vitest';
import { GoTDeliberation } from './got-deliberation';

describe('GoTDeliberation', () => {
    it('deliberate returns null or result', async () => {
        const svc = new GoTDeliberation();
        const res = await svc.deliberate('Should we invest in solar?', 'Pro solar', ['Nuclear is better', 'Cost is high']);
        expect(res === null || typeof res === 'object').toBe(true);
        if (res) {
            expect(res).toHaveProperty('branches');
            expect(res).toHaveProperty('synthesis');
        }
    });
    it('returns something for empty opposing', async () => {
        const svc = new GoTDeliberation();
        const res = await svc.deliberate('Topic', 'Perspective', []);
        expect(res === null || typeof res === 'object').toBe(true);
    });
    it('does not throw', async () => {
        const svc = new GoTDeliberation();
        await expect(svc.deliberate('', '', [])).resolves.toBeDefined();
    });
});
