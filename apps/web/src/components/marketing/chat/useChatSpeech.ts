'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scoped = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scoped.SpeechRecognition ?? scoped.webkitSpeechRecognition ?? null;
}

export function useChatSpeech(locale: 'en' | 'hi') {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [supported, setSupported] = useState(false);
  const lang = locale === 'hi' ? 'hi-IN' : 'en-IN';

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(
    (onFinal: (transcript: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return false;

      stopSpeaking();
      recognitionRef.current?.abort();

      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (!last) return;
        const transcript = last[0].transcript.trim();
        if (last.isFinal) {
          setInterim('');
          onFinal(transcript);
        } else {
          setInterim(transcript);
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setInterim('');
      };
      recognition.onend = () => {
        setListening(false);
        setInterim('');
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      return true;
    },
    [lang, stopSpeaking],
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  return {
    supported,
    listening,
    interim,
    speaking,
    voiceReplies,
    setVoiceReplies,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
