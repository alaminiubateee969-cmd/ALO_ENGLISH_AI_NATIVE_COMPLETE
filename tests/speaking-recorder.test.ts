import { afterEach, describe, expect, test } from "bun:test";
import { SpeakingRecorder } from "../src/lib/speech/SpeakingRecorder";

const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const mediaRecorderDescriptor = Object.getOwnPropertyDescriptor(globalThis, "MediaRecorder");

class MockMediaRecorder {
  static isTypeSupported(type: string) {
    return type === "audio/webm;codecs=opus";
  }

  state = "inactive";
  mimeType = "audio/webm;codecs=opus";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(["test audio bytes"], { type: this.mimeType }) });
      this.onstop?.();
    });
  }
}

afterEach(() => {
  if (navigatorDescriptor) {
    Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "navigator");
  }
  if (mediaRecorderDescriptor) {
    Object.defineProperty(globalThis, "MediaRecorder", mediaRecorderDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "MediaRecorder");
  }
});

describe("SpeakingRecorder microphone cleanup", () => {
  test("stops microphone tracks before returning a successful recording", async () => {
    let trackStops = 0;
    const stream = {
      getTracks: () => [{ stop: () => { trackStops += 1; } }],
    } as unknown as MediaStream;

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { mediaDevices: { getUserMedia: async () => stream } },
    });
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      value: MockMediaRecorder,
    });

    const recorder = new SpeakingRecorder({ minDurationMs: 0, maxDurationMs: 10_000 });
    await recorder.startRecording();
    const result = await recorder.stopRecording();

    expect(result.blob.size).toBeGreaterThan(0);
    expect(trackStops).toBe(1);
    expect(recorder.getState()).toBe("stopped");
  });
});
