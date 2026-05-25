# Tickertape — Trading Dashboard

Desktop-grade trading workspace with an ambient politician-trading signal layer.
Built end-to-end with Next.js 16 (App Router), TypeScript strict, Tailwind, shadcn
primitives, TanStack Table + Query, lightweight-charts, Recharts,
react-resizable-panels, tinykeys, idb-keyval, and Zustand.

```
Header (48px)  →  MarketStrip (32px)
LeftRail (240/56)  ↔  MainContent  ↔  RightRail (320)
BottomPanel (collapsible)
+ Drawers / Modals / CommandPalette (⌘K)
```

## Quick start

```bash
npm install
npm run seed   # writes seed/*.json (deterministic, idempotent)
npm run dev    # http://localhost:3000
```

The dev server boots cleanly without seed regeneration too — `seed/*.json` is
checked in. Regenerate any time and the output is byte-identical thanks to a
fixed Mulberry32 RNG seed in `scripts/generate-seed.ts`.

## Live data (Public.com + SEC Form 4)

Copy `.env.example` to `.env` (or `.env.local`) and set:

```env
PUBLIC_API_KEY=your_public_com_secret
PUBLIC_ACCOUNT_ID=your_brokerage_account_id
SEC_API_KEY=your_sec_api_io_key
```

Live mode is the default. Set `NEXT_PUBLIC_DATA_SOURCE=mock` only to force seed
data. **Never** prefix API secrets with `NEXT_PUBLIC_` — they stay server-side in
route handlers under `app/api/market/*` and `app/api/insiders/*`. The browser
`liveAdapter` only calls same-origin `/api/...` routes.

| Data | Provider | Notes |
|------|----------|-------|
| Quotes, candles | Public.com | Index symbols use INDEX type; macro/yield may chart via ETF proxies |
| Ticker search | Seed | Command palette filters bundled `seed/tickers.json` |
| Insider trades & profiles | sec-api.io Form 4 | Corporate insiders, not congressional PTR |
| News | Mock seed | No live news key yet |

On provider errors, routes may degrade to seed data server-side.

## Scripts

| Script              | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Next.js dev server on `http://localhost:3000`             |
| `npm run build`     | Production build (no TS errors, no lint errors)           |
| `npm run start`     | Run the built app                                         |
| `npm run lint`      | ESLint flat config — extends `next/core-web-vitals`       |
| `npm run typecheck` | `tsc --noEmit` (strict)                                   |
| `npm run seed`      | `tsx scripts/generate-seed.ts` (writes `seed/*.json`)     |
| `npm test`          | Vitest unit tests                                         |
| `npm run test:e2e`  | Playwright smoke test per route (boots dev server)        |

## Routes

| Path                   | Description                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `/`                    | Dashboard home: sector heatmap, top movers, news, alerts summary, politician feed teaser          |
| `/s/[symbol]`          | Symbol workspace — chart, key stats, news, notes, Signals tab; chart shows politician overlays    |
| `/watchlists`          | Watchlists index — create, browse, delete                                                          |
| `/watchlists/[id]`     | Watchlist table on TanStack Table + virtualizer; sortable columns, density toggle, column picker  |
| `/alerts`              | Alerts center — Active / Triggered / Snoozed / Archived tabs; OrderAlertTicket drawer, test-fire  |
| `/portfolio`           | Manual positions, P/L vs live (mock) quotes, allocation donut                                     |
| `/politicians`         | Feed with chip filters (chamber, party, side, owner, min amount); URL-persisted; infinite scroll  |
| `/politicians/[id]`    | Politician profile — header, trade history, top tickers, disclosure-lag histogram, follow toggle  |
| `/screener`            | Filter builder + virtual scan over the mock universe; save/load named screens                     |
| `/settings`            | General, saved layouts (export/import), persistence controls (Clear all data), about              |

## Architecture decisions

- **Adapters first.** Every data fetch goes through an interface in
  `lib/adapters/types.ts`. Live is the default (`liveAdapter` → `/api/*`
  routes backed by Public.com and SEC Form 4). Set
  `NEXT_PUBLIC_DATA_SOURCE=mock` for `mockAdapter` + simulated latency.
- **Zustand slices.** One file per concern in `lib/stores/`. Each slice exposes
  a `bootstrap()` action that loads from IndexedDB on app start (called once in
  `lib/persistence/bootstrap.ts`, invoked from `components/Providers.tsx`).
- **IndexedDB only.** All persistence flows through `lib/persistence/idb.ts`
  using `idb-keyval`. Envelopes are versioned (`SCHEMA_VERSION`) with a
  migration array for future bumps. `localStorage` is **not used**.
- **Error boundaries per region.** Every panel on the dashboard, symbol
  workspace, and politician profile is wrapped in `ErrorBoundary`, so a busted
  feed never wipes the rest of the view.
- **Skeletons, not spinners.** Every async surface renders a `<Skeleton>` while
  loading. Stale quotes show a `<Badge variant="warn">stale</Badge>` chip with
  the last good value.
- **Tabular numerals everywhere.** `.tabular` utility + `data-tabular="true"`
  ensures prices/percents/volumes are aligned across rows.
- **Reduced motion respected.** Global rule in `app/globals.css` zeroes
  animations under `prefers-reduced-motion`.

## Politician layer

- Trades anchored to **trade date** (not disclosure date). Lag visible as a
  `lag Nd` chip on every card.
- Amount buckets are the exact official PTR ladder
  (`1k-15k`, `15k-50k`, …, `50m+`) — typed in `lib/types/index.ts` and helpers
  in `lib/utils/politician.ts`.
- Chart overlays on the symbol workspace cluster nearby trades, use
  importance-based sizing (`bucketImportance`), and color the marker by
  dominant side (buy/sell).
- `politicianTrade` alert kind is fully wired through `alertsStore`,
  `OrderAlertTicket`, and the Signals tab.

## Keyboard shortcuts

`⌘K` command palette · `/` quick search · `?` shortcut sheet ·
`G H/W/A/P/I/S/,` go-to-page · `⌘B` toggle left rail ·
`⌘\` toggle right rail · `⌘J` toggle bottom panel.

## Folder layout

```
app/                   Next.js App Router pages (one per route)
components/
  Providers.tsx        Query client, toaster, persistence bootstrap
  Panel.tsx            Workhorse surface
  EmptyState.tsx
  alerts/              OrderAlertTicket
  charts/              ChartCard (lightweight-charts wrapper)
  errors/              ErrorBoundary
  market/              MarketStatPill, MetricCard, PnLBadge, SectorHeatmap, TickerBadge
  news/                NewsCard
  panels/              SplitPanel
  politicians/         PoliticianTradeCard
  portfolio/           AddPositionDrawer, AllocationDonut
  screener/            (sources colocated in views/ScreenerView for now)
  shell/               AppShell, Header, MarketStrip, LeftRail, RightRail,
                       BottomPanel, CommandPalette, KeyboardShortcuts
  tables/              WatchlistTable, TopMoversTable, AddSymbolForm, AddToWatchlist
  ui/                  Local shadcn-style primitives (button, dialog, drawer, …)
  views/               Per-route view components (DashboardHome, SymbolWorkspace, …)
lib/
  adapters/            types.ts, mock.ts, index.ts (swap point), mockLatency.ts
  hooks/               TanStack Query hooks + small UI hooks
  persistence/         idb.ts (versioned envelope + migrations), bootstrap.ts
  stores/              Zustand slices (one file per domain)
  types/               Domain types — single source of truth
  utils/               format, politician, alerts helpers
scripts/
  generate-seed.ts     Deterministic seed emitter
seed/                  Generated JSON consumed by mockAdapter
tests-e2e/             Playwright smoke
public/
```

## Adding a real data adapter

1. Create `lib/adapters/<provider>.ts` exporting a `DataAdapter`.
2. Switch in `lib/adapters/index.ts`:

   ```ts
   case "live": return liveAdapter;
   ```

3. Configure `PUBLIC_API_KEY`, `PUBLIC_ACCOUNT_ID`, and `SEC_API_KEY` in `.env`.

The store/UI layer does not need to change.

## Known limitations / V2 follow-ups

- No live WebSocket streaming yet — the `QuotesAdapter.stream` slot is
  reserved.
- No broker integration — Positions are manual.
- No options chain yet — `assetType: "option"` flows through types/seed but
  no chain UI.
- Resizable panels (`SplitPanel`) component shipped but not yet wired into
  every workspace; layoutStore already persists shell + saved layouts.
