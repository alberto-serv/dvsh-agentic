"use client";

import { useState } from "react";
import { Check, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRecurringEligible } from "@/lib/service-frequency";
import type {
  CheckoutOrder,
  RecurrencePickerData,
  RecurrenceOption,
} from "@/lib/types";

interface Props {
  data: RecurrencePickerData;
  order: CheckoutOrder["services"];
  onSelect: (
    update: Partial<CheckoutOrder["services"]>,
    humanLabel: string,
  ) => void;
  disabled?: boolean;
}

export function RecurrencePicker({ data, order, onSelect, disabled }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  function handlePick(option: RecurrenceOption) {
    if (disabled) return;
    setSelectedKey(option.key);

    const isAnnual = option.discount_percent > 0;
    const freq: "annual" | "none" = isAnnual ? "annual" : "none";
    const eligibleIds = (order.selectedServices ?? []).filter(isRecurringEligible);
    const serviceFrequencies: Record<string, "annual" | "none"> = {
      ...order.serviceFrequencies,
    };
    for (const id of eligibleIds) serviceFrequencies[id] = freq;

    const humanLabel = isAnnual
      ? `Annual plan · ${option.discount_percent}% off`
      : "One-time";
    onSelect({ serviceFrequencies }, humanLabel);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <RotateCw className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          Schedule frequency
        </h3>
      </header>

      {data.eligible_services && data.eligible_services.length > 0 && (
        <p className="border-b border-border bg-surface px-5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Recurring discounts apply to{" "}
          <span className="font-medium text-foreground">
            {data.eligible_services.join(", ")}
          </span>
          .
        </p>
      )}

      <ul className="divide-y divide-border">
        {data.options.map((option) => {
          const isActive = selectedKey === option.key;
          return (
            <li key={option.key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handlePick(option)}
                className={cn(
                  "group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors",
                  isActive ? "bg-primary/[0.04]" : "hover:bg-muted/60",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive
                      ? "border-primary bg-primary"
                      : "border-border bg-background",
                  )}
                >
                  {isActive && (
                    <Check
                      className="h-3 w-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-[15px] font-semibold text-foreground">
                      {option.label}
                    </span>
                    {option.discount_percent > 0 && (
                      <span className="inline-block bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums tracking-wider text-emerald-600">
                        SAVE {option.discount_percent}%
                      </span>
                    )}
                    {option.most_popular && (
                      <span className="inline-block bg-primary/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase leading-tight tracking-wider text-primary">
                        Most Popular
                      </span>
                    )}
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
    </div>
  );
}
