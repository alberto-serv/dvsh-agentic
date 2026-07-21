"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  Tag,
  CheckCircle2,
  Loader2,
  Phone,
  ShieldCheck,
  CalendarClock,
  ArrowLeft,
} from "lucide-react";
import { cn, formatUSD } from "@/lib/utils";
import type { CheckoutHandoff } from "@/lib/types";

const CHECKOUT_KEY = "dvsh-checkout";

const PROMO_CODES: Record<string, number> = {
  SAVE10: 10,
  SAVE20: 20,
  FIRST15: 15,
};

export default function CheckoutPage() {
  const [order, setOrder] = useState<CheckoutHandoff | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "confirmed">(
    "idle",
  );
  const [orderId] = useState(
    () => `DVS${Math.floor(100000 + Math.random() * 900000)}`,
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKOUT_KEY);
      // localStorage isn't available during SSR, so hydration happens post-mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setOrder(JSON.parse(raw) as CheckoutHandoff);
    } catch {
      // ignore — falls through to the empty state
    }
    setHydrated(true);
  }, []);

  const taxRate = order?.taxRate ?? 0.0825;
  const subtotal = order?.total ?? 0;
  const promoDiscount = appliedPromo
    ? Math.round(subtotal * (appliedPromo.discount / 100) * 100) / 100
    : 0;
  const taxedBase = Math.max(0, subtotal - promoDiscount);
  const tax = Math.round(taxedBase * taxRate * 100) / 100;
  const finalTotal = taxedBase + tax;

  const cardDigits = card.replace(/\D/g, "");
  const expiryDigits = expiry.replace(/\D/g, "");
  const cvvDigits = cvv.replace(/\D/g, "");
  const isProcessing = status === "processing";
  const canSubmit =
    cardDigits.length === 16 &&
    expiryDigits.length === 4 &&
    cvvDigits.length >= 3 &&
    terms &&
    !isProcessing;

  function handleCardChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setCard(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
  }
  function handleExpiryChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`);
  }
  function handleCvvChange(value: string) {
    setCvv(value.replace(/\D/g, "").slice(0, 4));
  }
  function handleApplyPromo() {
    setPromoError("");
    const code = promo.trim().toUpperCase();
    if (!code) return;
    const discount = PROMO_CODES[code];
    if (!discount) {
      setPromoError("Invalid promo code");
      return;
    }
    setAppliedPromo({ code, discount });
    setPromo("");
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("processing");
    await new Promise((r) => setTimeout(r, 1800));
    try {
      window.localStorage.removeItem(CHECKOUT_KEY);
    } catch {
      // ignore
    }
    setStatus("confirmed");
  }

  const lines = order?.lines ?? [];

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/dvsh-logo.webp"
            alt="Dryer Vent Superheroes"
            width={56}
            height={47}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <a
          href="tel:+16156322980"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-4 w-4" />
          (615) 632-2980
        </a>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        {!hydrated ? null : !order ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Nothing to check out yet
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Head back to the booking assistant to build your estimate.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to assistant
            </Link>
          </div>
        ) : status === "confirmed" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="bg-primary px-6 py-3">
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
                Booking confirmed
              </p>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00dbe6]/15">
                  <CheckCircle2 className="h-5 w-5 text-[#0099a3]" />
                </div>
                <div>
                  <h1 className="font-heading text-lg font-semibold text-foreground">
                    You&apos;re booked!
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Confirmation #{orderId} — we&apos;ll see you on {order.slot}.
                  </p>
                </div>
              </div>
              <dl className="space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
                <Row label="Services" value={order.services} />
                <Row label="Appointment" value={order.slot} />
                <Row label="Charged" value={formatUSD(finalTotal)} emphasized />
              </dl>
              <p className="text-xs text-muted-foreground">
                A receipt is on its way to your inbox. Questions? Call{" "}
                <a href="tel:+16156322980" className="text-foreground hover:underline">
                  (615) 632-2980
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,320px)]">
            {/* Payment form */}
            <form
              onSubmit={handleSubmit}
              className="order-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm md:order-1"
            >
              <div className="bg-primary px-5 py-3">
                <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
                  Payment
                </p>
              </div>
              <div className="space-y-5 px-6 py-5">
                <section>
                  <header className="mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                      Card details
                    </h2>
                  </header>
                  <div className="space-y-3">
                    <Field
                      label="Card number"
                      value={card}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                      disabled={status !== "idle"}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Expiry"
                        value={expiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                        disabled={status !== "idle"}
                      />
                      <Field
                        label="CVV"
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        autoComplete="cc-csc"
                        disabled={status !== "idle"}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <header className="mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                      Promo code
                    </h2>
                  </header>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between rounded-lg border border-[#00dbe6]/40 bg-[#00dbe6]/10 px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-[#0099a3]">
                        <CheckCircle2 className="h-4 w-4" />
                        {appliedPromo.code} applied ({appliedPromo.discount}% off)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedPromo(null)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promo}
                          onChange={(e) => {
                            setPromo(e.target.value);
                            setPromoError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyPromo();
                            }
                          }}
                          placeholder="Enter code"
                          disabled={status !== "idle"}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={!promo.trim() || status !== "idle"}
                          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-red-600">{promoError}</p>
                      )}
                    </div>
                  )}
                </section>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    disabled={status !== "idle"}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="text-sm leading-snug text-foreground">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-primary hover:underline">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition",
                    "hover:bg-secondary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>Confirm booking · {formatUSD(finalTotal)}</>
                  )}
                </button>

                <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure payment · your card is never stored
                </div>
              </div>
            </form>

            {/* Order summary */}
            <aside className="order-1 h-fit overflow-hidden rounded-xl border border-border bg-card shadow-sm md:order-2">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Order summary
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {order.slot}
                </div>
              </div>
              <div className="space-y-2.5 px-5 py-4 text-sm">
                {lines.length > 0 ? (
                  lines.map((line, i) => {
                    const isDiscount = line.amount < 0;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start justify-between gap-3",
                          isDiscount ? "pl-3 text-[#0099a3]" : "text-foreground/90",
                        )}
                      >
                        <span className="leading-snug">{line.label}</span>
                        <span className="shrink-0 font-mono tabular-nums">
                          {formatUSD(line.amount)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-foreground/90">{order.services}</p>
                )}
              </div>
              <div className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
                <SummaryRow label="Subtotal" value={formatUSD(subtotal)} />
                {appliedPromo && (
                  <SummaryRow
                    label={`Promo · ${appliedPromo.code}`}
                    value={`-${formatUSD(promoDiscount)}`}
                    accent
                  />
                )}
                <SummaryRow label={`Tax (${(taxRate * 100).toFixed(2)}%)`} value={formatUSD(tax)} />
                <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
                  <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                    Total
                  </span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {formatUSD(finalTotal)}
                  </span>
                </div>
                {order.note && (
                  <p className="pt-1 text-xs text-muted-foreground">{order.note}</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt
        className={cn(
          "text-muted-foreground",
          emphasized &&
            "font-heading text-sm font-semibold uppercase tracking-wider text-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-right text-foreground",
          emphasized && "font-heading text-lg font-semibold tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums text-foreground",
          accent && "text-[#0099a3]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
      />
    </label>
  );
}
