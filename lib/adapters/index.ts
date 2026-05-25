import type { DataAdapter } from "./types";
import { mockAdapter } from "./mock";

const SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

export const dataAdapter: DataAdapter = (() => {
  switch (SOURCE) {
    case "mock":
      return mockAdapter;
    default:
      // Future: case "polygon": return polygonAdapter; etc.
      return mockAdapter;
  }
})();

export type { DataAdapter, ListResult, NewsFilter, PoliticianTradeFilter } from "./types";
