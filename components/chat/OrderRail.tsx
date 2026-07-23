"use client";

import { useState } from "react";
import { CalendarClock, ChevronUp, Receipt, X } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import {
  computeOrderPricing,
  getServiceBasePrice,
  SERVICE_CATALOG,
  type OrderPricingLine,
} from "@/lib/pricing";
import type { CheckoutOrder } from "@/lib/types";

type OrderServices = CheckoutOrder["services"];
type Customer = CheckoutOrder["customer"];

interface RailProps {
  order: OrderServices;
  customer: Customer;
  onSelection: (update: Partial<OrderServices>, humanLabel: string) => void;
  disabled?: boolean;
}

function formatAppointment(
  customer: Customer,
  short: boolean,
): string | null {
  if (!customer?.preferredDate) return null;
  const date = new Date(customer.preferredDate);
  if (Number.isNaN(date.getTime())) {
    return customer.timeWindow ?? null;
  }
  const day = date.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: short ? "short" : "long",
    ...(short ? {} : { month: "short", day: "numeric" }),
  });
  return customer.timeWindow ? `${day} ${customer.timeWindow}` : day;
}

function removalUpdate(
  order: OrderServices,
  line: OrderPricingLine,
): Partial<OrderServices> {
  if (line.serviceId) {
    const selectedServices = (order.selectedServices ?? []).filter(
      (id) => id !== line.serviceId,
    );
    const serviceFrequencies = { ...order.serviceFrequencies };
    delete serviceFrequencies[line.serviceId];
    return { selectedServices, serviceFrequencies };
  }
  const selectedCheckoutAddOns = (order.selectedCheckoutAddOns ?? []).filter(
    (id) => id !== line.addonId,
  );
  return { selectedCheckoutAddOns };
}

// Shared breakdown body used by both the desktop rail and the mobile sheet.
function RailBody({ order, customer, onSelection, disabled }: RailProps) {
  const pricing = computeOrderPricing(order);
  const serviceLines = pricing.lines.filter((l) => l.serviceId);
  const hasServices = serviceLines.length > 0;
  const subtotal = pricing.discountedSubtotal + pricing.addonsTotal;
  const appointment = formatAppointment(customer, false);

  if (!hasServices) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Your estimate builds here as we talk.
      </p>
    );
  }

  function remove(line: OrderPricingLine) {
    if (disabled) return;
    onSelection(removalUpdate(order, line), `Removed ${line.label}`);
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5 text-sm">
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
              className="group flex items-start justify-between gap-2 text-foreground/90"
            >
              <span className="flex min-w-0 items-start gap-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(line)}
                  aria-label={`Remove ${line.label}`}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition",
                    "hover:bg-red-500/10 hover:text-red-600",
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/60",
                  )}
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
                <span className="min-w-0 leading-snug">
                  {line.label}
                  {line.frequency === "annual" && (
                    <span className="ml-1 text-[10px] font-medium text-primary">
                      (Annual)
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {priceLabel ?? formatUSD(amount)}
              </span>
            </li>
          );
        })}
      </ul>

      {pricing.subscriptionDiscount > 0 && (
        <div className="flex items-center justify-between text-sm text-emerald-600">
          <span>Annual plan (15% off)</span>
          <span className="font-mono tabular-nums">
            −{formatUSD(pricing.subscriptionDiscount)}
          </span>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            Subtotal
          </span>
          <span className="font-heading text-lg font-semibold tabular-nums text-foreground">
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
      </div>

      {appointment && (
        <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-foreground">
          <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">{appointment}</span>
        </div>
      )}
    </div>
  );
}

// Desktop: sticky right rail.
export function OrderRail({ order, customer, onSelection, disabled }: RailProps) {
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-border bg-surface/40 lg:block">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            Your estimate
          </h2>
        </div>
        <RailBody
          order={order}
          customer={customer}
          onSelection={onSelection}
          disabled={disabled}
        />
      </div>
    </aside>
  );
}

// Mobile: collapsed bar above the composer that expands into a bottom sheet.
export function OrderRailBar({
  order,
  customer,
  onSelection,
  disabled,
}: RailProps) {
  const [open, setOpen] = useState(false);
  const pricing = computeOrderPricing(order);
  const serviceCount = pricing.lines.filter((l) => l.serviceId).length;
  const subtotal = pricing.discountedSubtotal + pricing.addonsTotal;
  const appointment = formatAppointment(customer, true);

  const summary =
    serviceCount === 0
      ? "Your estimate builds here"
      : [
          `${serviceCount} service${serviceCount > 1 ? "s" : ""}`,
          formatUSD(subtotal),
          appointment,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="border-t border-border bg-surface lg:hidden">
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: open ? "70vh" : "0px" }}
      >
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          <RailBody
            order={order}
            customer={customer}
            onSelection={onSelection}
            disabled={disabled}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Receipt className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">
            {summary}
          </span>
        </span>
        <ChevronUp
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
    </div>
  );
}
