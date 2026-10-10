"use client";

/**
 * src/app/live-exam/page.tsx
 *
 * Session-only conversational speaking practice.
 *
 * This page records audio in the browser, sends it to the configured speech
 * recognition service for a transcript, and requests a conversational reply.
 * It does not create a persisted exam attempt or produce a speaking score.
 *   1. Student starts a practice conversation with synthetic voice.
 *   2. Browser captures a short audio clip and submits it for transcription.
 *   3. The transcript is sent to a configured conversational response service.
 *   4. The response is played using generated or browser speech.
 *   5. Turns and recording URLs exist only in the current browser session.
 *
 * This is not a scored test. Provider processing and retention are governed
 * by the configured service; learners should not submit sensitive information.
 */

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExaminerAvatar } from "@/components/exam/ExaminerAvatar";
import { SpeakingRecorder, type RecordingResult } from "@/lib/speech/SpeakingRecorder";
import { AI_EXAMINERS, type AIExaminer } from "@/lib/agents/AIExaminers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Volume2 } from "lucide-react";

type Turn = {
  role: "examiner" | "student";
  text: string;
  timestamp: string;
  audioUrl?: string;
};

type ExamPhase = "not-started" | "greeting" | "awaiting-student" | "recording" | "transcribing" | "examiner-responding" | "examiner-speaking" | "completed";

// Browser capability reads for useSyncExternalStore. The server snapshot stays
// optimistic so server HTML and the hydration render agree.
const subscribeToNothing = () => () => {};
const isMicSupported = () => SpeakingRecorder.isSupported();
const isMicSupportedOnServer = () => true;

const STATE_LABELS: Record<string, string> = {
  introduction: "Speaking practice: Introduction",
  part1_questions: "Speaking practice: Conversation",
  part2_instructions: "Speaking practice: Topic prompt",
  part2_preparation: "Speaking practice: Preparation",
  part2_long_turn: "Speaking practice: Longer response",
  part2_followup: "Speaking practice: Follow-up",
  part3_discussion: "Speaking practice: Broader discussion",
  closing: "Speaking practice: Closing",
  completed: "Conversation complete",
};

export default function LiveExamPage() {
  const router = useRouter();

  const [examiner, setExaminer] = useState<AIExaminer>(AI_EXAMINERS[1]);
  const [phase, setPhase] = useState<ExamPhase>("not-started");
  const [currentState, setCurrentState] = useState<string>("introduction");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string>("");
  const recorderRef = useRef<SpeakingRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingUrlsRef = useRef<string[]>([]);

  // Microphone support is a browser capability, so it is read through
  // useSyncExternalStore: the server snapshot stays optimistic (true) to keep
  // hydration stable, then React re-reads the real value after hydration.
  const micSupported = useSyncExternalStore(
    subscribeToNothing,
    isMicSupported,
    isMicSupportedOnServer
  );

  // ─── Browser speech synthesis fallback (if TTS API fails) ─────────────
  const speakWithBrowser = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    setPhase("examiner-speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setPhase((prev) => (prev === "examiner-speaking" ? "awaiting-student" : prev));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // ─── Play examiner audio ──────────────────────────────────────────────
  const playExaminerAudio = useCallback((audioUrl: string) => {
    setPhase("examiner-speaking");
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — show play button
        speakWithBrowser("");
      });
    }
  }, []);

  // ─── Get examiner's response (LLM + TTS) ─────────────────────────────
  const getExaminerResponse = useCallback(
    async (transcript: string) => {
      setPhase("examiner-responding");
      setError("");

      try {
        const history = turns.map((t) => ({
          role: t.role,
          text: t.text,
          timestamp: t.timestamp,
        }));

        const response = await fetch("/api/speaking/examiner-respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            history,
            currentState,
            examinerId: examiner.id,
          }),
        });

        if (!response.ok) throw new Error("Examiner response failed");
        const data = await response.json();

        if (!data.success) throw new Error(data.message || "Examiner response failed");

        const examinerTurn: Turn = {
          role: "examiner",
          text: data.data.text,
          timestamp: new Date().toISOString(),
          audioUrl: data.data.audioBase64
            ? `data:${data.data.audioMimeType || "audio/wav"};base64,${data.data.audioBase64}`
            : undefined,
        };

        setTurns((prev) => [...prev, examinerTurn]);
        setCurrentState(data.data.nextState || currentState);

        // Play examiner voice
        if (examinerTurn.audioUrl) {
          playExaminerAudio(examinerTurn.audioUrl);
        } else {
          speakWithBrowser(examinerTurn.text);
        }

        // Check if exam is complete
        if (data.data.isComplete || data.data.nextState === "completed") {
          setTimeout(() => setPhase("completed"), 2000);
        } else {
          setTimeout(() => setPhase("awaiting-student"), 1000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get examiner response");
        setPhase("awaiting-student");
      }
    },
    [turns, currentState, examiner.id]
  );

  // ─── Start the exam: greet the student ─────────────────────────────────
  const startExam = useCallback(async () => {
    setError("");
    setPhase("greeting");
    recordingUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    recordingUrlsRef.current = [];
    setTurns([]);

    try {
      // Fetch examiner greeting via examiner-respond API (no transcript needed)
      const response = await fetch("/api/speaking/examiner-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: "",
          history: [],
          currentState: "introduction",
          examinerId: examiner.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to start exam");
      const data = await response.json();

      if (!data.success) throw new Error(data.message || "Failed to start exam");

      const greetingTurn: Turn = {
        role: "examiner",
        text: data.data.text,
        timestamp: new Date().toISOString(),
        audioUrl: data.data.audioBase64
          ? `data:${data.data.audioMimeType || "audio/wav"};base64,${data.data.audioBase64}`
          : undefined,
      };

      setTurns([greetingTurn]);
      setCurrentState(data.data.nextState || "introduction");

      // Play examiner voice
      if (greetingTurn.audioUrl) {
        playExaminerAudio(greetingTurn.audioUrl);
      } else {
        // Use browser speech synthesis as fallback
        speakWithBrowser(greetingTurn.text);
      }

      // After greeting, listen for student
      setTimeout(() => setPhase("awaiting-student"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
      setPhase("not-started");
    }
  }, [examiner]);

  const processRecording = useCallback(async (recording: RecordingResult) => {
    recordingUrlsRef.current.push(recording.url);
    const studentTurn: Turn = {
      role: "student",
      text: "[Transcribing...]",
      timestamp: new Date().toISOString(),
      audioUrl: recording.url,
    };
    setTurns((prev) => [...prev, studentTurn]);
    setPhase("transcribing");

    try {
      const audioBase64 = await blobToBase64(recording.blob);
      const sttResponse = await fetch("/api/speaking/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64 }),
      });

      if (!sttResponse.ok) throw new Error("Transcription failed");
      const sttData = await sttResponse.json();
      if (!sttData.success) throw new Error(sttData.message || "Transcription failed");

      const transcript = typeof sttData.data?.transcript === "string" ? sttData.data.transcript : "";
      setTurns((prev) => prev.map((turn, index) =>
        index === prev.length - 1 ? { ...turn, text: transcript || "[No speech detected]" } : turn
      ));

      if (!transcript || transcript.length < 5) {
        setError("I couldn't hear you clearly. Please try speaking again.");
        setPhase("awaiting-student");
        return;
      }

      await getExaminerResponse(transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording processing failed");
      setPhase("awaiting-student");
    }
  }, [getExaminerResponse]);

  // ─── Start recording student speech ──────────────────────────────────
  const startRecording = useCallback(async () => {
    setError("");
    setPhase("recording");

    try {
      const recorder = new SpeakingRecorder({
        maxDurationMs: 120_000,
        minDurationMs: 3_000,
        onMaxDuration: (recording) => {
          setError("The 2-minute recording limit was reached; the captured audio is being transcribed.");
          void processRecording(recording);
        },
        onError: (message) => {
          setError(message);
          setPhase("awaiting-student");
        },
      });
      recorderRef.current = recorder;
      await recorder.startRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microphone access failed");
      setPhase("awaiting-student");
    }
  }, [processRecording]);

  // ─── Stop recording and process student speech ───────────────────────
  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      const recording = await recorder.stopRecording();
      await processRecording(recording);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording processing failed");
      setPhase("awaiting-student");
    }
  }, [processRecording]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancelRecording();
      }
      recordingUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      recordingUrlsRef.current = [];
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ─── Change examiner ────────────────────────────────────────────────
  const selectExaminer = (ex: AIExaminer) => {
    if (phase !== "not-started") return;
    setExaminer(ex);
  };

  const isSpeaking = phase === "examiner-speaking" || phase === "greeting";
  const isListening = phase === "awaiting-student";
  const isThinking = phase === "transcribing" || phase === "examiner-responding";
  const isRecording = phase === "recording";

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Speaking Conversation Practice
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Session-only conversation practice. No saved attempt, official score, or acoustic pronunciation evaluation is produced.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Microphone not supported warning */}
        {!micSupported && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-900">Microphone Not Supported</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your browser does not support microphone recording. Please use Chrome, Firefox, or Edge on desktop or Android.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Examiner selection (only before exam starts) */}
        {phase === "not-started" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose a conversation practice guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AI_EXAMINERS.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => selectExaminer(ex)}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                      examiner.id === ex.id
                        ? "border-rose-500 bg-rose-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-rose-300"
                    }`}
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-200">
                        <Image
                          src={ex.avatarUrl}
                          alt={ex.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-900">{ex.name}</span>
                        {examiner.id === ex.id && <CheckCircle2 className="ml-1 inline h-4 w-4 text-rose-500" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{ex.title}</span>
                    <p className="text-xs text-slate-600 line-clamp-2">{ex.personality}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main exam interface */}
        {phase !== "not-started" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Examiner avatar */}
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center pt-6">
                <ExaminerAvatar
                  name={examiner.name}
                  title={examiner.title}
                  avatarUrl={examiner.avatarUrl}
                  avatarDescription={examiner.avatarDescription}
                  state={STATE_LABELS[currentState] || currentState}
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  isThinking={isThinking}
                />

                {/* State progress */}
                <div className="mt-6 w-full">
                  <p className="mb-2 text-xs font-medium text-slate-500">Conversation flow</p>
                  <div className="flex flex-col gap-1">
                    {Object.entries(STATE_LABELS).map(([key, label]) => {
                      const stateOrder = Object.keys(STATE_LABELS);
                      const currentIdx = stateOrder.indexOf(currentState);
                      const thisIdx = stateOrder.indexOf(key);
                      const isDone = thisIdx < currentIdx;
                      const isCurrent = key === currentState;
                      if (key === "completed" && currentState !== "completed") return null;
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                            isCurrent
                              ? "bg-rose-50 font-medium text-rose-700"
                              : isDone
                                ? "text-slate-400"
                                : "text-slate-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? "bg-rose-500" : isDone ? "bg-emerald-400" : "bg-slate-300"}`} />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Conversation + controls */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Conversation transcript */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Conversation</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {turns.length} turns
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                    {turns.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-400">
                        Conversation will appear here
                      </p>
                    )}
                    {turns.map((turn, i) => (
                      <div
                        key={i}
                        className={`flex ${turn.role === "examiner" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            turn.role === "examiner"
                              ? "rounded-tl-sm bg-slate-100 text-slate-800"
                              : "rounded-tr-sm bg-rose-500 text-white"
                          }`}
                        >
                          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-medium opacity-70">
                            {turn.role === "examiner" ? (
                              <Volume2 className="h-3 w-3" />
                            ) : (
                              <Mic className="h-3 w-3" />
                            )}
                            {turn.role === "examiner" ? examiner.name : "You"}
                          </div>
                          <p>{turn.text}</p>
                          {turn.audioUrl && turn.role === "student" && (
                            <audio controls src={turn.audioUrl} className="mt-2 h-8 w-full" />
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Loading indicators */}
                    {phase === "transcribing" && (
                      <div className="flex justify-end">
                        <div className="rounded-2xl rounded-tr-sm bg-rose-500/80 px-4 py-2.5 text-sm text-white">
                          <Loader2 className="h-4 w-4 animate-spin" /> Transcribing your speech...
                        </div>
                      </div>
                    )}
                    {phase === "examiner-responding" && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                          {examiner.name} is thinking...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recording controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    {phase === "awaiting-student" && (
                      <>
                        <p className="text-center text-sm text-slate-600">
                          {examiner.name} is listening. Click the microphone and speak your answer.
                        </p>
                        <Button
                          size="lg"
                          onClick={startRecording}
                          className="h-16 w-16 rounded-full bg-rose-500 p-0 hover:bg-rose-600"
                          aria-label="Start recording"
                        >
                          <Mic className="h-7 w-7" />
                        </Button>
                        <p className="text-xs text-slate-400">Click to start speaking</p>
                      </>
                    )}

                    {isRecording && (
                      <>
                        <p className="text-center text-sm font-medium text-rose-600">
                          ● Recording... Click stop when you finish speaking
                        </p>
                        <Button
                          size="lg"
                          onClick={stopRecording}
                          className="h-16 w-16 rounded-full bg-red-600 p-0 hover:bg-red-700 animate-pulse"
                          aria-label="Stop recording"
                        >
                          <Square className="h-7 w-7" />
                        </Button>
                        <p className="text-xs text-slate-400">Click to stop and submit</p>
                      </>
                    )}

                    {isSpeaking && (
                      <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                          <Volume2 className="h-7 w-7 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600">
                          {examiner.name} is speaking...
                        </p>
                      </>
                    )}

                    {isThinking && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                        <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
                      </div>
                    )}

                    {phase === "completed" && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <p className="text-lg font-bold text-slate-900">Conversation practice complete</p>
                        <p className="max-w-xl text-center text-sm text-slate-600">
                          This session was not saved as an exam attempt and no score was generated. Audio was sent to the configured speech-recognition service; data retention depends on that provider. Do not use this practice flow for sensitive recordings.
                        </p>
                        <Button onClick={() => router.push("/student/dashboard")}>
                          Return to dashboard
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Start button */}
        {phase === "not-started" && micSupported && (
          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={startExam}
              className="h-14 gap-2 bg-rose-500 px-8 text-base hover:bg-rose-600"
            >
              <Play className="h-5 w-5" /> Start conversation practice
            </Button>
          </div>
        )}

        {/* Hidden audio element for examiner voice playback */}
        <audio
          ref={audioRef}
          onEnded={() => setPhase((prev) => (prev === "examiner-speaking" ? "awaiting-student" : prev))}
          className="hidden"
        />
      </div>

      {/* Soundwave animation keyframes */}
      <style jsx>{`
        @keyframes soundwave {
          0% { height: 20%; }
          100% { height: 80%; }
        }
      `}</style>
    </div>
  );
}

// ─── Helper: Convert Blob to Base64 ────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data URL prefix: "data:audio/webm;base64,AAAA..."
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
