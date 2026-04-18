import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNotePlayerProps {
  src: string;
  duration?: number;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const BARS = 24;

const VoiceNotePlayer = ({ src, duration }: VoiceNotePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => {
      if (isFinite(a.duration)) setTotal(a.duration);
    };
    const onEnd = () => {
      setIsPlaying(false);
      setCurrent(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const progress = total > 0 ? current / total : 0;
  const remaining = Math.max(0, (total || 0) - current);

  return (
    <div className="flex items-center gap-berry-1 min-w-[180px] py-[2px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="w-[36px] h-[36px] rounded-[var(--radius-full)] bg-background/20 hover:bg-background/30 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-[1px]" />
        )}
      </button>
      <div className="flex items-center gap-[2px] flex-1 h-[28px]">
        {Array.from({ length: BARS }).map((_, i) => {
          const filled = i / BARS < progress;
          // Pseudo-waveform via deterministic heights
          const h = 6 + ((i * 37) % 14);
          return (
            <span
              key={i}
              className={cn(
                "w-[2px] rounded-[1px] transition-colors duration-100",
                filled ? "bg-current opacity-90" : "bg-current opacity-30"
              )}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>
      <span className="text-[10px] font-medium opacity-70 tabular-nums w-[32px] text-right">
        {formatTime(isPlaying || current > 0 ? remaining : total)}
      </span>
    </div>
  );
};

export default VoiceNotePlayer;
