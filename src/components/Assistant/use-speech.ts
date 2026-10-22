/**
 * useSpeech — browser voice for the assistant.
 *
 * Speech recognition and synthesis are part of the browser, not of the
 * runtime, so the assistant speaks on any provider and any API key. The hook
 * degrades gracefully: without Web Speech the panel stays text-only.
 *
 * Two details make it usable in practice:
 *  - the voice is chosen for the utterance language, because the default
 *    browser voice often reads Russian with an English accent;
 *  - long answers are split into sentences, because several browsers cut a
 *    single utterance after a few seconds.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface RecognitionResultLike {
    isFinal: boolean;
    0: { transcript: string };
}

interface RecognitionEventLike {
    resultIndex: number;
    results: ArrayLike<RecognitionResultLike> & { length: number };
}

interface RecognitionErrorLike {
    error: string;
}

interface RecognitionLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: RecognitionEventLike) => void) | null;
    onerror: ((event: RecognitionErrorLike) => void) | null;
    onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

interface SpeechWindow {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
}

function recognitionCtor(): RecognitionCtor | null {
    const w = window as unknown as SpeechWindow;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Pick the voice that actually speaks the requested language. */
export function pickVoice(
    voices: SpeechSynthesisVoice[],
    lang: string,
): SpeechSynthesisVoice | null {
    const wanted = lang.toLowerCase();
    const exact = voices.find((v) => v.lang.toLowerCase() === wanted);
    if (exact) return exact;
    const prefix = wanted.split('-')[0] ?? wanted;
    const sameFamily = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (sameFamily) return sameFamily;
    return voices.find((v) => v.default) ?? null;
}

/** Split an answer into speakable sentences of a safe length. */
export function chunkForSpeech(text: string, max = 180): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    if (normalized.length <= max) return [normalized];
    const sentences = normalized.match(/[^.!?…]+[.!?…]*/g) ?? [normalized];
    const chunks: string[] = [];
    let buffer = '';
    for (const sentence of sentences) {
        if (buffer && (buffer + sentence).length > max) {
            chunks.push(buffer.trim());
            buffer = sentence;
        } else {
            buffer += sentence;
        }
    }
    if (buffer.trim()) chunks.push(buffer.trim());
    return chunks;
}

export interface UseSpeechOptions {
    lang?: string;
    onFinalTranscript?: (text: string) => void;
}

export interface UseSpeechResult {
    supported: boolean;
    listening: boolean;
    speaking: boolean;
    interim: string;
    toggleListening: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
}

export function useSpeech({
    lang = 'ru-RU',
    onFinalTranscript,
}: UseSpeechOptions = {}): UseSpeechResult {
    const [supported] = useState<boolean>(() => recognitionCtor() !== null);
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [interim, setInterim] = useState('');
    const recognition = useRef<RecognitionLike | null>(null);
    const voices = useRef<SpeechSynthesisVoice[]>([]);
    const transcriptHandler = useRef(onFinalTranscript);
    const speakToken = useRef(0);

    useEffect(() => {
        transcriptHandler.current = onFinalTranscript;
    }, [onFinalTranscript]);

    useEffect(() => {
        const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis;
        if (!synth) return;
        const load = () => {
            voices.current = synth.getVoices();
        };
        load();
        if (typeof synth.addEventListener === 'function') {
            synth.addEventListener('voiceschanged', load);
            return () => synth.removeEventListener('voiceschanged', load);
        }
    }, []);

    useEffect(() => {
        const Ctor = recognitionCtor();
        if (!Ctor) return;

        const rec = new Ctor();
        rec.lang = lang;
        rec.continuous = false;
        rec.interimResults = true;

        rec.onresult = (event) => {
            let finalText = '';
            let draft = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                if (!result) continue;
                if (result.isFinal) finalText += result[0].transcript;
                else draft += result[0].transcript;
            }
            setInterim(draft);
            if (finalText.trim()) {
                setInterim('');
                transcriptHandler.current?.(finalText.trim());
            }
        };
        rec.onerror = () => {
            setListening(false);
            setInterim('');
        };
        rec.onend = () => setListening(false);
        recognition.current = rec;

        return () => {
            rec.onresult = null;
            rec.onerror = null;
            rec.onend = null;
            try {
                rec.abort();
            } catch {
                /* already stopped */
            }
            recognition.current = null;
        };
    }, [lang]);

    const stopSpeaking = useCallback(() => {
        speakToken.current += 1;
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    const toggleListening = useCallback(() => {
        const rec = recognition.current;
        if (!rec) return;
        if (listening) {
            rec.stop();
            setListening(false);
            return;
        }
        // Barge-in: the user talking wins over the assistant talking.
        stopSpeaking();
        try {
            rec.start();
            setListening(true);
        } catch {
            setListening(false);
        }
    }, [listening, stopSpeaking]);

    const speak = useCallback(
        (text: string) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) return;
            const parts = chunkForSpeech(text);
            if (parts.length === 0) return;
            const synth = window.speechSynthesis;
            synth.cancel();
            const token = speakToken.current + 1;
            speakToken.current = token;
            const voice = pickVoice(
                voices.current.length > 0 ? voices.current : synth.getVoices(),
                lang,
            );
            setSpeaking(true);

            const next = (index: number) => {
                if (token !== speakToken.current) return;
                if (index >= parts.length) {
                    setSpeaking(false);
                    return;
                }
                const utterance = new SpeechSynthesisUtterance(parts[index] ?? '');
                utterance.lang = lang;
                utterance.rate = 1.02;
                if (voice) utterance.voice = voice;
                utterance.onend = () => next(index + 1);
                utterance.onerror = () => {
                    if (token === speakToken.current) setSpeaking(false);
                };
                synth.speak(utterance);
            };
            next(0);
        },
        [lang],
    );

    useEffect(() => () => stopSpeaking(), [stopSpeaking]);

    return { supported, listening, speaking, interim, toggleListening, speak, stopSpeaking };
}
