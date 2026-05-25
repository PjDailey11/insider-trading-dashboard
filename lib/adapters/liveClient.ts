export class LiveApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LiveApiError";
  }
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, init);
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body && body.error
        ? String(body.error)
        : `Request failed (${res.status})`;
    throw new LiveApiError(msg, res.status);
  }
  return body;
}

export function buildQuery(
  params: Record<string, string | number | string[] | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
