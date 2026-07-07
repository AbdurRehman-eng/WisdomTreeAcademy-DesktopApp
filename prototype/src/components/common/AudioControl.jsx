import React, { useState, useEffect } from 'react';
import './AudioControl.css';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

export const AudioControl = ({
  audioText = 'Default audio prompt text.',
  onPlayStateChange,
  theme = 'default' // 'default' or 'child' (different sizing and fonts)
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      // Simulate audio ending after 5 seconds
      timer = setTimeout(() => {
        setIsPlaying(false);
        if (onPlayStateChange) onPlayStateChange(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying]);

  const handlePlayToggle = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (onPlayStateChange) onPlayStateChange(nextState);
  };

  const handleReplay = () => {
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    }, 100);
  };

  return (
    <div className={`audio-control-bar audio-theme-${theme}`}>
      <button
        onClick={handlePlayToggle}
        className={`audio-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
        title={isPlaying ? 'Pause Audio Prompt' : 'Read Aloud'}
      >
        {isPlaying ? <Pause size={theme === 'child' ? 24 : 16} /> : <Play size={theme === 'child' ? 24 : 16} />}
        {theme === 'child' && <span className="btn-label-text">{isPlaying ? 'Pause' : 'Read Aloud'}</span>}
      </button>

      <button
        onClick={handleReplay}
        className="audio-btn replay-btn"
        title="Replay Audio Prompt"
      >
        <RotateCcw size={theme === 'child' ? 20 : 14} />
        {theme === 'child' && <span className="btn-label-text">Replay</span>}
      </button>

      <div className={`waveform-visualizer ${isPlaying ? 'active' : ''}`}>
        <svg viewBox="0 0 100 40" className="waveform-svg">
          {/* We create multiple bars in SVG and animate their height using CSS pulse */}
          <rect x="5" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-1" />
          <rect x="12" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-2" />
          <rect x="19" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-3" />
          <rect x="26" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-4" />
          <rect x="33" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-5" />
          <rect x="40" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-6" />
          <rect x="47" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-7" />
          <rect x="54" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-8" />
          <rect x="61" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-9" />
          <rect x="68" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-10" />
          <rect x="75" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-11" />
          <rect x="82" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-12" />
          <rect x="89" y="10" width="3" height="20" rx="1.5" className="wave-bar bar-13" />
        </svg>
      </div>

      {theme !== 'child' && (
        <span className="audio-helper-text">
          {isPlaying ? 'Playing instruction...' : 'Click to hear prompt'}
        </span>
      )}
    </div>
  );
};

export default AudioControl;
