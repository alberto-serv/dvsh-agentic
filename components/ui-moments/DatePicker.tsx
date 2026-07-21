"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentSlot, DatePickerData } from "@/lib/types";

interface Props {
  data: DatePickerData;
  availability: AgentSlot[];
  onSelect: (label: string) => void;
  disabled?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthHasAny(
  month: { y: number; m: number },
  byDay: Map<string, AgentSlot[]>,
): boolean {
  const prefix = `${month.y}-${String(month.m).padStart(2, "0")}`;
  for (const key of byDay.keys()) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeRange(slot: AgentSlot): string {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const fmt = (d: Date) =>
    d
      .toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(":00", "");
  return `${fmt(start)}–${fmt(end)}`;
}

function formatLongLabel(slot: AgentSlot): string {
  const start = new Date(slot.start);
  const day = start.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${formatTimeRange(slot)}`;
}

export function DatePicker({ data, availability, onSelect, disabled }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<string, AgentSlot[]>();
    for (const slot of availability) {
      const key = isoDayKey(slot.start);
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    }
    return map;
  }, [availability]);

  const days = useMemo(
    () => Array.from(byDay.keys()).sort(),
    [byDay],
  );

  const minMonth = useMemo(() => {
    if (days.length === 0) return null;
    const [y, m] = days[0].split("-").map(Number);
    return { y, m };
  }, [days]);

  const [currentMonth, setCurrentMonth] = useState<{ y: number; m: number }>(
    () => minMonth ?? { y: new Date().getFullYear(), m: new Date().getMonth() + 1 },
  );

  const [selectedDay, setSelectedDay] = useState<string | null>(
    days[0] ?? null,
  );
  const [pickedSlotStart, setPickedSlotStart] = useState<string | null>(null);

  const monthGrid = useMemo(() => {
    const { y, m } = currentMonth;
    const firstOfMonth = new Date(y, m - 1, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: ({ key: string; day: number; has: boolean } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ key, day: d, has: byDay.has(key) });
    }
    return {
      cells,
      monthLabel: firstOfMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [currentMonth, byDay]);

  const hasAnyAvailability = days.length > 0;
  // Don't allow going earlier than the first month that has availability —
  // earlier months are in the past or have no slots anyway. Forward
  // navigation is unbounded so customers can browse future months.
  const canGoPrev = !!(
    minMonth &&
    (currentMonth.y > minMonth.y ||
      (currentMonth.y === minMonth.y && currentMonth.m > minMonth.m))
  );
  const canGoNext = true;

  function shiftMonth(delta: number) {
    setCurrentMonth((prev) => {
      const total = prev.y * 12 + (prev.m - 1) + delta;
      return { y: Math.floor(total / 12), m: (total % 12) + 1 };
    });
  }

  const monthHasAvailability = monthHasAny(currentMonth, byDay);

  const isSelectedDayInView =
    selectedDay && byDay.has(selectedDay)
      ? selectedDay.startsWith(
          `${currentMonth.y}-${String(currentMonth.m).padStart(2, "0")}`,
        )
      : false;
  const selectedSlots =
    isSelectedDayInView && selectedDay ? byDay.get(selectedDay) ?? [] : [];

  if (!hasAnyAvailability) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        No availability in the current window — please call (615) 632-2980.
      </div>
    );
  }

  function handlePickSlot(slot: AgentSlot) {
    if (disabled || pickedSlotStart) return;
    setPickedSlotStart(slot.start);
    onSelect(`I'll take ${formatLongLabel(slot)}`);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {data.prompt ?? "Pick a date & time"}
        </h3>
        <span className="text-xs text-muted-foreground">America/Chicago</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_minmax(0,200px)]">
        {/* Calendar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrev || disabled}
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className={cn(
                "rounded-md p-1 transition",
                canGoPrev && !disabled
                  ? "text-foreground hover:bg-primary/[0.06]"
                  : "text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-heading text-sm font-semibold text-foreground">
              {monthGrid.monthLabel}
            </span>
            <button
              type="button"
              disabled={!canGoNext || disabled}
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className={cn(
                "rounded-md p-1 transition",
                canGoNext && !disabled
                  ? "text-foreground hover:bg-primary/[0.06]"
                  : "text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthGrid.cells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const isSelected = cell.key === selectedDay;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!cell.has || disabled}
                  onClick={() => setSelectedDay(cell.key)}
                  className={cn(
                    "aspect-square rounded-md text-sm transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    cell.has
                      ? isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-primary/[0.06] text-foreground hover:bg-primary/[0.12]"
                      : "text-muted-foreground/40 cursor-not-allowed",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots for the selected day */}
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {isSelectedDayInView && selectedDay
              ? formatDayLabel(selectedDay)
              : "Pick a day"}
          </div>
          <div className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto pr-1">
            {selectedSlots.length === 0 && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isSelectedDayInView
                  ? "No openings."
                  : monthHasAvailability
                  ? "Tap a highlighted day to see times."
                  : "No openings in this month — try another."}
              </p>
            )}
            {selectedSlots.map((slot) => {
              const isPicked = pickedSlotStart === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={disabled || pickedSlotStart !== null}
                  onClick={() => handlePickSlot(slot)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isPicked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/[0.03]",
                    (disabled || (pickedSlotStart && !isPicked)) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  {formatTimeRange(slot)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
