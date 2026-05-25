"use client";

import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import { clearAll, SCHEMA_VERSION } from "@/lib/persistence/idb";
import { Download, Upload, RefreshCw, Trash2 } from "lucide-react";

export function SettingsView() {
  const savedLayouts = useLayoutStore((s) => s.savedLayouts);
  const exportLayouts = useLayoutStore((s) => s.exportLayouts);
  const importLayouts = useLayoutStore((s) => s.importLayouts);
  const deleteLayout = useLayoutStore((s) => s.deleteLayout);
  const [importJson, setImportJson] = useState("");

  return (
    <main className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
        <Panel
          title={<span className="font-medium text-text">General</span>}
          density="compact"
          bodyClassName="p-4 flex flex-col gap-3"
        >
          <SettingRow label="Theme" hint="Dark-first design; light mode is minimal & opt-in via CSS class.">
            <Badge variant="muted">Dark</Badge>
          </SettingRow>
          <SettingRow label="Data source" hint="Swap-in adapter target. Set NEXT_PUBLIC_DATA_SOURCE.">
            <Badge variant="accent">{process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock"}</Badge>
          </SettingRow>
          <SettingRow label="Reduced motion" hint="Honors OS-level prefers-reduced-motion automatically.">
            <Switch defaultChecked disabled />
          </SettingRow>
        </Panel>

        <Panel
          title={<span className="font-medium text-text">Saved layouts</span>}
          density="compact"
          bodyClassName="p-3 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const json = exportLayouts();
                navigator.clipboard.writeText(json).then(
                  () => toast.success("Layout JSON copied to clipboard"),
                  () => toast.error("Could not copy to clipboard"),
                );
              }}
            >
              <Download className="h-3 w-3" /> Export to clipboard
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded border border-border-muted bg-bg-sunken p-2">
            <Label htmlFor="import-json">Import JSON</Label>
            <textarea
              id="import-json"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={4}
              className="w-full resize-none rounded border border-border bg-bg px-2.5 py-1.5 font-mono text-2xs text-text"
              placeholder='[{ "id": "...", "name": "...", "layout": {} }]'
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                try {
                  importLayouts(importJson);
                  toast.success("Layouts imported");
                } catch (err) {
                  toast.error("Import failed", { description: String((err as Error).message) });
                }
              }}
            >
              <Upload className="h-3 w-3" /> Import
            </Button>
          </div>

          <ul className="flex flex-col gap-1">
            {savedLayouts.map((l) => (
              <li
                key={l.id}
                className="group flex items-center gap-2 rounded border border-border-muted bg-bg-sunken px-2.5 py-1.5"
              >
                <span className="flex-1 text-xs text-text">{l.name}</span>
                <span className="text-2xs text-text-subtle">{l.id}</span>
                <button
                  onClick={() => deleteLayout(l.id)}
                  className="rounded p-0.5 text-text-subtle opacity-0 hover:text-loss group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
        <Panel
          title={<span className="font-medium text-text">Persistence</span>}
          density="compact"
          bodyClassName="p-3 flex flex-col gap-2"
        >
          <div className="text-2xs text-text-muted">
            All preferences, watchlists, alerts, positions, and notes live in
            IndexedDB (via <code className="font-mono">idb-keyval</code>). localStorage is intentionally not used.
          </div>
          <div className="flex items-center justify-between rounded border border-border-muted bg-bg-sunken px-2.5 py-2">
            <span className="text-2xs text-text-muted">Schema version</span>
            <Badge variant="muted">v{SCHEMA_VERSION}</Badge>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (typeof window === "undefined") return;
              if (!window.confirm("Clear all persisted data? You will lose watchlists, alerts, positions, and notes.")) return;
              await clearAll();
              toast.success("All persisted data cleared. Reloading…");
              setTimeout(() => window.location.reload(), 700);
            }}
          >
            <Trash2 className="h-3 w-3" /> Clear all data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3" /> Reload app
          </Button>
        </Panel>

        <Panel
          title={<span className="font-medium text-text">About</span>}
          density="compact"
          bodyClassName="p-3"
        >
          <p className="text-2xs text-text-muted">
            Tickertape v1. Built with Next.js 16, TypeScript strict, Tailwind,
            shadcn primitives, TanStack Table + Query, lightweight-charts,
            Recharts, react-resizable-panels, tinykeys, idb-keyval, Zustand.
          </p>
        </Panel>
      </div>
    </main>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-border-muted bg-bg-sunken px-2.5 py-2">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-text">{label}</span>
        {hint ? <span className="text-2xs text-text-subtle">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
