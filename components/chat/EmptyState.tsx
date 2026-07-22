"use client";

import Image from "next/image";

interface Props {
  onSuggestion: (text: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  "My clothes take two cycles to dry",
  "How often should vents be cleaned?",
  "What does a cleaning include?",
  "Dryer Vent Special",
  "AC Duct Cleaning",
  "Whole-Home Air Package",
];

export function EmptyState({ onSuggestion, disabled }: Props) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-10 px-6 py-12 sm:px-8">
      <div className="space-y-4">
        <Image
          src="/dvsh-logo.webp"
          alt="Dryer Vent Superheroes"
          width={128}
          height={107}
          className="mx-auto block h-24 w-auto"
          priority
        />
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Booking Assistant
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What&apos;s going on with your dryer?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask a question or pick a service — real answers, real prices.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Try one of these
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onSuggestion(s)}
              className="group rounded-xl border border-border bg-card px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <span className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
                {s}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
