/**
 * Browser-side microphone recorder for session-only speaking conversation
 * practice. The caller decides whether to submit the resulting blob; this
 * utility does not persist or upload recordings.
 */

export type RecordingState = 'idle' | 'recording' | 'stopped' | 'error';

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
  onMaxDuration?: (recording: RecordingResult) => void;
  onError?: (message: string) => void;
};

type ResolvedOptions = Required<Pick<
  SpeakingRecorderOptions,
  'mimeType' | 'maxDurationMs' | 'minDurationMs' | 'maxSizeBytes'
>> & Pick<SpeakingRecorderOptions, 'onMaxDuration' | 'onError'>;

const DEFAULT_OPTIONS = {
  mimeType: 'audio/webm;codecs=opus',
  maxDurationMs: 120_000,
  minDurationMs: 3_000,
  maxSizeBytes: 10 * 1024 * 1024,
};

export class SpeakingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private options: ResolvedOptions;
  private state: RecordingState = 'idle';
  private error = '';
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options?: SpeakingRecorderOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Check whether the current browser supports microphone recording. */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined';
  }

  /** Request microphone permission and begin recording. */
  async startRecording(): Promise<void> {
    if (this.state === 'recording') throw new Error('Already recording');

    if (!SpeakingRecorder.isSupported()) {
      this.state = 'error';
      this.error = 'Your browser does not support microphone recording. Please use Chrome, Firefox, or Edge.';
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
      this.state = 'error';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          this.error = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          this.error = 'No microphone found. Please connect a microphone and try again.';
        } else if (err.name === 'NotReadableError') {
          this.error = 'Microphone is being used by another application. Please close it and try again.';
        } else {
          this.error = `Microphone error: ${err.message}`;
        }
      } else {
        this.error = 'Failed to access microphone. Please check your device.';
      }
      throw new Error(this.error);
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128_000,
      });
    } catch {
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.chunks = [];
    this.startTime = Date.now();
    this.state = 'recording';
    this.error = '';

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    this.mediaRecorder.start(1_000);
    this.autoStopTimer = setTimeout(() => {
      if (this.state !== 'recording') return;
      void this.stopRecording()
        .then((recording) => this.options.onMaxDuration?.(recording))
        .catch(() => this.options.onError?.(this.error || 'The recording could not be completed.'));
    }, this.options.maxDurationMs);
  }

  /** Stop recording and return the in-memory audio blob. */
  async stopRecording(): Promise<RecordingResult> {
    if (this.state !== 'recording' || !this.mediaRecorder) {
      throw new Error('Not recording');
    }

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder;
      if (!recorder) {
        reject(new Error('No recorder'));
        return;
      }

      recorder.onstop = () => {
        const duration = Date.now() - this.startTime;
        const mimeType = recorder.mimeType || this.options.mimeType;
        const blob = new Blob(this.chunks, { type: mimeType });

        if (blob.size === 0) {
          this.state = 'error';
          this.error = 'Recording is empty. Please speak louder and try again.';
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        if (blob.size > this.options.maxSizeBytes) {
          this.state = 'error';
          this.error = 'Recording exceeds the 10 MB processing limit.';
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        if (duration < this.options.minDurationMs) {
          this.state = 'error';
          this.error = `Recording is too short (${Math.round(duration / 1000)}s). Please speak for at least ${Math.round(this.options.minDurationMs / 1000)} seconds.`;
          reject(new Error(this.error));
          this.cleanup();
          return;
        }

        this.state = 'stopped';
        const url = URL.createObjectURL(blob);
        // The recording is now an in-memory Blob. Release the microphone tracks
        // before returning control to the caller or starting network processing.
        this.cleanup();
        resolve({ blob, url, duration, size: blob.size, mimeType });
      };

      recorder.stop();
    });
  }

  /** Cancel recording and release the microphone. */
  cancelRecording(): void {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    if (this.mediaRecorder && this.state === 'recording') this.mediaRecorder.stop();
    this.cleanup();
    this.state = 'idle';
  }

  getState(): RecordingState {
    return this.state;
  }

  getError(): string {
    return this.error;
  }

  private cleanup(): void {
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }
}
