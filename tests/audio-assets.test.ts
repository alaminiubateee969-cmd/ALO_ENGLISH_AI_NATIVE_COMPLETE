import { describe, expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  MAX_MP3_BYTES,
  MIN_MP3_BYTES,
  inspectMp3Buffer,
  resolvePublicListeningFile,
} from '../scripts/listening-audio-utils.mjs';
import { runAudioVerification } from '../scripts/verify-listening-audio.mjs';

function fakeMp3(size = 2048, withId3 = false) {
  const buffer = Buffer.alloc(size, 0);
  if (withId3) {
    buffer.write('ID3', 0, 'ascii');
    buffer[3] = 3;
    buffer[4] = 0;
    buffer[5] = 0;
    buffer.fill(0, 6, 10);
    buffer.set([0xff, 0xfb, 0x90, 0x64], 10);
  } else {
    buffer.set([0xff, 0xfb, 0x90, 0x64], 0);
  }
  return buffer;
}

describe('Listening audio asset validation', () => {
  test('accepts MP3 frame headers with and without an ID3 tag and hashes the bytes', () => {
    for (const bytes of [fakeMp3(), fakeMp3(4096, true)]) {
      const result = inspectMp3Buffer(bytes);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('audio/mpeg');
      expect(result.byteSize).toBe(bytes.length);
      expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  test('rejects short, oversized, truncated-tag and non-MP3 files', () => {
    expect(inspectMp3Buffer(fakeMp3(MIN_MP3_BYTES - 1)).reason).toBe('TOO_SMALL');
    expect(inspectMp3Buffer(fakeMp3(MAX_MP3_BYTES + 1)).reason).toBe('TOO_LARGE');
    expect(inspectMp3Buffer(Buffer.from('not an audio file'.padEnd(2048, ' '))).reason).toBe('NO_MPEG_AUDIO_FRAME');

    const truncated = Buffer.alloc(2048);
    truncated.write('ID3', 0, 'ascii');
    truncated[6] = 0x7f;
    truncated[7] = 0x7f;
    truncated[8] = 0x7f;
    truncated[9] = 0x7f;
    expect(inspectMp3Buffer(truncated).reason).toBe('ID3_TAG_TOO_LARGE');
  });

  test('only resolves same-origin listening paths beneath public/audio/listening', async () => {
    const root = await mkdtemp(join(tmpdir(), 'alo-audio-test-'));
    const publicDir = join(root, 'public');
    await mkdir(join(publicDir, 'audio', 'listening'), { recursive: true });
    try {
      const expected = join(publicDir, 'audio', 'listening', 'q1.mp3');
      await writeFile(expected, fakeMp3());
      expect(resolvePublicListeningFile('/audio/listening/q1.mp3', publicDir, 'https://english.aloeducation.com')).toBe(expected);
      expect(resolvePublicListeningFile('https://evil.example/audio/listening/q1.mp3', publicDir, 'https://english.aloeducation.com')).toBeNull();
      expect(resolvePublicListeningFile('/audio/listening/%2e%2e/%2e%2e/secret.mp3', publicDir, 'https://english.aloeducation.com')).toBeNull();
      expect(resolvePublicListeningFile('/upload/audio/q1.mp3', publicDir, 'https://english.aloeducation.com')).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test('verification records READY only when local bytes and public HTTP delivery both validate', async () => {
    const root = await mkdtemp(join(tmpdir(), 'alo-audio-verify-'));
    const publicDir = join(root, 'public');
    const audioDir = join(publicDir, 'audio', 'listening');
    await mkdir(audioDir, { recursive: true });
    const bytes = fakeMp3();
    await writeFile(join(audioDir, 'q-good.mp3'), bytes);

    const originalFetch = globalThis.fetch;
    const persisted: Array<{ create: { status: string }; update: { status: string } }> = [];
    const prisma = {
      question: {
        findMany: async () => [
          { id: 'q-good', audioUrl: '/audio/listening/q-good.mp3', passage: 'Original private script.', practiceSet: { title: 'Sample' } },
          { id: 'q-missing', audioUrl: '/audio/listening/missing.mp3', passage: 'Original private script.', practiceSet: { title: 'Sample' } },
        ],
      },
      questionAudioAsset: {
        upsert: async (input: { create: { status: string }; update: { status: string } }) => {
          persisted.push(input);
          return input;
        },
      },
    };

    globalThis.fetch = async () => new Response(bytes, {
      status: 206,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Range': `bytes 0-${bytes.length - 1}/${bytes.length}`,
      },
    });
    try {
      const counts = await runAudioVerification(prisma as never, {
        baseUrl: 'https://english.aloeducation.com',
        publicDir,
      });
      expect(counts).toEqual({ eligible: 2, verified: 1, failed: 1 });
      expect(persisted.map((row) => row.create.status)).toEqual(['READY', 'FAILED']);
    } finally {
      globalThis.fetch = originalFetch;
      await rm(root, { recursive: true, force: true });
    }
  });
});
