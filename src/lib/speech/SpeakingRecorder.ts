/**
 * src/lib/speech/SpeakingRecorder.ts
 *
 * Browser-based microphone recording utility for the speaking exam.
 * Uses MediaRecorder API to capture audio, then uploads to the server.
 *
 * This is a CLIENT-SIDE utility (not a server module).
 * Imported by the practice-test page's speaking section.
 */

export type RecordingState = "idle" | "recording" | "stopped" | "uploading" | "uploaded" | "error";

export type RecordingResult = {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  mimeType: string;
};

export type SpeakingRecorderOptions = {
  mimeType?: string;
  maxDurationMs?: number;
  minDurationMs?: number;
  maxSizeBytes?: number;
};

const DEFAULT_OPTIONS: Required<SpeakingRecorderOptions> = {
  mimeType: "audio/webm;codecs=opus",
  maxDurationMs: 120000, // 2 minutes max
  minDurationMs: 3000,   // 3 seconds min
  maxSizeBytes: 25 * 1024 * 1024, // 25MB max
};

export class SpeakingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private options: Required<SpeakingRecorderOptions>;
  private state: RecordingState = "idle";
  private error: string = "";

  constructor(options?: SpeakingRecorderOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if the browser supports microphone recording.
   */
  static isSupported(): boolean {
    return typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== "undefined";
  }

  /**
   * Request microphone permission and start recording.
   * Returns a promise that resolves when recording starts.
   */
  async startRecording(): Promise<void> {
    if (this.state === "recording") {
      throw new Error("Already recording");
    }

    if (!SpeakingRecorder.isSupported()) {
      this.state = "error";
      this.error = "Your browser does not support microphone recording. Please use Chrome, Firefox, or Edge.";
      throw new Error(this.error);
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      this.state = "error";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          this.error = "Microphone permission denied. Please allow microphone access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          this.error = "No microphone found. Please connect a microphone and try again.";
        } else if (err.name === "NotReadableError") {
          this.error = "Microphone is being used by another application. Please close it and try again.";
        } else {
          this.error = `Microphone error: ${err.message}`;
        }
      } else {
        this.error = "Failed to access microphone. Please check your device.";
      }
      throw new Error(this.error);
    }

    try {
      // Pick the best supported mimeType
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
    } catch {
      // Fallback to default mimeType
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.chunks = [];
    this.startTime = Date.now();
    this.state = "recording";
    this.error = "";

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Collect data every 1 second

    // Auto-stop after maxDuration
    setTimeout(() => {
      if (this.state === "recording") {
        this.stopRecording();
      }
    }, this.options.maxDurationMs);
  }

  /**
   * Stop recording and return the audio blob.
   */
  async stopRecording(): Promise<RecordingResult> {
    if (this.state !== "recording" || !this.mediaRecorder) {
      throw new Error("Not recording");
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recorder"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.startTime;
        const mimeType = this.mediaRecorder?.mimeType || this.options.mimeType;
        const blob = new Blob(this.chunks, { type: mimeType });

        if (blob.size === 0) {
          this.state = "error";
          this.error = "Recording is empty. Please speak louder and try again.";
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        if (blob.size > this.options.maxSizeBytes) {
          this.state = "error";
          this.error = "Recording is too large. Please keep it under 2 minutes.";
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        if (duration < this.options.minDurationMs) {
          this.state = "error";
          this.error = `Recording is too short (${Math.round(duration / 1000)}s). Please speak for at least ${Math.round(this.options.minDurationMs / 1000)} seconds.`;
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        this.state = "stopped";
        const url = URL.createObjectURL(blob);

        resolve({
          blob,
          url,
          duration,
          size: blob.size,
          mimeType,
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Upload the recording to the server.
   */
  async uploadRecording(
    recording: RecordingResult,
    attemptId: string,
    questionId: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    this.state = "uploading";

    const formData = new FormData();
    formData.append("audio", recording.blob, "speaking.webm");
    formData.append("attemptId", attemptId);
    formData.append("questionId", questionId);
    formData.append("duration", String(recording.duration));
    formData.append("mimeType", recording.mimeType);

    try {
      const response = await fetch("/api/speaking/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        this.state = "uploaded";
        return { success: true, filePath: data.data?.filePath };
      } else {
        this.state = "error";
        this.error = data.message || "Upload failed";
        return { success: false, error: this.error };
      }
    } catch (err) {
      this.state = "error";
      this.error = "Network error during upload. Please check your connection and try again.";
      return { success: false, error: this.error };
    }
  }

  /**
   * Cancel recording and cleanup.
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.state === "recording") {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.state = "idle";
  }

  /**
   * Get current state.
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Get last error message.
   */
  getError(): string {
    return this.error;
  }

  /**
   * Release microphone and cleanup resources.
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  /**
   * Find the best supported audio mimeType.
   */
  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ""; // Let browser choose default
  }
}
