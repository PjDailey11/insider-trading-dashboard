"use client";

import Link from "next/link";
import { Plus, ListChecks } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNowStrict } from "date-fns";

export function WatchlistsIndex() {
  const router = useRouter();
  const items = useWatchlistsStore((s) => s.items);
  const create = useWatchlistsStore((s) => s.create);
  const remove = useWatchlistsStore((s) => s.remove);
  const [draft, setDraft] = useState("");

  return (
    <main className="p-3">
      <Panel
        title={<span className="font-medium text-text">Watchlists</span>}
        actions={<span className="text-2xs text-text-subtle">{items.length} lists</span>}
        density="comfortable"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            const wl = create(draft.trim(), []);
            setDraft("");
            router.push(`/watchlists/${wl.id}`);
          }}
          className="mb-4 flex items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New watchlist name…"
            className="max-w-xs"
          />
          <Button type="submit" variant="default" size="sm">
            <Plus className="h-3 w-3" />
            Create
          </Button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <div
              key={w.id}
              className="group flex flex-col gap-2 rounded border border-border bg-bg-sunken p-3 hover:border-border-strong"
            >
              <Link href={`/watchlists/${w.id}`} className="flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5 text-text-subtle" />
                <span className="font-medium text-text group-hover:text-accent">{w.name}</span>
                <span className="ml-auto rounded-sm bg-bg-overlay px-1.5 py-0.5 font-mono text-2xs text-text-subtle">
                  {w.symbols.length}
                </span>
              </Link>
              <div className="flex flex-wrap gap-1">
                {w.symbols.slice(0, 8).map((s) => (
                  <Link
                    key={`${w.id}-${s}`}
                    href={`/s/${s}`}
                    className="rounded-sm border border-border-muted bg-bg-overlay px-1.5 py-0.5 font-mono text-2xs text-text-muted hover:text-accent"
                  >
                    {s}
                  </Link>
                ))}
                {w.symbols.length > 8 ? (
                  <span className="px-1.5 py-0.5 text-2xs text-text-subtle">
                    +{w.symbols.length - 8}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between text-2xs text-text-subtle">
                <span>updated {formatDistanceToNowStrict(w.updatedAt, { addSuffix: true })}</span>
                <button
                  onClick={() => remove(w.id)}
                  className="text-text-subtle opacity-0 transition-opacity hover:text-loss group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
