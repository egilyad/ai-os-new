import type { IWhisperChannelsService, Whisper } from '../../contracts/debate-whisper-channels';
export class WhisperChannelsService implements IWhisperChannelsService {
    whisper(allied: string[], hint: string): Whisper[] {
        if (allied.length<2) return [];
        return allied.slice(0,2).map((from,i)=>({ from, to: allied[(i+1)%allied.length], hint: hint.slice(0,60) }));
    }
}
