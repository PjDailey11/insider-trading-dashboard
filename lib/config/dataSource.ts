export type DataSource = "mock" | "live";

export function getDataSource(): DataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE;
  if (raw === "mock") return "mock";
  if (raw === "live") return "live";
  return "live";
}

export function isLive(): boolean {
  return getDataSource() === "live";
}
