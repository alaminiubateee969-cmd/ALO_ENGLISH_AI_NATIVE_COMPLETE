import { describe, expect, test } from "bun:test";
import { parseSpeakingRecordingPath } from "../src/lib/audio/recording-path";

describe("private speaking recording locators", () => {
  test("accepts only a single filename inside the attempt directory", () => {
    expect(parseSpeakingRecordingPath("speaking/clx123456789012345678901/turn-01.webm")).toEqual({
      attemptId: "clx123456789012345678901",
      filename: "turn-01.webm",
    });
  });

  test("rejects traversal, separators, absolute paths, and nested filenames", () => {
    for (const value of [
      "speaking/clx123456789012345678901/../other/turn.webm",
      "speaking/clx123456789012345678901/%2e%2e/turn.webm",
      "speaking/clx123456789012345678901\\..\\other\\turn.webm",
      "/speaking/clx123456789012345678901/turn.webm",
      "speaking/clx123456789012345678901/nested/turn.webm",
      "speaking/clx123456789012345678901/turn.exe",
      "speaking/not-a-valid-id/turn.webm",
      "speaking/clx123456789012345678901/",
      null,
      42,
    ]) {
      expect(parseSpeakingRecordingPath(value)).toBeNull();
    }
  });
});
