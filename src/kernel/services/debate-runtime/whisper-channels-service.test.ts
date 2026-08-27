import { describe, it, expect } from 'vitest';
import { WhisperChannelsService } from './whisper-channels-service';
describe('WhisperChannelsService',()=>{
    const s=new WhisperChannelsService();
    it('whisper with 2',()=>{expect(s.whisper(['a','b'],'hint').length).toBe(2)});
    it('empty with 1',()=>{expect(s.whisper(['a'],'hint')).toEqual([])});
    it('has hint',()=>{expect(s.whisper(['a','b'],'my hint')[0].hint).toBe('my hint')});
});
