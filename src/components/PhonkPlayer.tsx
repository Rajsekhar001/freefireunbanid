import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { phonkSynth } from '../services/phonkSynth';

const AUDIO_PREFS_KEY = 'apex_phonk_prefs_v1';

interface AudioPrefs {
  volume: number;
  muted: boolean;
}

function loadAudioPrefs(): AudioPrefs {
  try {
    const raw = window.localStorage.getItem(AUDIO_PREFS_KEY);
    if (!raw) return { volume: 0.55, muted: false };
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.min(1, Math.max(0, parsed.volume))
          : 0.55,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { volume: 0.55, muted: false };
  }
}

export function PhonkPlayer() {
  const initialPrefs = loadAudioPrefs();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialPrefs.muted);
  const [volume, setVolume] = useState(initialPrefs.volume);
  const [expanded, setExpanded] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 10 }, () => 0.14));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        AUDIO_PREFS_KEY,
        JSON.stringify({ volume, muted: isMuted })
      );
    } catch {
      // Ignore private browsing restrictions
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isPlaying) {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setBars(Array.from({ length: 10 }, () => 0.12));
      return;
    }

    if (reducedMotion) {
      setBars([0.45, 0.72, 0.55, 0.85, 0.62, 0.4, 0.78, 0.52, 0.66, 0.38]);
      return;
    }

    const tick = () => {
      setBars(phonkSynth.getFrequencyBars(10));
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      phonkSynth.dispose();
    };
  }, []);

  const togglePlay = async () => {
    if (isPlaying) {
      phonkSynth.stop();
      setIsPlaying(false);
    } else {
      await phonkSynth.start(volume, isMuted);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    phonkSynth.setMuted(nextMuted);
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    phonkSynth.setVolume(nextVol);
    if (nextVol > 0 && isMuted) {
      setIsMuted(false);
      phonkSynth.setMuted(false);
    }
  };

  return (
    <aside
      aria-label="APEX PHONK MODE audio player"
      className="fixed right-3 bottom-3 z-40 sm:right-5 sm:bottom-5"
    >
      <div className="apex-glass apex-gradient-border rounded-2xl px-3.5 py-2.5 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause APEX PHONK MODE' : 'Play APEX PHONK MODE'}
            className="neon-red-glow flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#FF1744] to-[#D90024] text-white transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>

          {/* Label + Live Visualizer Bars */}
          <div className="min-w-[132px]">
            <p className="font-display text-sm font-extrabold tracking-wider text-white">
              APEX PHONK MODE
            </p>
            <div className="mt-1 flex h-3.5 items-end gap-1" aria-hidden="true">
              {bars.map((val, idx) => (
                <span
                  key={idx}
                  className="w-1.5 origin-bottom rounded-full bg-gradient-to-t from-[#FF1744] via-[#8B35FF] to-[#0066FF] transition-transform duration-75"
                  style={{
                    height: '14px',
                    transform: `scaleY(${isMuted ? 0.14 : val})`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mute / Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-[#FF1744]" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#60A5FA]" />
            )}
          </button>

          {/* Desktop inline volume slider / Mobile expand toggle */}
          <div className="hidden items-center sm:flex">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Phonk music volume"
              className="h-1.5 w-20 cursor-pointer accent-[#FF1744]"
            />
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse volume slider' : 'Expand volume slider'}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-slate-300 sm:hidden"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile expandable volume slider */}
        {expanded && (
          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 sm:hidden">
            <span className="text-xs font-medium text-slate-400">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Phonk music volume"
              className="h-1.5 flex-1 cursor-pointer accent-[#FF1744]"
            />
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
