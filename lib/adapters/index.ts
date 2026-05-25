import type { DataAdapter } from "./types";
import { mockAdapter } from "./mock";
import { liveAdapter } from "./live";
import { getDataSource } from "@/lib/config/dataSource";

export const dataAdapter: DataAdapter = (() => {
  switch (getDataSource()) {
    case "live":
      return liveAdapter;
    case "mock":
    default:
      return mockAdapter;
  }
})();

export type { DataAdapter, ListResult, NewsFilter, PoliticianTradeFilter } from "./types";
