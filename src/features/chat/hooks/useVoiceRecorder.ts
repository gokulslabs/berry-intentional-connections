import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "stopping";

interface UseVoiceRecorderOptions {
  maxDurationMs?: number;
  onComplete?: (blob: Blob, durationSec: number) => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

/**
 * MediaRecorder-based voice note recorder.
 * - start() begins capture and a maxDuration timer.
 * - stop() finalizes and emits the recorded blob via onComplete.
 * - cancel() discards the recording.
 */
export function useVoiceRecorder({
  maxDurationMs = 60_000,
  onComplete,
  onCancel,
  onError,
}: UseVoiceRecorderOptions = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTsRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxTimeoutRef.current) {
      window.clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported mime; webm/opus is widely supported.
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const wasCancelled = cancelledRef.current;
        const durationSec = Math.max(0.1, (Date.now() - startTsRef.current) / 1000);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        cleanup();
        setState("idle");
        setElapsedMs(0);
        if (wasCancelled) {
          onCancel?.();
        } else if (blob.size > 0) {
          onComplete?.(blob, durationSec);
        }
      };

      recorder.start(250);
      startTsRef.current = Date.now();
      setState("recording");
      setElapsedMs(0);

      tickRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTsRef.current);
      }, 100);

      maxTimeoutRef.current = window.setTimeout(() => {
        // Auto-stop at max duration
        if (recorderRef.current && recorderRef.current.state === "recording") {
          setState("stopping");
          recorderRef.current.stop();
        }
      }, maxDurationMs);
    } catch (err) {
      cleanup();
      setState("idle");
      onError?.(err instanceof Error ? err : new Error("Microphone access denied"));
    }
  }, [state, maxDurationMs, onComplete, onCancel, onError, cleanup]);

  const stop = useCallback(() => {
    if (state !== "recording" || !recorderRef.current) return;
    setState("stopping");
    recorderRef.current.stop();
  }, [state]);

  const cancel = useCallback(() => {
    if (state !== "recording" || !recorderRef.current) return;
    cancelledRef.current = true;
    setState("stopping");
    recorderRef.current.stop();
  }, [state]);

  return {
    state,
    elapsedMs,
    isRecording: state === "recording",
    start,
    stop,
    cancel,
    maxDurationMs,
  };
}
