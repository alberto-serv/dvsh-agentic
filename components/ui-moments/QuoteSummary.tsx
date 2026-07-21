import { cn, formatUSD } from "@/lib/utils";
import type { QuoteSummaryData } from "@/lib/types";

interface Props {
  data: QuoteSummaryData;
}

export function QuoteSummary({ data }: Props) {
  const displayTotal = data.subtotal;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-l-4 border-primary px-6 py-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
            Estimate
          </h3>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Dryer Vent Superheroes
          </span>
        </div>

        <ul className="space-y-2.5 text-[15px]">
          {data.lines.map((line, i) => {
            const isDiscount = line.amount < 0;
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start justify-between gap-4",
                  isDiscount
                    ? "pl-3 text-[#0099a3]"
                    : "text-foreground/90",
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

        <div className="mt-4 border-t border-border pt-3.5">
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Total
            </span>
            <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
              {formatUSD(displayTotal)}
            </span>
          </div>
          {data.note && (
            <p className="mt-1.5 text-xs text-muted-foreground">{data.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
