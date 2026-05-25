"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { usePositionsStore } from "@/lib/stores/positionsStore";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  quantity: z.coerce.number().positive("Quantity > 0"),
  avgCost: z.coerce.number().positive("Cost > 0"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface AddPositionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPositionDrawer({ open, onOpenChange }: AddPositionDrawerProps) {
  const add = usePositionsStore((s) => s.add);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    add({
      symbol: result.data.symbol.toUpperCase(),
      quantity: result.data.quantity,
      avgCost: result.data.avgCost,
      note: result.data.note,
    });
    toast.success(`Added ${result.data.symbol.toUpperCase()}`);
    reset();
    onOpenChange(false);
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent side="right" className="max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Add position</DrawerTitle>
          <DrawerDescription>
            Manual entry — P/L is computed against live (mock) quotes.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3 overflow-auto p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="symbol">Symbol</Label>
            <Input id="symbol" className="font-mono uppercase" {...register("symbol")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="0.01" {...register("quantity")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="avgCost">Avg cost ($)</Label>
              <Input id="avgCost" type="number" step="0.01" {...register("avgCost")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <textarea
              id="note"
              rows={2}
              className="w-full resize-none rounded border border-border bg-bg-sunken px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
              {...register("note")}
            />
          </div>
          <DrawerFooter className="-mx-4 -mb-4 mt-auto">
            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" variant="default" size="sm">
              Add position
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
