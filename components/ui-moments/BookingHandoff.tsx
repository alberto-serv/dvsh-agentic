"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Phone, CalendarClock } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import {
  computeOrderPricing,
  getServiceBasePrice,
  SERVICE_CATALOG,
} from "@/lib/pricing";
import type { BookingHandoffData, CheckoutOrder } from "@/lib/types";

const ESTIMATE_KEY = "estimateData";

type OrderServices = CheckoutOrder["services"];
type Customer = CheckoutOrder["customer"];

interface Props {
  data: BookingHandoffData;
  order: OrderServices;
  customer: Customer;
}

function formatAppointment(customer: Customer): string | null {
  if (!customer?.preferredDate) return null;
  const date = new Date(customer.preferredDate);
  if (Number.isNaN(date.getTime())) return customer.timeWindow ?? null;
  const day = date.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return customer.timeWindow ? `${day} · ${customer.timeWindow}` : day;
}

function Shell({
  slot,
  children,
  onContinue,
  leaving,
}: {
  slot: string | null;
  children: React.ReactNode;
  onContinue: () => void;
  leaving: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-primary px-5 py-3">
        <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
          Review & book
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        {slot && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="font-medium">{slot}</span>
          </div>
        )}

        <div>
          <h4 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            Your services
          </h4>
          {children}
        </div>

        <button
          type="button"
          onClick={onContinue}
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

export function BookingHandoff({ data, order, customer }: Props) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  // Older saved chats carry the full order in the message; render those from
  // `data` and write the legacy blob through unchanged.
  const isLegacy = !!data.summary;

  function handleContinue(payload: CheckoutOrder | null, url?: string) {
    if (leaving) return;
    setLeaving(true);
    try {
      if (payload) {
        window.localStorage.setItem(ESTIMATE_KEY, JSON.stringify(payload));
      }
    } catch {
      // If storage is unavailable, the payment page shows its empty state.
    }
    router.push(url || "/estimate/payment");
  }

  if (isLegacy) {
    const summary = data.summary!;
    const lines = summary.lines ?? [];
    return (
      <Shell
        slot={summary.slot}
        leaving={leaving}
        onContinue={() => handleContinue(data.order ?? null, data.booking_url)}
      >
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
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
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
      </Shell>
    );
  }

  // Slim format: build the review straight from live client state.
  const pricing = computeOrderPricing(order);
  const subtotal = pricing.discountedSubtotal + pricing.addonsTotal;
  const slot = data.slot ?? formatAppointment(customer);

  return (
    <Shell
      slot={slot}
      leaving={leaving}
      onContinue={() => handleContinue({ services: order, customer })}
    >
      <ul className="space-y-2 text-[15px]">
        {pricing.lines.map((line, i) => {
          const priceLabel = line.addonId
            ? SERVICE_CATALOG.checkoutAddOns.find((a) => a.id === line.addonId)
                ?.priceLabel
            : undefined;
          const amount = line.serviceId
            ? getServiceBasePrice(order, line.serviceId)
            : line.amount;
          return (
            <li
              key={i}
              className="flex items-start justify-between gap-4 text-foreground/90"
            >
              <span className="leading-snug">
                {line.label}
                {line.frequency === "annual" && (
                  <span className="ml-1 text-[10px] font-medium text-primary">
                    (Annual)
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {priceLabel ?? formatUSD(amount)}
              </span>
            </li>
          );
        })}
        {pricing.subscriptionDiscount > 0 && (
          <li className="flex items-start justify-between gap-4 pl-3 text-emerald-600">
            <span className="leading-snug">Annual plan (15% off)</span>
            <span className="shrink-0 font-mono tabular-nums">
              −{formatUSD(pricing.subscriptionDiscount)}
            </span>
          </li>
        )}
      </ul>

      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
          Subtotal
        </span>
        <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
          {formatUSD(subtotal)}
        </span>
      </div>
      {pricing.notes.map((note, i) => (
        <p key={i} className="mt-1 text-xs text-muted-foreground">
          {note}
        </p>
      ))}
      <p className="mt-1 text-xs text-muted-foreground">
        Plus 8.25% tax at checkout.
      </p>
    </Shell>
  );
}
