export type DataSource = "mock" | "live";

export function getDataSource(): DataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";
  return raw === "live" ? "live" : "mock";
}

export function isLive(): boolean {
  return getDataSource() === "live";
}
