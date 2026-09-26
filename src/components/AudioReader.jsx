import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { stripMarkdownForSpeech, announceToScreenReader } from '../utils/a11yHelpers';
import { UI_TRANSLATIONS } from '../constants/a11yConstants';

const AudioReader = memo(function AudioReader({
  text,
  label,
  lang = 'en',
  rate = 1.0,
  compact = false,
}) {
  const [speakingState, setSpeakingState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef(null);

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingState('idle');
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const handlePlay = useCallback(() => {
    if (!text || !isSupported) return;

    if (speakingState === 'paused') {
      window.speechSynthesis.resume();
      setSpeakingState('playing');
      announceToScreenReader(t.resumeReading || 'Resumed reading');
      return;
    }

    if (speakingState === 'playing') {
      window.speechSynthesis.pause();
      setSpeakingState('paused');
      announceToScreenReader(t.pauseReading || 'Paused reading');
      return;
    }

    // Start fresh speech synthesis
    window.speechSynthesis.cancel();

    const spokenText = stripMarkdownForSpeech(text);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = parseFloat(rate) || 1.0;
    utterance.lang = lang || 'en';

    utterance.onstart = () => {
      setSpeakingState('playing');
      announceToScreenReader(t.readAloud || 'Reading aloud');
    };

    utterance.onend = () => {
      setSpeakingState('idle');
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setSpeakingState('idle');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, isSupported, speakingState, rate, lang, t]);

  if (!isSupported || !text) return null;

  return (
    <div className={`audio-reader-container ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className={`audio-reader-btn ${speakingState !== 'idle' ? 'active' : ''}`}
        onClick={handlePlay}
        aria-label={
          speakingState === 'playing'
            ? t.pauseReading
            : speakingState === 'paused'
            ? t.resumeReading
            : `${t.readAloud} ${label ? `: ${label}` : ''}`
        }
        title={speakingState === 'playing' ? t.pauseReading : t.readAloud}
      >
        {speakingState === 'playing' ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
        {!compact && (
          <span>
            {speakingState === 'playing'
              ? t.pauseReading
              : speakingState === 'paused'
              ? t.resumeReading
              : t.readAloud}
          </span>
        )}
      </button>

      {speakingState !== 'idle' && (
        <button
          type="button"
          className="audio-stop-btn"
          onClick={stopSpeech}
          aria-label={t.stopReading}
          title={t.stopReading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default AudioReader;
