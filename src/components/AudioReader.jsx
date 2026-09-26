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
  const keepAliveIntervalRef = useRef(null);

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    clearKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingState('idle');
  }, [clearKeepAlive]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const getBestVoice = useCallback((targetLang) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const code = (targetLang || 'en').toLowerCase().split('-')[0];
    
    // 1. Target language match
    const match = voices.find(v => v.lang.toLowerCase().startsWith(code));
    if (match) return match;

    // 2. English fallback
    const enMatch = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (enMatch) return enMatch;

    // 3. System default voice
    return voices.find(v => v.default) || voices[0];
  }, []);

  const handlePlay = useCallback(() => {
    if (!text || !isSupported || typeof window === 'undefined') return;

    const synth = window.speechSynthesis;

    if (speakingState === 'paused') {
      synth.resume();
      setSpeakingState('playing');
      announceToScreenReader(t.resumeReading || 'Resumed reading');
      return;
    }

    if (speakingState === 'playing') {
      synth.pause();
      setSpeakingState('paused');
      announceToScreenReader(t.pauseReading || 'Paused reading');
      return;
    }

    // Stop current speech before playing new
    stopSpeech();

    const spokenText = stripMarkdownForSpeech(text);
    if (!spokenText) return;

    // Micro delay after cancel() to fix Chromium bug where speak() is swallowed
    setTimeout(() => {
      // Resume synth if stuck in paused state
      if (synth.paused) {
        synth.resume();
      }

      // Chunk long text by sentences without lookbehind regex for 100% browser compatibility
      const sentences = spokenText
        .replace(/([.!?])\s+/g, '$1|SPLIT|')
        .split('|SPLIT|')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (sentences.length === 0) return;

      let currentSentenceIndex = 0;

      const speakNextChunk = () => {
        if (currentSentenceIndex >= sentences.length) {
          clearKeepAlive();
          setSpeakingState('idle');
          return;
        }

        const chunkText = sentences[currentSentenceIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        
        utterance.rate = Math.min(Math.max(parseFloat(rate) || 1.0, 0.5), 2.0);
        utterance.lang = lang || 'en';

        const voice = getBestVoice(lang);
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          if (currentSentenceIndex === 0) {
            setSpeakingState('playing');
            announceToScreenReader(t.readAloud || 'Reading aloud');
          }
        };

        utterance.onend = () => {
          currentSentenceIndex++;
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis chunk error:', e);
          currentSentenceIndex++;
          speakNextChunk();
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      };

      // Keepalive interval for Chromium bug where long speech pauses after 15 seconds
      clearKeepAlive();
      keepAliveIntervalRef.current = setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        }
      }, 7000);

      speakNextChunk();
    }, 50);
  }, [text, isSupported, speakingState, rate, lang, t, stopSpeech, getBestVoice, clearKeepAlive]);

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
