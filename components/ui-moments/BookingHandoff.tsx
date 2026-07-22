"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Phone, CalendarClock } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import type { BookingHandoffData } from "@/lib/types";

const ESTIMATE_KEY = "estimateData";

interface Props {
  data: BookingHandoffData;
}

export function BookingHandoff({ data }: Props) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const { summary } = data;
  const lines = summary.lines ?? [];

  function handleContinue() {
    if (leaving) return;
    setLeaving(true);
    try {
      if (data.order) {
        window.localStorage.setItem(ESTIMATE_KEY, JSON.stringify(data.order));
      }
    } catch {
      // If storage is unavailable, the payment page shows its empty state.
    }
    router.push(data.booking_url || "/estimate/payment");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-primary px-5 py-3">
        <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
          Review & book
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        {/* appointment */}
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="font-medium">{summary.slot}</span>
        </div>

        {/* itemized services */}
        <div>
          <h4 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            Your services
          </h4>
          {lines.length > 0 ? (
            <ul className="space-y-2 text-[15px]">
              {lines.map((line, i) => {
                const isDiscount = line.amount < 0;
                return (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start justify-between gap-4",
                      isDiscount ? "pl-3 text-emerald-600" : "text-foreground/90",
                    )}
                  >
                    <span className="leading-snug">{line.label}</span>
                    <span className="shrink-0 font-mono tabular-nums">
                      {formatUSD(line.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[15px] text-foreground/90">{summary.services}</p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Subtotal
            </span>
            <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
              {formatUSD(summary.total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.note ? `${summary.note} · ` : ""}Plus 8.25% tax at checkout.
          </p>
        </div>

        {/* continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={leaving}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Continue to secure checkout
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure checkout
          </span>
          <a
            href="tel:+16156322980"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            (615) 632-2980
          </a>
        </div>
      </div>
    </div>
  );
}
