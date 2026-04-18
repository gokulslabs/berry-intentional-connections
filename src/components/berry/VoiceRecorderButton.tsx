import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/features/chat/hooks/useVoiceRecorder";
import { toast } from "@/hooks/use-toast";

interface VoiceRecorderButtonProps {
  onRecorded: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
  maxDurationMs?: number;
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SLIDE_TO_CANCEL_PX = 80;

/**
 * Hold-to-record mic button (WhatsApp-style).
 * - Press & hold to record.
 * - Release to send.
 * - Slide left past threshold to cancel.
 */
const VoiceRecorderButton = ({
  onRecorded,
  disabled,
  maxDurationMs = 60_000,
}: VoiceRecorderButtonProps) => {
  const [dragX, setDragX] = useState(0);
  const willCancelRef = useRef(false);
  const startXRef = useRef<number | null>(null);

  const { state, elapsedMs, start, stop, cancel, isRecording } = useVoiceRecorder({
    maxDurationMs,
    onComplete: (blob, durationSec) => {
      if (durationSec < 0.5) {
        toast({ title: "Hold to record", description: "Press and hold the mic to record a voice note." });
        return;
      }
      onRecorded(blob, durationSec);
    },
    onError: () => {
      toast({
        title: "Microphone blocked",
        description: "Allow microphone access to send voice notes.",
        variant: "destructive",
      });
    },
  });

  const beginRecording = useCallback(
    (clientX: number) => {
      if (disabled) return;
      startXRef.current = clientX;
      willCancelRef.current = false;
      setDragX(0);
      start();
    },
    [disabled, start]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isRecording || startXRef.current === null) return;
      const dx = Math.min(0, clientX - startXRef.current);
      setDragX(dx);
      willCancelRef.current = Math.abs(dx) >= SLIDE_TO_CANCEL_PX;
    },
    [isRecording]
  );

  const finishRecording = useCallback(() => {
    if (!isRecording) return;
    if (willCancelRef.current) {
      cancel();
    } else {
      stop();
    }
    startXRef.current = null;
    setDragX(0);
    willCancelRef.current = false;
  }, [isRecording, cancel, stop]);

  // Global pointer/touch listeners while recording so user can release anywhere
  useEffect(() => {
    if (!isRecording) return;
    const onMove = (e: PointerEvent) => handleMove(e.clientX);
    const onUp = () => finishRecording();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, [isRecording, handleMove, finishRecording]);

  const willCancel = Math.abs(dragX) >= SLIDE_TO_CANCEL_PX;
  const progress = Math.min(1, elapsedMs / maxDurationMs);

  return (
    <>
      {/* Recording overlay */}
      {isRecording && (
        <div className="absolute inset-x-0 bottom-0 px-berry-2 py-berry-1 bg-card/95 backdrop-blur-xl border-t border-border z-20 animate-fade-in">
          <div className="max-w-md mx-auto flex items-center gap-berry-1">
            <div className="flex items-center gap-berry-1 flex-1 min-w-0">
              <span
                className="w-[10px] h-[10px] rounded-[var(--radius-full)] bg-destructive animate-pulse flex-shrink-0"
                aria-hidden
              />
              <span className="text-[var(--text-sm)] font-semibold tabular-nums text-foreground">
                {formatElapsed(elapsedMs)}
              </span>
              <div className="flex-1 h-[3px] rounded-[var(--radius-full)] bg-muted overflow-hidden mx-berry-1">
                <div
                  className="h-full berry-gradient transition-[width] duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[var(--text-xs)] font-medium flex items-center gap-[4px] transition-colors flex-shrink-0",
                  willCancel ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <Trash2 className="w-3 h-3" />
                {willCancel ? "Release to cancel" : "Slide to cancel"}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          beginRecording(e.clientX);
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Hold to record voice note"
        className={cn(
          "w-[44px] h-[44px] rounded-[var(--radius-full)] flex items-center justify-center transition-all touch-none select-none flex-shrink-0",
          isRecording
            ? willCancel
              ? "bg-destructive text-destructive-foreground scale-110"
              : "berry-gradient text-primary-foreground scale-110 berry-shadow"
            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95",
          state === "stopping" && "opacity-60"
        )}
        style={isRecording ? { transform: `translateX(${dragX}px) scale(1.1)` } : undefined}
      >
        <Mic className="w-5 h-5" />
      </button>
    </>
  );
};

export default VoiceRecorderButton;
