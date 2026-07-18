import React from 'react';
import './AudioControl.css';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';

/**
 * AudioControl — Read-aloud component backed by the Web Speech API.
 *
 * Props:
 *  audioText          — The text string to speak aloud.
 *  onPlayStateChange  — Optional callback fired with (boolean) when play state changes.
 *  theme              — 'default' | 'child'  (controls sizing and font styles via CSS)
 */
export const AudioControl = ({
  audioText = 'Default audio prompt text.',
  onPlayStateChange,
  theme = 'default',
  autoPlay = false,
}) => {
  const { isSpeaking, isPaused, speak, pause, resume, replay, isSupported } = useTTS(audioText);

  React.useEffect(() => {
    if (autoPlay && isSupported && audioText) {
      const timer = setTimeout(() => {
        speak();
        onPlayStateChange?.(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [audioText, autoPlay, isSupported, speak]);

  const handlePlayToggle = () => {
    if (isSpeaking) {
      pause();
      onPlayStateChange?.(false);
    } else if (isPaused) {
      resume();
      onPlayStateChange?.(true);
    } else {
      speak();
      onPlayStateChange?.(true);
    }
  };

  const handleReplay = () => {
    replay();
    onPlayStateChange?.(true);
  };

  return (
    <div className={`audio-control-bar audio-theme-${theme}`}>
      <button
        onClick={handlePlayToggle}
        className={`audio-btn play-pause-btn ${isSpeaking ? 'playing' : ''}`}
        title={isSpeaking ? 'Pause Audio Prompt' : 'Read Aloud'}
        disabled={!isSupported}
      >
        {isSpeaking
          ? <Pause size={theme === 'child' ? 24 : 16} />
          : <Play  size={theme === 'child' ? 24 : 16} />}
        {theme === 'child' && (
          <span className="btn-label-text">{isSpeaking ? 'Pause' : 'Read Aloud'}</span>
        )}
      </button>

      <button
        onClick={handleReplay}
        className="audio-btn replay-btn"
        title="Replay Audio Prompt"
        disabled={!isSupported}
      >
        <RotateCcw size={theme === 'child' ? 20 : 14} />
        {theme === 'child' && <span className="btn-label-text">Replay</span>}
      </button>

      <div className={`waveform-visualizer ${isSpeaking ? 'active' : ''}`}>
        <svg viewBox="0 0 100 40" className="waveform-svg">
          <rect x="5"  y="10" width="3" height="20" rx="1.5" className="wave-bar bar-1"  />
          <rect x="12" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-2"  />
          <rect x="19" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-3"  />
          <rect x="26" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-4"  />
          <rect x="33" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-5"  />
          <rect x="40" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-6"  />
          <rect x="47" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-7"  />
          <rect x="54" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-8"  />
          <rect x="61" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-9"  />
          <rect x="68" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-10" />
          <rect x="75" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-11" />
          <rect x="82" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-12" />
          <rect x="89" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-13" />
        </svg>
      </div>

      {theme !== 'child' && (
        <span className="audio-helper-text">
          {!isSupported
            ? 'Audio not supported'
            : isSpeaking
              ? 'Playing instruction...'
              : 'Click to hear prompt'}
        </span>
      )}
    </div>
  );
};

export default AudioControl;

