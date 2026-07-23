"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CheckoutOrder, SlotPickerData } from "@/lib/types";

interface Props {
  data: SlotPickerData;
  onSelect: (
    update: Partial<CheckoutOrder["customer"]>,
    humanLabel: string,
  ) => void;
  disabled?: boolean;
}

export function SlotPicker({ data, onSelect, disabled }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handlePick(slot: SlotPickerData["slots"][number]) {
    if (disabled || selectedId) return;
    setSelectedId(slot.id);
    const [, timePart] = slot.label.split(" · ");
    onSelect(
      { preferredDate: slot.start, timeWindow: timePart ?? slot.label },
      slot.label,
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Pick a time
        </h3>
        <span className="text-xs text-muted-foreground">America/Chicago</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {data.slots.map((slot) => {
          const isSelected = selectedId === slot.id;
          const [dayPart, timePart] = slot.label.split(" · ");
          return (
            <button
              key={slot.id}
              type="button"
              disabled={disabled || selectedId !== null}
              onClick={() => handlePick(slot)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-lg border px-4 py-3.5 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/[0.03]",
                (disabled || (selectedId && !isSelected)) &&
                  "cursor-not-allowed opacity-60",
              )}
            >
              <span className="font-heading text-[15px] font-semibold">
                {dayPart}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isSelected
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {timePart}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
