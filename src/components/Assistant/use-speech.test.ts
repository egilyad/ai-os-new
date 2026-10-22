import { describe, it, expect } from 'vitest';
import { chunkForSpeech, pickVoice } from './use-speech';

const voice = (lang: string, isDefault = false): SpeechSynthesisVoice =>
    ({ lang, default: isDefault, name: `${lang}-voice` }) as SpeechSynthesisVoice;

describe('chunkForSpeech', () => {
    it('keeps a short answer in one piece', () => {
        expect(chunkForSpeech('Панель памяти — /memory.')).toEqual([
            'Панель памяти — /memory.',
        ]);
    });

    it('splits a long answer by sentences without losing text', () => {
        const sentence = 'Это предложение про систему и её панели. ';
        const text = sentence.repeat(12).trim();
        const chunks = chunkForSpeech(text, 120);
        expect(chunks.length).toBeGreaterThan(1);
        for (const chunk of chunks) {
            expect(chunk.length).toBeLessThanOrEqual(120);
        }
        expect(chunks.join(' ')).toBe(text);
    });

    it('drops whitespace-only input', () => {
        expect(chunkForSpeech('   \n  ')).toEqual([]);
    });
});

describe('pickVoice', () => {
    it('prefers the exact language match', () => {
        const chosen = pickVoice([voice('en-US'), voice('ru-RU'), voice('ru-RU', true)], 'ru-RU');
        expect(chosen?.lang).toBe('ru-RU');
        expect(chosen?.default).toBe(false);
    });

    it('falls back to the same language family', () => {
        const chosen = pickVoice([voice('en-GB'), voice('ru')], 'ru-RU');
        expect(chosen?.lang).toBe('ru');
        expect(pickVoice([voice('en-GB'), voice('uk-UA')], 'ru-RU')).toBeNull();
    });

    it('uses the browser default when nothing matches', () => {
        const chosen = pickVoice([voice('en-US', true)], 'ru-RU');
        expect(chosen?.lang).toBe('en-US');
    });

    it('returns null without voices', () => {
        expect(pickVoice([], 'ru-RU')).toBeNull();
    });
});
