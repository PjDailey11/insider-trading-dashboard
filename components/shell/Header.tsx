"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  LayoutDashboard,
  ListChecks,
  PieChart,
  Search,
  Users,
  Filter,
  Settings,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import { isLive } from "@/lib/config/dataSource";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Activity;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlists", label: "Watchlists", icon: ListChecks },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/politicians", label: "Politicians", icon: Users },
  { href: "/screener", label: "Screener", icon: Filter },
];

export function Header() {
  const pathname = usePathname();
  const toggleLeft = useLayoutStore((s) => s.toggleLeftRail);
  const toggleRight = useLayoutStore((s) => s.toggleRightRail);
  const open = useCommandPalette((s) => s.open);
  const live = isLive();
  const nav = NAV.map((item) =>
    item.href === "/politicians" && live
      ? { ...item, label: "Insiders" }
      : item,
  );

  return (
    <header className="flex h-header shrink-0 items-center gap-3 border-b border-border bg-bg px-3">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent text-accent-fg">
          <Activity className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <span className="font-mono text-sm font-semibold tracking-tight text-text">
          Tickertape
        </span>
        <span className="rounded-sm border border-border px-1 text-2xs uppercase tracking-wider text-text-subtle">
          v1
        </span>
      </Link>

      <nav className="ml-2 flex items-center gap-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors",
                active
                  ? "bg-bg-overlay text-text"
                  : "text-text-muted hover:bg-bg-raised hover:text-text",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => open()}
          className={cn(
            "flex h-7 w-64 items-center gap-2 rounded border border-border bg-bg-sunken px-2.5 text-xs text-text-subtle",
            "hover:border-border-strong hover:bg-bg-overlay transition-colors",
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search symbols, politicians, alerts…</span>
          <kbd className="ml-auto rounded-sm border border-border bg-bg px-1 font-mono text-2xs text-text-subtle">
            ⌘K
          </kbd>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleLeft} aria-label="Toggle left rail">
              <PanelLeft className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle left rail</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleRight} aria-label="Toggle right rail">
              <PanelRight className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle right rail</TooltipContent>
        </Tooltip>

        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
