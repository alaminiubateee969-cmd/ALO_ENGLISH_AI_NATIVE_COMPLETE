/**
 * mini-services/examiner-stream/index.ts
 *
 * WebSocket mini-service for real-time AI examiner conversation streaming.
 *
 * Port: 3003
 * Frontend connects via: io("/?XTransformPort=3003")
 *
 * Enables TRUE real-time voice conversation:
 *   - Client streams audio chunks via WebSocket
 *   - Server accumulates and sends to ASR for transcription
 *   - LLM generates examiner response
 *   - TTS synthesizes voice
 *   - Server streams audio back to client
 */

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "examiner-stream", port: PORT }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

interface SessionState {
  examinerId: string;
  currentState: string;
  history: Array<{ role: string; text: string; timestamp: string }>;
  audioBuffer: string[];
  isExaminerSpeaking: boolean;
}

const sessions = new Map<string, SessionState>();

io.on("connection", (socket) => {
  console.log(`[examiner-stream] Client connected: ${socket.id}`);

  sessions.set(socket.id, {
    examinerId: "examiner-02",
    currentState: "introduction",
    history: [],
    audioBuffer: [],
    isExaminerSpeaking: false,
  });

  socket.on("exam:start", (data: { examinerId?: string }) => {
    const session = sessions.get(socket.id);
    if (!session) return;
    if (data?.examinerId) session.examinerId = data.examinerId;

    fetch("http://localhost:3000/api/speaking/examiner-respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "",
        history: [],
        currentState: "introduction",
        examinerId: session.examinerId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const resp = data.data;
          session.history.push({ role: "examiner", text: resp.text, timestamp: new Date().toISOString() });
          session.currentState = resp.nextState;
          session.isExaminerSpeaking = true;
          socket.emit("examiner:response", {
            text: resp.text,
            audioBase64: resp.audioBase64,
            mimeType: resp.audioMimeType,
            nextState: resp.nextState,
            isComplete: resp.isComplete,
            topic: resp.topic,
          });
          socket.emit("state:update", { state: resp.nextState, isComplete: resp.isComplete });
        }
      })
      .catch((err) => {
        console.error("[examiner-stream] exam:start error:", err);
        socket.emit("error", { message: "Failed to start exam" });
      });
  });

  socket.on("audio:chunk", (data: { chunk: string }) => {
    const session = sessions.get(socket.id);
    if (!session || session.isExaminerSpeaking) return;
    session.audioBuffer.push(data.chunk);
  });

  socket.on("audio:end", () => {
    const session = sessions.get(socket.id);
    if (!session) return;
    const audioBase64 = session.audioBuffer.join("");
    session.audioBuffer = [];

    if (audioBase64.length < 100) {
      socket.emit("transcription:empty", { message: "No speech detected" });
      return;
    }

    socket.emit("status", { phase: "transcribing" });

    fetch("http://localhost:3000/api/speaking/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64 }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          socket.emit("error", { message: "Transcription failed" });
          return;
        }
        const transcript = data.data.transcript || "";
        socket.emit("transcription:result", { transcript, confidence: data.data.confidence });
        if (!transcript || transcript.length < 5) {
          socket.emit("transcription:empty", { message: "No speech detected" });
          return;
        }
        session.history.push({ role: "student", text: transcript, timestamp: new Date().toISOString() });
        socket.emit("status", { phase: "examiner-responding" });

        return fetch("http://localhost:3000/api/speaking/examiner-respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            history: session.history,
            currentState: session.currentState,
            examinerId: session.examinerId,
          }),
        });
      })
      .then((r) => r?.json())
      .then((data) => {
        if (!data?.success) return;
        const resp = data.data;
        session.history.push({ role: "examiner", text: resp.text, timestamp: new Date().toISOString() });
        session.currentState = resp.nextState;
        session.isExaminerSpeaking = true;
        socket.emit("examiner:response", {
          text: resp.text,
          audioBase64: resp.audioBase64,
          mimeType: resp.audioMimeType,
          nextState: resp.nextState,
          isComplete: resp.isComplete,
          topic: resp.topic,
        });
        socket.emit("state:update", { state: resp.nextState, isComplete: resp.isComplete });
        if (resp.isComplete) socket.emit("exam:complete", { message: "Speaking test complete" });
      })
      .catch((err) => {
        console.error("[examiner-stream] audio:end error:", err);
        socket.emit("error", { message: "Processing failed" });
      });
  });

  socket.on("examiner:speaking-end", () => {
    const session = sessions.get(socket.id);
    if (!session) return;
    session.isExaminerSpeaking = false;
    socket.emit("status", { phase: "awaiting-student" });
  });

  socket.on("examiner:select", (data: { examinerId: string }) => {
    const session = sessions.get(socket.id);
    if (!session || session.history.length > 0) return;
    session.examinerId = data.examinerId;
  });

  socket.on("disconnect", () => {
    console.log(`[examiner-stream] Client disconnected: ${socket.id}`);
    sessions.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[examiner-stream] WebSocket service running on port ${PORT}`);
  console.log(`[examiner-stream] Health check: http://localhost:${PORT}/health`);
});

process.on("SIGTERM", () => {
  console.log("[examiner-stream] SIGTERM received, shutting down...");
  io.close(() => httpServer.close(() => process.exit(0)));
});
