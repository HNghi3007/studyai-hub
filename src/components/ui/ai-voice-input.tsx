"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number, transcript: string) => void;
  visualizerBars?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  className,
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      setTime(0);
    }
    return () => clearInterval(intervalId);
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Trinh duyet khong ho tro nhan dien giong noi. Hay dung Chrome hoac Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += text + " ";
        else interim += text;
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setTranscript("");
    setSubmitted(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setSubmitted(false);
    onStop?.(time, transcript.trim());
  };

  const handleClick = () => {
    if (submitted) stopListening();
    else startListening();
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

        <span className={cn("font-mono text-sm transition-opacity duration-300", submitted ? "text-white/70" : "text-white/30")}>
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn("w-0.5 rounded-full transition-all duration-300", submitted ? "bg-white/50 animate-pulse" : "bg-white/10 h-1")}
              style={
                submitted && isClient
                  ? { height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-white/70 text-center px-4">
          {submitted ? (transcript || "Dang nghe...") : "Nhan de noi"}
        </p>
      </div>
    </div>
  );
}