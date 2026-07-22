"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Props {
  onSuggestion: (text: string) => void;
  disabled?: boolean;
}

const QUESTIONS = [
  "My clothes take two cycles to dry",
  "How often should vents be cleaned?",
  "What does a cleaning include?",
];

interface Service {
  name: string;
  meta: string;
  badge?: string;
  variant: "primary" | "plain" | "value";
}

const SERVICES: Service[] = [
  {
    name: "Dryer Vent Special",
    meta: "$350 first visit",
    badge: "POPULAR",
    variant: "primary",
  },
  { name: "AC Duct Cleaning", meta: "from $500", variant: "plain" },
  {
    name: "Whole-Home Air Package",
    meta: "bundle & save",
    badge: "BEST VALUE",
    variant: "value",
  },
];

// The design uses Geist / Geist Mono; scope those to this hero via the CSS vars set in layout.
const mono = "font-[family-name:var(--font-geist-mono)]";

export function EmptyState({ onSuggestion, disabled }: Props) {
  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      <div className="overflow-hidden rounded-3xl border border-[#d3e2f6] bg-[#eaf1fc] shadow-[0_40px_90px_-40px_rgba(20,24,29,0.35)]">
        {/* hero */}
        <div className="flex flex-col items-center px-6 pt-12 text-center sm:px-16 sm:pt-14">
          <Image
            src="/dvsh-logo.webp"
            alt="Dryer Vent Superheroes mascot"
            width={104}
            height={87}
            priority
            className="mb-5 h-24 w-auto drop-shadow-[0_12px_18px_rgba(20,24,29,0.16)]"
          />
          <span
            className={`${mono} text-[12px] font-semibold uppercase tracking-[0.26em] text-[#e2564a]`}
          >
            Clean dryers prevent fires
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-[#14181d] sm:text-6xl">
            Let&rsquo;s clear the air.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-[#6f6a5f] sm:text-lg">
            Ask anything or pick a service. Real answers, honest pricing &mdash;
            no phone call required.
          </p>
        </div>

        {/* common questions */}
        <div className="px-6 pt-10 sm:px-14">
          <p
            className={`${mono} mb-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a39a8a]`}
          >
            Common questions
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={disabled}
                onClick={() => onSuggestion(q)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#ece5d9] bg-white px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-[#1d61c4] hover:shadow-[0_14px_30px_-18px_rgba(29,97,196,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d61c4]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <span className="text-[15.5px] font-semibold leading-snug text-[#14181d]">
                  {q}
                </span>
                <ArrowRight className="h-[18px] w-[18px] shrink-0 text-[#1d61c4] transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* popular services */}
        <div className="px-6 pb-12 pt-6 sm:px-14 sm:pb-14">
          <p
            className={`${mono} mb-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d8595]`}
          >
            Popular services
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {SERVICES.map((s) => (
              <ServiceCard
                key={s.name}
                service={s}
                disabled={disabled}
                onClick={() => onSuggestion(s.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  disabled,
  onClick,
}: {
  service: Service;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { name, meta, badge, variant } = service;
  const base =
    "group relative flex flex-col rounded-2xl px-5 py-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d61c4]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

  const shell =
    variant === "primary"
      ? "bg-gradient-to-br from-[#2f7de0] to-[#1a54ab] shadow-[0_12px_26px_-14px_rgba(29,97,196,0.55)] hover:shadow-[0_18px_34px_-14px_rgba(29,97,196,0.6)]"
      : "border border-[#d3e2f6] bg-white hover:border-[#1d61c4] hover:shadow-[0_14px_30px_-18px_rgba(29,97,196,0.5)]";

  const titleColor = variant === "primary" ? "text-white" : "text-[#14181d]";
  const metaColor =
    variant === "primary"
      ? "text-[#bcd6f7]"
      : variant === "value"
        ? "text-[#8a8377]"
        : "text-[#7d8595]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${shell}`}
    >
      {badge && (
        <span
          className={`${mono} absolute right-4 top-4 rounded-[5px] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.08em] text-white ${
            variant === "primary" ? "bg-white/[0.18]" : "bg-[#e2564a]"
          }`}
        >
          {badge}
        </span>
      )}
      <span
        className={`text-base font-bold ${titleColor} ${badge ? "pr-20" : ""}`}
      >
        {name}
      </span>
      <span className={`${mono} mt-2 text-[12.5px] ${metaColor}`}>{meta}</span>
    </button>
  );
}
