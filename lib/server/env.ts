export function getPolygonApiKey(): string | undefined {
  return process.env.POLYGON_API_KEY ?? process.env.PUBLIC_API_KEY;
}

export function getSecApiKey(): string | undefined {
  return process.env.SEC_API_KEY;
}
