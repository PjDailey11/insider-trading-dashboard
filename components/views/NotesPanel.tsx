"use client";

import { useState } from "react";
import { useNotesStore } from "@/lib/stores/notesStore";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { Trash2 } from "lucide-react";

export interface NotesPanelProps {
  symbol: string;
}

export function NotesPanel({ symbol }: NotesPanelProps) {
  const items = useNotesStore((s) => s.items.filter((n) => n.symbol === symbol));
  const upsert = useNotesStore((s) => s.upsert);
  const remove = useNotesStore((s) => s.remove);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex flex-col gap-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Notes for ${symbol}…`}
          rows={3}
          className="w-full resize-none rounded border border-border bg-bg-sunken px-2.5 py-1.5 text-xs text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (!draft.trim()) return;
              upsert({ symbol, body: draft.trim() });
              setDraft("");
            }}
          >
            Add note
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-2xs text-text-subtle">No notes for this symbol yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li
              key={n.id}
              className="group rounded border border-border-muted bg-bg-sunken p-2.5"
            >
              <div className="flex items-start gap-2">
                <p className="flex-1 whitespace-pre-wrap text-xs text-text">{n.body}</p>
                <button
                  onClick={() => remove(n.id)}
                  className="rounded p-0.5 text-text-subtle opacity-0 hover:bg-bg-overlay hover:text-loss group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-1 text-2xs text-text-subtle">
                {formatDistanceToNowStrict(n.createdAt, { addSuffix: true })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
