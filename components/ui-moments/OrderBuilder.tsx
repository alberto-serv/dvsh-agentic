"use client";

import { useState } from "react";
import { Check, Minus, Plus, RotateCw } from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import {
  computeOrderPricing,
  getServiceBasePrice,
  getWholeHomeUpgrade,
  SERVICE_CATALOG,
} from "@/lib/pricing";
import { isRecurringEligible } from "@/lib/service-frequency";
import type {
  CheckoutOrder,
  OrderBuilderData,
  TierOption,
} from "@/lib/types";

type OrderServices = CheckoutOrder["services"];

interface Props {
  data: OrderBuilderData;
  order: OrderServices;
  onSelect: (update: Partial<OrderServices>, humanLabel: string) => void;
  // Mirrors in-progress configuration into global order state without messaging
  // the model — the single round trip happens on confirm.
  onOrderChange: (update: Partial<OrderServices>) => void;
  disabled?: boolean;
}

const MIN_DUCTS = 1;
const DEFAULT_DUCTS = 10;

// Bundled add-ons that are already part of the Dryer Vent Cleaning Special.
const SPECIAL_BUNDLED = new Set(["magnetic-vent-cover", "transition-hose"]);

function serviceName(serviceId: string): string {
  return (
    SERVICE_CATALOG.availableServices.find((s) => s.id === serviceId)?.name ??
    serviceId
  );
}

export function OrderBuilder({
  data,
  order,
  onSelect,
  onOrderChange,
  disabled,
}: Props) {
  const { service_id } = data;

  const hasAccess = !!data.access_options?.length;
  const hasDucts = !!data.needs_duct_count;
  const suggested = data.suggested_services ?? [];

  const specialInOrder =
    service_id === "dryer-vent-special" ||
    (order.selectedServices ?? []).includes("dryer-vent-special");
  const addonOptions = (data.addons ?? []).filter(
    (a) => !(specialInOrder && SPECIAL_BUNDLED.has(a.key)),
  );
  const hasAddons = addonOptions.length > 0;

  // Only preselect what the customer actually told us. If they haven't said,
  // nothing is ticked and the confirm button stays gated until they choose.
  const [access, setAccess] = useState<string | undefined>(() =>
    data.access_options?.some((o) => o.key === data.access_type)
      ? data.access_type
      : undefined,
  );
  const [ductCount, setDuctCount] = useState<number>(
    data.duct_count && data.duct_count >= MIN_DUCTS
      ? Math.round(data.duct_count)
      : DEFAULT_DUCTS,
  );
  const [addonKeys, setAddonKeys] = useState<Set<string>>(new Set());
  const [extraServices, setExtraServices] = useState<Set<string>>(new Set());
  const [annual, setAnnual] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Build the services partial from a snapshot of card state. Overrides let
  // event handlers pass their just-changed value without waiting for setState.
  function buildPartial(over?: {
    access?: string;
    ductCount?: number;
    addonKeys?: Set<string>;
    extraServices?: Set<string>;
    annual?: boolean;
  }): Partial<OrderServices> {
    const access_ = over?.access ?? access;
    const ducts_ = over?.ductCount ?? ductCount;
    const addons_ = over?.addonKeys ?? addonKeys;
    const extras_ = over?.extraServices ?? extraServices;
    const annual_ = over?.annual ?? annual;

    const base = order.selectedServices ?? [];
    const ids = new Set([
      ...base,
      service_id,
      ...(data.add_services ?? []),
    ]);
    // The card owns the suggested toggles, so unticking one removes it again.
    for (const s of suggested) {
      if (extras_.has(s)) ids.add(s);
      else ids.delete(s);
    }
    const selectedServices = Array.from(ids);

    const partial: Partial<OrderServices> = { selectedServices };

    if (hasAccess && access_) {
      if (service_id === "dryer-vent-duct-bundle")
        partial.bundleAccessType = access_;
      else if (service_id === "dryer-vent-special")
        partial.specialAccessType = access_;
      else partial.dryerVentAccessType = access_;
    }

    if (hasDucts) {
      if (service_id === "whole-home-air") partial.wholeHomeDuctCount = ducts_;
      else partial.ductCount = ducts_;
    }

    if (hasAddons) {
      partial.selectedCheckoutAddOns = Array.from(addons_);
    }

    const recurringIds = selectedServices.filter(isRecurringEligible);
    if (recurringIds.length > 0) {
      const freq: "annual" | "none" = annual_ ? "annual" : "none";
      const frequencies: Record<string, "annual" | "none"> = {
        ...order.serviceFrequencies,
      };
      // Drop frequencies for services no longer in the order.
      for (const id of Object.keys(frequencies)) {
        if (!selectedServices.includes(id)) delete frequencies[id];
      }
      for (const id of recurringIds) frequencies[id] = freq;
      partial.serviceFrequencies = frequencies;
    }

    return partial;
  }

  // Live pricing reflects the current draft immediately, no network call.
  const draftPartial = buildPartial();
  const draftOrder: OrderServices = { ...order, ...draftPartial };
  const pricing = computeOrderPricing(draftOrder);
  const configTotal = Math.round(pricing.discountedSubtotal + pricing.addonsTotal);
  // The annual plan applies once any recurring-eligible service is in the order
  // — including one the customer just ticked from the suggestions.
  const recurring = (draftPartial.selectedServices ?? []).some(
    isRecurringEligible,
  );
  const wholeHomeUpgrade = getWholeHomeUpgrade(draftOrder);

  function mirror(over?: Parameters<typeof buildPartial>[0]) {
    if (disabled) return;
    onOrderChange(buildPartial(over));
  }

  function pickAccess(key: string) {
    if (disabled) return;
    setAccess(key);
    mirror({ access: key });
  }

  function stepDucts(delta: number) {
    if (disabled) return;
    const next = Math.max(MIN_DUCTS, ductCount + delta);
    setDuctCount(next);
    mirror({ ductCount: next });
  }

  function setDucts(value: number) {
    if (disabled) return;
    const next = Number.isFinite(value) ? Math.max(MIN_DUCTS, Math.round(value)) : MIN_DUCTS;
    setDuctCount(next);
    mirror({ ductCount: next });
  }

  function toggleExtraService(id: string) {
    if (disabled) return;
    const next = new Set(extraServices);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExtraServices(next);
    mirror({ extraServices: next });
  }

  function toggleAddon(key: string) {
    if (disabled) return;
    const next = new Set(addonKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setAddonKeys(next);
    mirror({ addonKeys: next });
  }

  function toggleAnnual() {
    if (disabled) return;
    const next = !annual;
    setAnnual(next);
    mirror({ annual: next });
  }

  function handleConfirm() {
    if (disabled || confirmed) return;
    if (hasAccess && !access) return;
    setConfirmed(true);

    const bits: string[] = [];
    const accessOption = data.access_options?.find((o) => o.key === access);
    if (accessOption) bits.push(accessOption.label);
    for (const id of suggested) {
      if (extraServices.has(id)) bits.push(serviceName(id));
    }
    for (const opt of addonOptions) {
      if (addonKeys.has(opt.key)) bits.push(opt.name);
    }
    if (recurring && annual) bits.push("Annual plan");
    const headline = bits.length ? bits.join(" + ") : serviceName(service_id);

    onSelect(buildPartial(), `${headline} · $${configTotal}`);
  }

  const locked = disabled || confirmed;
  // Can't confirm an access-priced service until an access type is actually chosen.
  const needsAccess = hasAccess && !access;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-primary px-5 py-3">
        <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
          Build your order
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {serviceName(service_id)}
        </h3>

        {/* Access type */}
        {hasAccess && (
          <Section label="Access type">
            <div className="overflow-hidden rounded-lg border border-border">
              <ul className="divide-y divide-border">
                {data.access_options!.map((option: TierOption) => {
                  const isActive = access === option.key;
                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => pickAccess(option.key)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                          isActive ? "bg-primary/[0.04]" : "hover:bg-muted/60",
                          locked && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
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
                          </span>
                          <span className="font-heading text-[15px] font-semibold text-foreground">
                            {option.label}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-sm tabular-nums text-foreground/80">
                          {formatUSD(option.price_per_unit)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>
        )}

        {/* Duct count */}
        {hasDucts && (
          <Section label="How many ducts?">
            <div className="flex items-center gap-3">
              <StepButton
                aria-label="Fewer ducts"
                disabled={locked || ductCount <= MIN_DUCTS}
                onClick={() => stepDucts(-1)}
              >
                <Minus className="h-4 w-4" />
              </StepButton>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_DUCTS}
                value={ductCount}
                disabled={locked}
                onChange={(e) => setDucts(Number(e.target.value))}
                className="h-10 w-16 rounded-lg border border-border bg-background text-center font-mono text-base tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
              <StepButton
                aria-label="More ducts"
                disabled={locked}
                onClick={() => stepDucts(1)}
              >
                <Plus className="h-4 w-4" />
              </StepButton>
              <span className="text-xs text-muted-foreground">
                Most homes have 8–10.
              </span>
            </div>
          </Section>
        )}

        {/* Add-ons */}
        {hasAddons && (
          <Section label="Add-ons">
            <div className="overflow-hidden rounded-lg border border-border">
              <ul className="divide-y divide-border">
                {addonOptions.map((option) => {
                  const isOn = addonKeys.has(option.key);
                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => toggleAddon(option.key)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                          isOn ? "bg-primary/[0.04]" : "hover:bg-muted/60",
                          locked && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            isOn
                              ? "border-primary bg-primary"
                              : "border-border bg-background",
                          )}
                        >
                          {isOn && (
                            <Check
                              className="h-3 w-3 text-primary-foreground"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-heading text-[15px] font-semibold text-foreground">
                              {option.name}
                            </span>
                            <span className="shrink-0 font-mono text-sm tabular-nums text-foreground/80">
                              {option.price_label ?? formatUSD(option.price)}
                            </span>
                          </span>
                          {option.description && (
                            <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>
        )}

        {/* Complementary services the customer can add */}
        {suggested.length > 0 && (
          <Section label="Add more services">
            <div className="overflow-hidden rounded-lg border border-border">
              <ul className="divide-y divide-border">
                {suggested.map((id) => {
                  const isOn = extraServices.has(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => toggleExtraService(id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          isOn ? "bg-primary/[0.04]" : "hover:bg-muted/60",
                          locked && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            isOn
                              ? "border-primary bg-primary"
                              : "border-border bg-background",
                          )}
                        >
                          {isOn && (
                            <Check
                              className="h-3 w-3 text-primary-foreground"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                        <span className="flex-1 font-heading text-[15px] font-semibold text-foreground">
                          {serviceName(id)}
                        </span>
                        <span className="shrink-0 font-mono text-sm tabular-nums text-foreground/80">
                          {formatUSD(getServiceBasePrice(draftOrder, id))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>
        )}

        {/* Annual plan */}
        {recurring && (
          <button
            type="button"
            disabled={locked}
            onClick={toggleAnnual}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              annual
                ? "border-primary bg-primary/[0.04]"
                : "border-border hover:bg-muted/60",
              locked && "cursor-not-allowed opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                annual ? "border-primary bg-primary" : "border-border bg-background",
              )}
            >
              {annual && (
                <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
              )}
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-1.5 font-heading text-[15px] font-semibold text-foreground">
                <RotateCw className="h-3.5 w-3.5 text-primary" />
                Annual plan
                <span className="inline-block bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums tracking-wider text-emerald-600">
                  SAVE 15%
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                15% off every year, cancel anytime.
              </span>
            </span>
          </button>
        )}

        {/* Live footer */}
        <div className="border-t border-border pt-4">
          <ul className="space-y-2 text-[15px]">
            {pricing.lines.map((line, i) => {
              const priceLabel = line.addonId
                ? SERVICE_CATALOG.checkoutAddOns.find(
                    (a) => a.id === line.addonId,
                  )?.priceLabel
                : undefined;
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
                    {priceLabel ?? formatUSD(line.amount)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Subtotal
            </span>
            <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
              {formatUSD(pricing.discountedSubtotal + pricing.addonsTotal)}
            </span>
          </div>

          {pricing.subscriptionDiscount > 0 && (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              Annual plan — 15% off, save {formatUSD(pricing.subscriptionDiscount)}/yr
            </p>
          )}
          {wholeHomeUpgrade && (
            <p className="mt-2 rounded-md bg-primary/[0.06] px-2.5 py-2 text-xs leading-relaxed text-primary">
              These three are the <span className="font-semibold">Whole-Home Air Package</span> —
              bundled it&apos;s {formatUSD(wholeHomeUpgrade.packagePrice)}, saving{" "}
              {formatUSD(wholeHomeUpgrade.savings)}. Just ask and we&apos;ll switch it.
            </p>
          )}
          {pricing.notes.map((note, i) => (
            <p key={i} className="mt-1 text-xs text-muted-foreground">
              {note}
            </p>
          ))}
          <p className="mt-1 text-xs text-muted-foreground">
            Plus 8.25% tax at checkout.
          </p>
        </div>

        <button
          type="button"
          disabled={locked || needsAccess}
          onClick={handleConfirm}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {confirmed
            ? "Locked in"
            : needsAccess
              ? "Choose an access type"
              : "Looks good — pick a time"}
        </button>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function StepButton({
  children,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition",
        "hover:border-primary hover:bg-primary/[0.04]",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
