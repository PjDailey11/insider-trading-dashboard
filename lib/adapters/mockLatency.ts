// Simulated network latency: P50 ≈ 80ms, P95 ≈ 400ms, occasional failure switch.
// Used by mockAdapter so the UI exercises real loading/error states.

const ENABLED = process.env.NEXT_PUBLIC_DATA_SOURCE === "mock" || !process.env.NEXT_PUBLIC_DATA_SOURCE;

export interface LatencyOptions {
  base?: number;
  jitter?: number;
  failureRate?: number; // 0..1
}

export async function simulateLatency(
  opts: LatencyOptions = {},
): Promise<void> {
  if (!ENABLED || typeof window === "undefined") {
    // Skip latency on the server (during SSR) to keep first paint fast.
    return;
  }
  const { base = 60, jitter = 70, failureRate = 0 } = opts;
  // Log-ish skew so most calls are fast, occasional slow ones.
  const r = Math.random();
  const heavy = r > 0.9 ? Math.random() * 320 : 0;
  const wait = base + Math.random() * jitter + heavy;
  await new Promise((resolve) => setTimeout(resolve, wait));
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new Error("Mock adapter: simulated transient failure");
  }
}
