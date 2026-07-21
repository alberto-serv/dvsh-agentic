"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import type { TierPickerData, TierOption } from "@/lib/types";

interface Props {
  data: TierPickerData;
  onSelect: (label: string) => void;
  disabled?: boolean;
}

export function TierPicker({ data, onSelect, disabled }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const isIncremental = hasOverlappingIncludes(data.options);

  function handlePick(option: TierOption) {
    if (disabled || selectedKey) return;
    setSelectedKey(option.key);
    const choice = data.units
      ? `Let's go with ${option.label} — ${data.units}.`
      : `Let's go with ${option.label}.`;
    onSelect(choice);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-baseline justify-between border-b border-border px-5 py-4">
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {data.service}
        </h3>
        {data.units && (
          <span className="text-sm text-muted-foreground">{data.units}</span>
        )}
      </header>

      <div className="px-5 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Choose a service level
        </span>
      </div>

      <ul className="m-5 mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
        {data.options.map((option, idx) => {
          const isActive = selectedKey === option.key;
          const prevIncludes =
            idx > 0 ? data.options[idx - 1].includes ?? [] : [];
          const newAddOns = isIncremental
            ? (option.includes ?? []).filter((f) => !prevIncludes.includes(f))
            : option.includes ?? [];
          const includesLabel =
            isIncremental && idx > 0
              ? `Everything in ${data.options[idx - 1].label}, plus`
              : "Includes";

          return (
            <li key={option.key}>
              <button
                type="button"
                disabled={disabled || selectedKey !== null}
                onClick={() => handlePick(option)}
                className={cn(
                  "group w-full text-left transition-colors",
                  isActive
                    ? "bg-primary/[0.04]"
                    : "bg-background hover:bg-muted/60",
                  (disabled || (selectedKey && !isActive)) &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                <div className="grid grid-cols-[20px_1fr] items-start gap-3 px-4 py-4 sm:grid-cols-[20px_minmax(180px,220px)_1fr] sm:gap-5">
                  {/* radio */}
                  <div className="pt-0.5">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
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
                  </div>

                  {/* label / tagline / price */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-heading text-[15px] font-semibold text-foreground sm:text-base">
                        {option.label}
                      </span>
                      {option.most_popular && (
                        <span className="inline-block bg-[#00dbe6]/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase leading-tight tracking-wider text-[#0099a3]">
                          Most Popular
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                    <p className="mt-1.5 font-mono text-xs tabular-nums text-foreground/80">
                      {formatUSD(option.price_per_unit)}
                      <span className="text-muted-foreground"> / {option.unit}</span>
                    </p>
                  </div>

                  {/* features */}
                  {newAddOns.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {includesLabel}
                      </span>
                      <div className="space-y-1">
                        {newAddOns.map((feat, fi) => (
                          <div
                            key={fi}
                            className="flex items-start gap-1.5 text-[12px] leading-snug text-foreground/80 sm:text-[13px]"
                          >
                            {isIncremental && idx > 0 ? (
                              <Plus
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00dbe6]"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00dbe6]"
                                strokeWidth={2.5}
                              />
                            )}
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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

function hasOverlappingIncludes(options: TierOption[]): boolean {
  for (let i = 1; i < options.length; i++) {
    const prev = options[i - 1].includes ?? [];
    const curr = options[i].includes ?? [];
    if (prev.length === 0 || curr.length === 0) continue;
    if (prev.every((f) => curr.includes(f))) return true;
  }
  return false;
}
