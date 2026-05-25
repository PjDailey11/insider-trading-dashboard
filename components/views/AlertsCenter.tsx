"use client";

import { useState } from "react";
import { Bell, Plus, BellOff, Archive, PlayCircle, Trash2 } from "lucide-react";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import { Panel } from "@/components/Panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { OrderAlertTicket } from "@/components/alerts/OrderAlertTicket";
import { formatDistanceToNowStrict } from "date-fns";
import { describeTrigger } from "@/lib/utils/alerts";
import type { Alert, AlertStatus } from "@/lib/types";

export function AlertsCenter() {
  const [ticketOpen, setTicketOpen] = useState(false);
  const items = useAlertsStore((s) => s.items);

  const grouped: Record<AlertStatus, Alert[]> = {
    active: items.filter((a) => a.status === "active"),
    triggered: items.filter((a) => a.status === "triggered"),
    snoozed: items.filter((a) => a.status === "snoozed"),
    archived: items.filter((a) => a.status === "archived"),
  };

  return (
    <main className="flex h-full flex-col p-3">
      <Panel
        title={<span className="font-medium text-text">Alerts</span>}
        actions={
          <Button variant="default" size="sm" onClick={() => setTicketOpen(true)}>
            <Plus className="h-3 w-3" /> New alert
          </Button>
        }
        className="flex-1 min-h-0"
        bodyClassName="p-0 flex-1 min-h-0"
        density="compact"
      >
        <Tabs defaultValue="active" className="flex h-full flex-col">
          <TabsList className="border-b border-border px-2">
            <TabsTrigger value="active">
              Active <span className="ml-1 text-2xs text-text-subtle">{grouped.active.length}</span>
            </TabsTrigger>
            <TabsTrigger value="triggered">
              Triggered <span className="ml-1 text-2xs text-text-subtle">{grouped.triggered.length}</span>
            </TabsTrigger>
            <TabsTrigger value="snoozed">
              Snoozed <span className="ml-1 text-2xs text-text-subtle">{grouped.snoozed.length}</span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived <span className="ml-1 text-2xs text-text-subtle">{grouped.archived.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="min-h-0 flex-1 overflow-auto">
            <AlertList items={grouped.active} />
          </TabsContent>
          <TabsContent value="triggered" className="min-h-0 flex-1 overflow-auto">
            <AlertList items={grouped.triggered} />
          </TabsContent>
          <TabsContent value="snoozed" className="min-h-0 flex-1 overflow-auto">
            <AlertList items={grouped.snoozed} />
          </TabsContent>
          <TabsContent value="archived" className="min-h-0 flex-1 overflow-auto">
            <AlertList items={grouped.archived} />
          </TabsContent>
        </Tabs>
      </Panel>

      <OrderAlertTicket open={ticketOpen} onOpenChange={setTicketOpen} />
    </main>
  );
}

function AlertList({ items }: { items: Alert[] }) {
  const setStatus = useAlertsStore((s) => s.setStatus);
  const snooze = useAlertsStore((s) => s.snooze);
  const remove = useAlertsStore((s) => s.remove);
  const fire = useAlertsStore((s) => s.fire);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-5 w-5" />}
        title="No alerts in this view"
        description="New alerts will appear here. Use the New alert button to create one."
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <li
          key={a.id}
          className="group flex items-start gap-3 border-b border-border-muted px-3 py-2.5"
        >
          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-text">{a.name}</span>
              <Badge variant={statusVariant(a.status)} className="px-1 py-0">
                {a.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-2xs text-text-muted">
              {describeTrigger(a.trigger)}
            </p>
            {a.events[0] ? (
              <p className="mt-1 rounded border border-border-muted bg-bg-sunken px-2 py-1 text-2xs text-text-muted">
                last fired {formatDistanceToNowStrict(a.events[0].ts, { addSuffix: true })} —{" "}
                {a.events[0].message}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                fire(a.id, {
                  ts: Date.now(),
                  message: `Test fire: ${a.name}`,
                })
              }
            >
              <PlayCircle className="h-3 w-3" /> Test
            </Button>
            <Button variant="ghost" size="sm" onClick={() => snooze(a.id, Date.now() + 86400000)}>
              <BellOff className="h-3 w-3" /> 1d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatus(a.id, a.status === "archived" ? "active" : "archived")}
            >
              <Archive className="h-3 w-3" />
              {a.status === "archived" ? "Restore" : "Archive"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
              <Trash2 className="h-3 w-3 text-loss" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function statusVariant(s: AlertStatus): "gain" | "warn" | "muted" | "info" {
  if (s === "active") return "gain";
  if (s === "triggered") return "warn";
  if (s === "snoozed") return "info";
  return "muted";
}
