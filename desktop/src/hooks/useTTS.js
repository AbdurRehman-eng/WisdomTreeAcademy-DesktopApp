import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useTTS — Web Speech API hook
 *
 * Encapsulates speechSynthesis so components stay declarative.
 * Falls back gracefully when speechSynthesis is unavailable (e.g., jsdom in tests).
 *
 * @param {string}  text  - The text to speak.
 * @param {number}  rate  - Speech rate. Default 0.85 (child-friendly pacing).
 * @param {number}  pitch - Pitch. Default 1.
 * @returns {{ isSpeaking, speak, pause, resume, replay, cancel, isSupported }}
 */
export function useTTS(text, rate = 0.85, pitch = 1) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cancel any active speech when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      if (isSupported && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Also cancel if the text prop changes mid-speech.
  useEffect(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const buildUtterance = useCallback(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.lang = 'en-US';

    utter.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utter.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    return utter;
  }, [text, rate, pitch]);

  const speak = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel(); // clear any previous utterance
    const utter = buildUtterance();
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPaused(false);
  }, [isSupported, buildUtterance]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsSpeaking(false);
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsSpeaking(true);
    setIsPaused(false);
  }, [isSupported]);

  const replay = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const utter = buildUtterance();
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPaused(false);
  }, [isSupported, buildUtterance]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  return { isSpeaking, isPaused, speak, pause, resume, replay, cancel, isSupported };
}

export default useTTS;
