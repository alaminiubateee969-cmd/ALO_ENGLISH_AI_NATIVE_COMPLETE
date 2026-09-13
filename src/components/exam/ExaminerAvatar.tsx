"use client";

/**
 * src/components/exam/ExaminerAvatar.tsx
 *
 * Real-time AI Examiner Avatar component.
 *
 * Displays a visual representation of the AI examiner with:
 *   - An avatar image (Bengali examiner persona)
 *   - A speaking animation (pulse rings) when the examiner is talking
 *   - A listening animation (waveform) when waiting for student
 *   - The examiner's name and title
 *   - Current state badge (Introduction, Part 1, Part 2, Part 3, etc.)
 */

import { cn } from "@/lib/utils";
import Image from "next/image";

export type ExaminerAvatarProps = {
  name: string;
  title: string;
  avatarUrl?: string;
  avatarDescription: string;
  state: string;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
};

export function ExaminerAvatar({
  name,
  title,
  avatarUrl,
  avatarDescription,
  state,
  isSpeaking,
  isListening,
  isThinking,
}: ExaminerAvatarProps) {
  const status = isSpeaking
    ? "Speaking"
    : isListening
      ? "Listening"
      : isThinking
        ? "Thinking"
        : "Idle";

  const statusColor = isSpeaking
    ? "bg-emerald-500"
    : isListening
      ? "bg-blue-500"
      : isThinking
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar with animation rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulse rings when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute h-48 w-48 rounded-full bg-emerald-400/20 animate-ping" />
            <div className="absolute h-40 w-40 rounded-full bg-emerald-400/30 animate-pulse" />
          </>
        )}

        {/* Listening rings */}
        {isListening && (
          <>
            <div className="absolute h-48 w-48 rounded-full bg-blue-400/20 animate-pulse" />
          </>
        )}

        {/* Thinking spinner */}
        {isThinking && (
          <div className="absolute h-48 w-48 rounded-full border-4 border-amber-400/30 border-t-amber-500 animate-spin" />
        )}

        {/* Avatar image or fallback */}
        <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-slate-200">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${name} — ${title}`}
              fill
              sizes="144px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-400 to-amber-500 text-white">
              <span className="text-5xl font-bold">{name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Status indicator dot */}
        <div className="absolute -bottom-1 right-4 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-md">
          <span className={cn("h-2.5 w-2.5 rounded-full", statusColor, (isSpeaking || isListening) && "animate-pulse")} />
          <span className="text-xs font-medium text-slate-700">{status}</span>
        </div>
      </div>

      {/* Examiner info */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-500">{title}</p>
      </div>

      {/* Current state badge */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
          {state}
        </span>
      </div>

      {/* Audio waveform visualization when speaking */}
      {isSpeaking && (
        <div className="flex h-8 items-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-emerald-500"
              style={{
                height: `${20 + Math.random() * 60}%`,
                animation: `soundwave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
