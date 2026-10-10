import { describe, expect, test } from "bun:test";
import { inspectBase64Audio, MAX_SPEECH_AUDIO_BYTES } from "../src/lib/audio/base64";
import { RequestBodyTooLargeError, readJsonWithLimit } from "../src/lib/http/read-json-with-limit";

describe("bounded speech audio input", () => {
  test("accepts canonical Base64 and supported audio data URLs", () => {
    const encoded = Buffer.from("valid sample audio payload").toString("base64");
    expect(inspectBase64Audio(encoded)).toEqual({
      payload: encoded,
      byteSize: Buffer.from("valid sample audio payload").length,
    });
    expect(inspectBase64Audio(`data:audio/webm;codecs=opus;base64,${encoded}`)?.payload).toBe(encoded);
  });

  test("rejects malformed, empty, and oversized Base64", () => {
    expect(inspectBase64Audio("%%%=" )).toBeNull();
    expect(inspectBase64Audio("")).toBeNull();
    const oversized = "A".repeat(Math.ceil(MAX_SPEECH_AUDIO_BYTES / 3) * 4 + 4);
    expect(inspectBase64Audio(oversized)).toBeNull();
  });

  test("parses JSON under the byte cap and enforces the streaming cap", async () => {
    const body = JSON.stringify({ audioBase64: "AAAA" });
    const request = new Request("https://example.test/transcribe", { method: "POST", body });
    await expect(readJsonWithLimit(request, 128)).resolves.toEqual({ audioBase64: "AAAA" });

    const tooLarge = new Request("https://example.test/transcribe", {
      method: "POST",
      body: JSON.stringify({ audioBase64: "A".repeat(256) }),
    });
    await expect(readJsonWithLimit(tooLarge, 32)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
