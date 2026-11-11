"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";

type ConversationTurn = { role: "examiner" | "student"; text: string; timestamp: string };
type ExaminerState = "introduction" | "part1_questions" | "part2_instructions" | "part2_preparation" | "part2_long_turn" | "part3_discussion" | "closing" | "completed";

export function ExaminerConversation({ attemptId }: { attemptId: string }) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [examinerState, setExaminerState] = useState<ExaminerState>("introduction");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const playAudioFromBase64 = useCallback((base64: string, mimeType: string) => {
    if (!base64) {
      // Fallback: use browser speech synthesis
      const lastExaminer = conversation[conversation.length - 1];
      if (lastExaminer?.role === "examiner" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(lastExaminer.text);
        utterance.rate = 0.9;
        utterance.onstart = () => setIsExaminerSpeaking(true);
        utterance.onend = () => setIsExaminerSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
      return;
    }
    const blob = base64ToBlob(base64, mimeType);
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.src = url;
      setIsExaminerSpeaking(true);
      audioRef.current.onended = () => {
        setIsExaminerSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audioRef.current.play().catch(() => {
        setIsExaminerSpeaking(false);
        // Fallback to speech synthesis
        const lastExaminer = conversation[conversation.length - 1];
        if (lastExaminer?.role === "examiner" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(lastExaminer.text);
          utterance.rate = 0.9;
          utterance.onstart = () => setIsExaminerSpeaking(true);
          utterance.onend = () => setIsExaminerSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
      });
    }
  }, [conversation]);

  const startExaminerTurn = useCallback(async (studentTranscript: string) => {
    if (isComplete) return;
    setIsProcessing(true);
    setError("");
    try {
      const response = await fetch("/api/speaking/examiner-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: studentTranscript,
          history: conversation,
          currentState: examinerState,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed");

      const examinerText = data.data.text;
      const newTurn: ConversationTurn = {
        role: "examiner",
        text: examinerText,
        timestamp: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, newTurn]);
      setExaminerState(data.data.nextState);

      if (data.data.isComplete) {
        setIsComplete(true);
      }

      // Play examiner voice
      if (data.data.audioBase64) {
        playAudioFromBase64(data.data.audioBase64, data.data.audioMimeType);
      } else {
        // Fallback: browser speech synthesis
        if ("speechSynthesis" in window) {
          setIsExaminerSpeaking(true);
          const utterance = new SpeechSynthesisUtterance(examinerText);
          utterance.rate = 0.9;
          utterance.onend = () => setIsExaminerSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get examiner response");
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, examinerState, isComplete, playAudioFromBase64]);

  // Start exam automatically. The call is deferred to a microtask so the turn's
  // own state updates land outside the effect body, and it is guarded so a
  // fast unmount cannot apply a stale result.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) startExaminerTurn("");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setIsRecording(true);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());

        if (blob.size === 0) {
          setError("Recording was empty. Please speak louder.");
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setIsProcessing(true);
          try {
            // Transcribe
            const transcribeRes = await fetch("/api/speaking/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: base64 }),
            });
            const transcribeData = await transcribeRes.json();

            let transcript = "";
            if (transcribeData.success) {
              transcript = transcribeData.data.transcript;
            } else {
              transcript = "(speech recognition failed)";
            }

            // Add student turn
            const studentTurn: ConversationTurn = {
              role: "student",
              text: transcript,
              timestamp: new Date().toISOString(),
            };
            setConversation((prev) => [...prev, studentTurn]);

            // Trigger examiner response
            startExaminerTurn(transcript);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Processing failed");
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(1000);
      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 120000);
    } catch (e) {
      setIsRecording(false);
      if (e instanceof DOMException) {
        if (e.name === "NotAllowedError") setError("Microphone permission denied. Please allow access.");
        else if (e.name === "NotFoundError") setError("No microphone found. Please connect one.");
        else setError(`Microphone error: ${e.message}`);
      } else {
        setError("Failed to access microphone.");
      }
    }
  }, [startExaminerTurn]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} className="hidden" />

      {/* Examiner status */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isExaminerSpeaking ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`}>
            🎤
          </div>
          <div>
            <p className="font-semibold text-sm">AI Examiner</p>
            <p className="text-xs text-slate-500">
              {isExaminerSpeaking ? "Speaking..." : isRecording ? "Listening..." : isProcessing ? "Processing..." : "Ready"}
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          {examinerState.replace(/_/g, " ")}
        </span>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
        {conversation.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === "examiner" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${turn.role === "examiner" ? "bg-blue-50 text-slate-700" : "bg-green-50 text-slate-700"}`}>
              <p className="text-xs font-semibold mb-1">{turn.role === "examiner" ? "AI Examiner" : "You"}</p>
              <p className="text-sm">{turn.text}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-blue-50 rounded-2xl p-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        <div ref={conversationEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Controls */}
      {!isComplete && (
        <div className="flex justify-center gap-3">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-white font-semibold hover:bg-red-600"
            >
              <MicOff className="h-5 w-5" /> Stop & Submit
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={isProcessing || isExaminerSpeaking}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Mic className="h-5 w-5" /> {isProcessing ? "Processing..." : "Speak"}
            </button>
          )}
        </div>
      )}

      {isComplete && (
        <div className="text-center p-4 rounded-lg bg-green-50 text-green-700">
          <p className="font-semibold">Speaking test complete!</p>
          <p className="text-sm">Your evaluation will be available shortly.</p>
        </div>
      )}

      {/* Fallback text input */}
      {error && !isRecording && (
        <div className="mt-3">
          <textarea
            placeholder="If microphone doesn't work, type your answer here..."
            className="w-full rounded-lg border p-2 text-sm"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const text = (e.target as HTMLTextAreaElement).value.trim();
                if (text) {
                  const turn: ConversationTurn = { role: "student", text, timestamp: new Date().toISOString() };
                  setConversation((prev) => [...prev, turn]);
                  (e.target as HTMLTextAreaElement).value = "";
                  startExaminerTurn(text);
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: mimeType });
}
