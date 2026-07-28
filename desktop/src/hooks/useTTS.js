import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * selectVoice — Helper to find the best matching English voice
 */
const selectVoice = (voicesList, voiceType) => {
  if (voicesList.length === 0) return null;

  if (voiceType === 'friendly-female') {
    // Look for Google US English (natural female)
    const googleUS = voicesList.find(v => v.name.includes('Google US English'));
    if (googleUS) return googleUS;

    // Look for Microsoft Zira Desktop (clean Windows female)
    const zira = voicesList.find(v => v.name.toLowerCase().includes('zira'));
    if (zira) return zira;

    // Look for any female voice
    const female = voicesList.find(v => v.name.toLowerCase().includes('female'));
    if (female) return female;

    // Look for natural voices
    const natural = voicesList.find(v => v.name.toLowerCase().includes('natural'));
    if (natural) return natural;
  } 
  
  if (voiceType === 'warm-male') {
    // Look for Google UK English Male or Google US English Male
    const googleMale = voicesList.find(v => v.name.includes('Google') && v.name.toLowerCase().includes('male'));
    if (googleMale) return googleMale;

    // Look for Microsoft David Desktop (Windows male)
    const david = voicesList.find(v => v.name.toLowerCase().includes('david'));
    if (david) return david;

    // Look for any male voice
    const male = voicesList.find(v => v.name.toLowerCase().includes('male'));
    if (male) return male;
  }

  // Fallback to default or first English voice
  const fallback = voicesList.find(v => v.default) || voicesList[0];
  return fallback;
};

/**
 * useTTS — Web Speech API hook
 *
 * Encapsulates speechSynthesis so components stay declarative.
 * Falls back gracefully when speechSynthesis is unavailable (e.g., jsdom in tests).
 *
 * @param {string}  text  - The text to speak.
 * @param {number}  rate  - Speech rate. Default 0.85 (child-friendly pacing).
 * @param {number}  pitch - Pitch. Default 1.
 * @returns {{ isSpeaking, isPaused, speak, pause, resume, replay, cancel, isSupported, voiceType, changeVoiceType }}
 */
export function useTTS(text, rate = 0.85, pitch = 1) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voiceType, setVoiceType] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wta-tts-voice-type') || 'friendly-female';
    }
    return 'friendly-female';
  });

  const changeVoiceType = useCallback((newType) => {
    setVoiceType(newType);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wta-tts-voice-type', newType);
      // Dispatch storage event manually for same-document listeners
      window.dispatchEvent(new Event('storage-tts'));
    }
  }, []);

  // Listen to storage events to stay in sync across multiple AudioControl instances
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('wta-tts-voice-type') || 'friendly-female';
        setVoiceType(stored);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('storage-tts', handleStorageChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('storage-tts', handleStorageChange);
      }
    };
  }, []);

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

    if (isSupported && window.speechSynthesis && typeof window.speechSynthesis.getVoices === 'function') {
      const allVoices = window.speechSynthesis.getVoices();
      const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
      const voice = selectVoice(enVoices, voiceType);
      if (voice) {
        utter.voice = voice;
        if (voiceType === 'friendly-female') {
          utter.pitch = 1.15; // Friendly higher pitch
          utter.rate = 0.82; // Child-friendly slower pacing
        } else if (voiceType === 'warm-male') {
          utter.pitch = 0.95; // Warm male lower pitch
          utter.rate = 0.85;
        } else {
          utter.pitch = pitch;
          utter.rate = rate;
        }
      }
    }

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
  }, [text, rate, pitch, isSupported, voiceType]);

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

  return { isSpeaking, isPaused, speak, pause, resume, replay, cancel, isSupported, voiceType, changeVoiceType };
}

export default useTTS;
