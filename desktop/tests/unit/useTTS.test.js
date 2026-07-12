/**
 * useTTS unit tests
 *
 * @vitest-environment happy-dom
 *
 * jsdom does not ship speechSynthesis, so we provide a full manual mock.
 * The mock is reset between each test via beforeEach.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../../src/hooks/useTTS';

// --------------------------------------------------------------------------
// speechSynthesis mock
// --------------------------------------------------------------------------
let lastUtterance = null;

const mockSpeechSynthesis = {
  speak: vi.fn((utterance) => {
    lastUtterance = utterance;
    // Simulate the browser firing onstart immediately
    utterance.onstart?.();
  }),
  pause:  vi.fn(),
  resume: vi.fn(),
  cancel: vi.fn(() => {
    // Simulate browser firing onend after cancel
    lastUtterance?.onend?.();
  }),
};

beforeEach(() => {
  lastUtterance = null;
  vi.clearAllMocks();
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
    configurable: true,
  });
  // jsdom does not have SpeechSynthesisUtterance — provide a minimal version
  global.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text  = text;
      this.rate  = 1;
      this.pitch = 1;
      this.lang  = '';
      this.onstart  = null;
      this.onend    = null;
      this.onerror  = null;
    }
  };
});

afterEach(() => {
  delete window.speechSynthesis;
});

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------
describe('useTTS', () => {
  it('isSupported is true when speechSynthesis exists', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    expect(result.current.isSupported).toBe(true);
  });

  it('isSupported is false when speechSynthesis is absent', () => {
    delete window.speechSynthesis;
    const { result } = renderHook(() => useTTS('Hello'));
    expect(result.current.isSupported).toBe(false);
  });

  it('speak() calls speechSynthesis.speak with correct text', () => {
    const { result } = renderHook(() => useTTS('Test question'));
    act(() => { result.current.speak(); });

    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(lastUtterance.text).toBe('Test question');
  });

  it('speak() uses rate 0.85 by default', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    expect(lastUtterance.rate).toBe(0.85);
  });

  it('speak() forwards custom rate and pitch', () => {
    const { result } = renderHook(() => useTTS('Hello', 1.2, 0.9));
    act(() => { result.current.speak(); });
    expect(lastUtterance.rate).toBe(1.2);
    expect(lastUtterance.pitch).toBe(0.9);
  });

  it('isSpeaking becomes true after speak() fires onstart', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    expect(result.current.isSpeaking).toBe(true);
  });

  it('isSpeaking becomes false after utterance ends', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    act(() => { lastUtterance.onend(); });
    expect(result.current.isSpeaking).toBe(false);
  });

  it('pause() calls speechSynthesis.pause', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    act(() => { result.current.pause(); });
    expect(mockSpeechSynthesis.pause).toHaveBeenCalledTimes(1);
  });

  it('cancel() calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    act(() => { result.current.cancel(); });
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('replay() calls cancel then speak again', () => {
    const { result } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });

    vi.clearAllMocks();
    act(() => { result.current.replay(); });

    expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(lastUtterance.text).toBe('Hello');
  });

  it('unmounting cancels any active speech', () => {
    const { result, unmount } = renderHook(() => useTTS('Hello'));
    act(() => { result.current.speak(); });
    unmount();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('does not throw when speechSynthesis is absent', () => {
    delete window.speechSynthesis;
    const { result } = renderHook(() => useTTS('Hello'));
    expect(() => {
      act(() => { result.current.speak(); });
      act(() => { result.current.cancel(); });
      act(() => { result.current.replay(); });
    }).not.toThrow();
  });
});
