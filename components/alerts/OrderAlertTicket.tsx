"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import type {
  AlertKind,
  AlertTrigger,
  AmountBucket,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const BUCKETS: AmountBucket[] = [
  "1k-15k","15k-50k","50k-100k","100k-250k","250k-500k","500k-1m","1m-5m","5m-25m","25m-50m","50m+",
];

const ALERT_KINDS: Array<{ id: AlertKind; label: string; hint: string }> = [
  { id: "priceCross", label: "Price cross", hint: "Above or below threshold" },
  { id: "percentMove", label: "Percent move", hint: "X% within window" },
  { id: "volumeSpike", label: "Volume spike", hint: "Multiple of avg volume" },
  { id: "rsiCross", label: "RSI cross", hint: "Above or below level" },
  { id: "newsKeyword", label: "News keyword", hint: "Headline matching" },
  { id: "politicianTrade", label: "Politician trade", hint: "Filed disclosure event" },
];

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    kind: z.string(),
    symbol: z.string().optional(),
    threshold: z.coerce.number().optional(),
    direction: z.enum(["above", "below"]).optional(),
    percent: z.coerce.number().optional(),
    window: z.enum(["1d", "1w", "1m"]).optional(),
    multiple: z.coerce.number().optional(),
    rsiLevel: z.coerce.number().optional(),
    keywords: z.string().optional(),
    politicianId: z.string().optional(),
    minAmount: z.string().optional(),
    side: z.enum(["buy", "sell", "any"]).optional(),
    note: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "priceCross") {
      if (!v.symbol)
        ctx.addIssue({ path: ["symbol"], code: z.ZodIssueCode.custom, message: "Required" });
      if (v.threshold === undefined || Number.isNaN(v.threshold))
        ctx.addIssue({ path: ["threshold"], code: z.ZodIssueCode.custom, message: "Required" });
    }
    if (v.kind === "percentMove" || v.kind === "volumeSpike" || v.kind === "rsiCross") {
      if (!v.symbol)
        ctx.addIssue({ path: ["symbol"], code: z.ZodIssueCode.custom, message: "Required" });
    }
    if (v.kind === "newsKeyword") {
      if (!v.keywords)
        ctx.addIssue({ path: ["keywords"], code: z.ZodIssueCode.custom, message: "Required" });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface OrderAlertTicketProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSymbol?: string;
}

export function OrderAlertTicket({
  open,
  onOpenChange,
  defaultSymbol,
}: OrderAlertTicketProps) {
  const create = useAlertsStore((s) => s.create);
  const [kind, setKind] = useState<AlertKind>("priceCross");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      kind: "priceCross",
      direction: "above",
      window: "1d",
      side: "any",
      symbol: defaultSymbol,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const result = formSchema.safeParse(values);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    const trigger = buildTrigger(kind, values);
    const alert = create({ name: values.name, trigger, note: values.note });
    toast.success(`Alert created: ${alert.name}`);
    reset();
    onOpenChange(false);
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent side="right" className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>New alert</DrawerTitle>
          <DrawerDescription>
            Configure trigger conditions. Test-fire from the Alerts list after creating.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alert-name">Name</Label>
            <Input
              id="alert-name"
              placeholder="e.g. NVDA breaks $150"
              {...register("name")}
            />
            {errors.name ? (
              <span className="text-2xs text-loss">{errors.name.message}</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Trigger kind</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALERT_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={
                    kind === k.id
                      ? "rounded border border-accent bg-accent-subtle p-2 text-left"
                      : "rounded border border-border bg-bg-sunken p-2 text-left hover:border-border-strong"
                  }
                >
                  <div className="text-xs font-medium text-text">{k.label}</div>
                  <div className="text-2xs text-text-subtle">{k.hint}</div>
                </button>
              ))}
            </div>
            <input type="hidden" {...register("kind")} value={kind} />
          </div>

          {kind === "priceCross" ? (
            <>
              <SymbolField register={register} error={errors.symbol?.message} />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="threshold">Threshold ($)</Label>
                  <Input id="threshold" type="number" step="0.01" {...register("threshold")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Direction</Label>
                  <Select defaultValue="above" onValueChange={(v) => register("direction").onChange({ target: { value: v, name: "direction" } } as never)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {kind === "percentMove" ? (
            <>
              <SymbolField register={register} error={errors.symbol?.message} />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="percent">Percent (%)</Label>
                  <Input id="percent" type="number" step="0.1" {...register("percent")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Window</Label>
                  <Select defaultValue="1d" onValueChange={(v) => register("window").onChange({ target: { value: v, name: "window" } } as never)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1 day</SelectItem>
                      <SelectItem value="1w">1 week</SelectItem>
                      <SelectItem value="1m">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {kind === "volumeSpike" ? (
            <>
              <SymbolField register={register} error={errors.symbol?.message} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="multiple">Multiple of avg vol</Label>
                <Input id="multiple" type="number" step="0.1" defaultValue={2} {...register("multiple")} />
              </div>
            </>
          ) : null}

          {kind === "rsiCross" ? (
            <>
              <SymbolField register={register} error={errors.symbol?.message} />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rsiLevel">RSI level</Label>
                  <Input id="rsiLevel" type="number" step="1" defaultValue={70} {...register("rsiLevel")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Direction</Label>
                  <Select defaultValue="above" onValueChange={(v) => register("direction").onChange({ target: { value: v, name: "direction" } } as never)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {kind === "newsKeyword" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="symbol">Symbol (optional)</Label>
                <Input id="symbol" placeholder="AAPL" {...register("symbol")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" placeholder="earnings, guidance, downgrade" {...register("keywords")} />
                {errors.keywords ? (
                  <span className="text-2xs text-loss">{errors.keywords.message}</span>
                ) : null}
              </div>
            </>
          ) : null}

          {kind === "politicianTrade" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="symbol">Symbol (optional)</Label>
                  <Input id="symbol" placeholder="any" {...register("symbol")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Side</Label>
                  <Select
                    defaultValue="any"
                    onValueChange={(v) => register("side").onChange({ target: { value: v, name: "side" } } as never)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Min amount bucket</Label>
                <Select
                  defaultValue="50k-100k"
                  onValueChange={(v) =>
                    register("minAmount").onChange({ target: { value: v, name: "minAmount" } } as never)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUCKETS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="info" className="self-start">
                politicianTrade alerts evaluate against the Capitol-style PTR feed
              </Badge>
            </>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <textarea
              id="note"
              rows={2}
              className="w-full resize-none rounded border border-border bg-bg-sunken px-2.5 py-1.5 text-xs text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              {...register("note")}
            />
          </div>

          <DrawerFooter className="-mx-4 -mb-4 mt-auto border-t-0">
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" type="button">
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" variant="default" size="sm">
              Create alert
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function SymbolField({
  register,
  error,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="symbol">Symbol</Label>
      <Input id="symbol" placeholder="AAPL" {...register("symbol")} className="font-mono uppercase" />
      {error ? <span className="text-2xs text-loss">{error}</span> : null}
    </div>
  );
}

function buildTrigger(kind: AlertKind, v: FormValues): AlertTrigger {
  switch (kind) {
    case "priceCross":
      return {
        kind: "priceCross",
        symbol: (v.symbol ?? "").toUpperCase(),
        threshold: Number(v.threshold ?? 0),
        direction: v.direction ?? "above",
      };
    case "percentMove":
      return {
        kind: "percentMove",
        symbol: (v.symbol ?? "").toUpperCase(),
        percent: Number(v.percent ?? 0),
        window: v.window ?? "1d",
      };
    case "volumeSpike":
      return {
        kind: "volumeSpike",
        symbol: (v.symbol ?? "").toUpperCase(),
        multiple: Number(v.multiple ?? 2),
      };
    case "rsiCross":
      return {
        kind: "rsiCross",
        symbol: (v.symbol ?? "").toUpperCase(),
        level: Number(v.rsiLevel ?? 70),
        direction: v.direction ?? "above",
      };
    case "newsKeyword":
      return {
        kind: "newsKeyword",
        symbol: v.symbol ? v.symbol.toUpperCase() : undefined,
        keywords: (v.keywords ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    case "politicianTrade":
      return {
        kind: "politicianTrade",
        symbol: v.symbol ? v.symbol.toUpperCase() : undefined,
        side: v.side ?? "any",
        minAmount: (v.minAmount as AmountBucket | undefined) ?? "50k-100k",
      };
  }
}
