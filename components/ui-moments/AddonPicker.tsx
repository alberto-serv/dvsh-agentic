"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import type { AddonPickerData, AddonOption } from "@/lib/types";

interface Props {
  data: AddonPickerData;
  onSelect: (label: string) => void;
  disabled?: boolean;
}

export function AddonPicker({ data, onSelect, disabled }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const locked = disabled || submitted;

  function toggle(key: string) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function priceText(o: AddonOption): string {
    return o.price_label ?? formatUSD(o.price);
  }

  function handleAdd() {
    if (locked) return;
    const chosen = data.options.filter((o) => selected.has(o.key));
    setSubmitted(true);
    if (chosen.length === 0) {
      onSelect("No upgrades for me, thanks.");
      return;
    }
    const list = chosen.map((o) => `${o.name} (${priceText(o)})`).join(", ");
    onSelect(`Please add these upgrades: ${list}.`);
  }

  function handleSkip() {
    if (locked) return;
    setSubmitted(true);
    onSelect("No upgrades for me, thanks.");
  }

  const count = selected.size;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-5 py-4">
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {data.prompt ?? "Add any upgrades?"}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Optional — tap any to add, or skip.
        </p>
      </header>

      <ul className="divide-y divide-border">
        {data.options.map((option) => {
          const isOn = selected.has(option.key);
          return (
            <li key={option.key}>
              <button
                type="button"
                disabled={locked}
                onClick={() => toggle(option.key)}
                className={cn(
                  "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors",
                  isOn ? "bg-primary/[0.04]" : "hover:bg-muted/60",
                  locked && "cursor-not-allowed opacity-60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    isOn ? "border-primary bg-primary" : "border-border bg-background",
                  )}
                >
                  {isOn && (
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-heading text-[15px] font-semibold text-foreground">
                      {option.name}
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-foreground/80">
                      {priceText(option)}
                    </span>
                  </div>
                  {option.description && (
                    <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
        <button
          type="button"
          disabled={locked}
          onClick={handleAdd}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition",
            "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Plus className="h-4 w-4" />
          {count > 0 ? `Add ${count} upgrade${count > 1 ? "s" : ""}` : "Continue"}
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={handleSkip}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
