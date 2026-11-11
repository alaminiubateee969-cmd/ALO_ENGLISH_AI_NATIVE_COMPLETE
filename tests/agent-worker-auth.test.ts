import { afterEach, describe, expect, test } from "bun:test";
import { hasValidWorkerToken } from "../src/lib/agents/worker-auth";

const original = process.env.AGENT_WORKER_TOKEN;
afterEach(() => {
  if (original === undefined) delete process.env.AGENT_WORKER_TOKEN;
  else process.env.AGENT_WORKER_TOKEN = original;
});

function request(token?: string) {
  return new Request("http://localhost/api/agents/worker/run", {
    headers: token === undefined ? {} : { "x-agent-worker-token": token },
  });
}

describe("agent worker authentication", () => {
  test("an unset server token fails closed", () => {
    delete process.env.AGENT_WORKER_TOKEN;
    expect(hasValidWorkerToken(request("anything"))).toBe(false);
  });

  test("only the exact configured secret is accepted", () => {
    process.env.AGENT_WORKER_TOKEN = "a-long-test-worker-secret";
    expect(hasValidWorkerToken(request("a-long-test-worker-secret"))).toBe(true);
    expect(hasValidWorkerToken(request("a-long-test-worker-secrex"))).toBe(false);
    expect(hasValidWorkerToken(request("short"))).toBe(false);
    expect(hasValidWorkerToken(request())).toBe(false);
  });
});
