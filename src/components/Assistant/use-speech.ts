/**
 * useSpeech — browser voice for the assistant.
 *
 * Speech recognition and synthesis are part of the browser, not of the
 * runtime, so the assistant speaks on any provider and any API key. The hook
 * degrades gracefully: without Web Speech the panel stays text-only.
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
    const transcriptHandler = useRef(onFinalTranscript);

    useEffect(() => {
        transcriptHandler.current = onFinalTranscript;
    }, [onFinalTranscript]);

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

    const toggleListening = useCallback(() => {
        const rec = recognition.current;
        if (!rec) return;
        if (listening) {
            rec.stop();
            setListening(false);
            return;
        }
        try {
            rec.start();
            setListening(true);
        } catch {
            setListening(false);
        }
    }, [listening]);

    const stopSpeaking = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    const speak = useCallback(
        (text: string) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) return;
            if (!text.trim()) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 1.02;
            utterance.onend = () => setSpeaking(false);
            utterance.onerror = () => setSpeaking(false);
            setSpeaking(true);
            window.speechSynthesis.speak(utterance);
        },
        [lang],
    );

    useEffect(() => () => stopSpeaking(), [stopSpeaking]);

    return { supported, listening, speaking, interim, toggleListening, speak, stopSpeaking };
}
