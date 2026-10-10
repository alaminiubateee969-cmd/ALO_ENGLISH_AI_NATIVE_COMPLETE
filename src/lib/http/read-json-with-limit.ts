/** Read and parse a JSON request body while enforcing a streaming byte cap. */
export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the maximum allowed size");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readJsonWithLimit(req: Request, maxBytes: number): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("maxBytes must be a positive safe integer");

  const contentLength = req.headers.get("content-length");
  if (contentLength !== null) {
    const declared = Number(contentLength);
    if (!Number.isSafeInteger(declared) || declared < 0) throw new SyntaxError("Invalid Content-Length");
    if (declared > maxBytes) throw new RequestBodyTooLargeError();
  }

  if (!req.body) throw new SyntaxError("Missing request body");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}
