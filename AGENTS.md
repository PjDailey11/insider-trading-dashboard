# AGENTS.md — Tickertape

Guidance for AI coding agents (Cursor, Claude, etc.) working in this repo.
Humans: read `README.md` first.

## Hard rules

1. **No localStorage.** All persistence flows through
   `lib/persistence/idb.ts` (IndexedDB via `idb-keyval`) with a versioned
   envelope and migration array. If you need a new key, add it to `KEYS` in
   that file and follow the existing envelope pattern.
2. **No `any`.** TypeScript is strict and `noUncheckedIndexedAccess` is on.
   Use `unknown` and narrow. Every component exports a named `Props`
   interface above the component.
3. **One component per file.** Named export, props interface immediately
   above. Use `class-variance-authority` for variants where multiple visual
   states share a base.
4. **All data behind adapters.** Never call a vendor SDK from a component.
   Add a method to the relevant interface in `lib/adapters/types.ts`,
   implement it in `lib/adapters/mock.ts`, expose it via the swap point in
   `lib/adapters/index.ts`, then consume with a TanStack Query hook in
   `lib/hooks/`.
5. **Politician trades anchor to trade date, not disclosure date.** Lag is
   shown as a chip. Amount buckets are the exact official PTR ladder — never
   coerce to numeric ranges in UI. Use `bucketLabel` / `bucketImportance` in
   `lib/utils/politician.ts`.
6. **Skeletons, not spinners.** Loading state inside any panel is a
   `<Skeleton>` matching the final shape.
7. **Error boundary per region.** Wrap each dashboard / workspace panel in
   `<ErrorBoundary region="…">`. A failing quote/news/politician feed must
   not unmount the rest of the page.
8. **Tabular numerals on numbers.** Every price/percent/volume cell uses the
   `.tabular` utility (or `data-tabular="true"`) and the mono font.
9. **Respect `prefers-reduced-motion`.** Don't add custom animations that
   bypass the global rule in `app/globals.css`.

## House conventions

- **Design tokens** live in `app/globals.css` (HSL channels) and
  `tailwind.config.ts` (semantic Tailwind aliases). Add new colors as CSS
  variables first, then expose via Tailwind. Avoid raw hex in components.
- **Hairline borders, no gradients on data surfaces, no glassmorphism.** The
  product reads as a Bloomberg-meets-Linear terminal. Backgrounds: bg /
  bg-raised / bg-sunken / bg-overlay. Borders: border / border-strong /
  border-muted.
- **Mono font (JetBrains Mono)** for ticker symbols, prices, kbd, code, and
  small data labels. Sans (Inter) for everything else.
- **shadcn-style primitives** live in `components/ui/`. Treat them as
  copied-in source — modify in place rather than wrapping.
- **Zustand slices** in `lib/stores/`. Each slice exposes a `bootstrap()`
  action invoked from `lib/persistence/bootstrap.ts`. New slices that need
  persistence: import `KEYS`, `loadPersisted`, `savePersisted` from
  `lib/persistence/idb.ts`.
- **Server vs client components.** Pages in `app/**/page.tsx` are server
  components that render a client view from `components/views/`. Keep heavy
  client state (Zustand, queries) inside the view component.

## Working with the chart

`components/charts/ChartCard.tsx` wraps `lightweight-charts`. Key points:

- It re-instantiates the chart when `interval` changes (cleanest approach
  for lightweight-charts subscriptions).
- Politician overlay markers come from
  `usePoliticianTradesForSymbol(symbol)` and are bucketed by candle time, so
  multiple trades on the same day cluster into one marker. Marker size is
  driven by `bucketImportance` of the largest trade in the bucket.

## Adding a new alert kind

1. Add to `AlertKind` and a new trigger interface in `lib/types/index.ts`.
2. Extend `AlertTrigger` union.
3. Add a card to `OrderAlertTicket` (`components/alerts/OrderAlertTicket.tsx`)
   under the kind picker, with form fields.
4. Add a branch in `buildTrigger` in the same file.
5. Add a branch in `describeTrigger` in `lib/utils/alerts.ts`.
6. (Optional) wire mock fire logic in a future `lib/services/triggerEngine.ts`.

## Adding a new route

1. Create `app/<segment>/page.tsx` returning a thin component from
   `components/views/<Name>.tsx`.
2. Add the entry to `NAV` in `components/shell/Header.tsx` and to the
   command palette page list in `components/shell/CommandPalette.tsx`.
3. Add a Playwright assertion in `tests-e2e/smoke.spec.ts`.

## Testing

- Smoke: `npm run test:e2e` (Playwright config boots the dev server).
- Add a focused test alongside the smoke assertions for any new
  user-visible flow that requires multiple steps (e.g. create alert →
  test-fire → assert appears in Triggered tab).

## What not to do

- Don't introduce purple-gradient blobs, glassmorphism on data surfaces, or
  generic SaaS hero sections. This is a terminal, not a marketing page.
- Don't read JSON from the filesystem in client code — use static imports
  from `seed/*.json` so Next bundles them; the mock adapter already does
  this.
- Don't bypass the adapter layer to call `fetch` directly from a component.
- Don't introduce a fourth state-management library. Zustand + TanStack
  Query + IndexedDB cover the whole product.
