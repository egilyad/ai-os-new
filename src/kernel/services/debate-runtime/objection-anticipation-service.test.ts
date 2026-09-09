import { describe, it, expect } from 'vitest';
import { ObjectionAnticipationService } from './objection-anticipation-service';
describe('ObjectionAnticipationService',()=>{
    const s=new ObjectionAnticipationService();
    it('anticipate',()=>{expect(s.anticipate('We should invest in solar because it is efficient and cheap')?.objection.length).toBeGreaterThan(0)});
    it('null short',()=>{expect(s.anticipate('hi')).toBeNull()});
    it('has prebuttal',()=>{expect(s.anticipate('This is a long enough claim to trigger anticipation logic')!.prebuttal.length).toBeGreaterThan(0)});
});
