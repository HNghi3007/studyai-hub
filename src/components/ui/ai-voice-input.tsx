"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isDemo, setIsDemo] = useState(demoMode);
  const timeRef = useRef(0);
  const wasSubmittedRef = useRef(false);
  const bars = Array.from({ length: visualizerBars }, (_, i) => ({
    height: `${20 + ((i * 31) % 75)}%`,
    animationDelay: `${i * 0.05}s`,
  }));

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (submitted) {
      onStart?.();
      wasSubmittedRef.current = true;
      intervalId = setInterval(() => {
        timeRef.current += 1;
        setTime(timeRef.current);
      }, 1000);
    } else if (wasSubmittedRef.current) {
      wasSubmittedRef.current = false;
      onStop?.(timeRef.current);
      timeRef.current = 0;
      const timeoutId = setTimeout(() => setTime(0), 0);
      return () => clearTimeout(timeoutId);
    }
    return () => clearInterval(intervalId);
  }, [submitted, onStart, onStop]);

  useEffect(() => {
    if (!isDemo) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };
    const initialTimeout = setTimeout(runAnimation, 100);
    return () => { clearTimeout(timeoutId); clearTimeout(initialTimeout); };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) { setIsDemo(false); setSubmitted(false); }
    else setSubmitted((prev) => !prev);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            submitted ? "bg-none" : "bg-none hover:bg-white/10"
          )}
          type="button"
          onClick={handleClick}
        >
          {submitted ? (
            <div
              className="w-6 h-6 rounded-sm animate-spin bg-white cursor-pointer"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className="w-6 h-6 text-white/70" />
          )}
        </button>

        <span className={cn(
          "font-mono text-sm transition-opacity duration-300",
          submitted ? "text-white/70" : "text-white/30"
        )}>
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {bars.map((bar, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted ? "bg-white/50 animate-pulse" : "bg-white/10 h-1"
              )}
              style={submitted ? bar : undefined}
            />
          ))}
        </div>

        <p className="h-4 text-xs text-white/70">
          {submitted ? "Đang nghe..." : "Nhấn để nói"}
        </p>
      </div>
    </div>
  );
}
