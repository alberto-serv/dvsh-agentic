import type { AgentData, AgentSlot } from "./types";

// The DVSH catalog is embedded in this repo (agent.md at the project root),
// served by /api/agent. Unlike a live storefront feed, availability is
// synthetic: we generate a rolling set of weekday appointment windows on the
// client from the `time_windows` declared in the availability block.

interface TimeWindow {
  value: string;
  label: string;
}

// How many days ahead to offer, and how the fixed windows map to clock hours.
const CALENDAR_DAYS = 28;
const CENTRAL_OFFSET = "-05:00"; // CDT — fine for a prototype (today is summer).

// Window `value` → [startHour, endHour] in 24h Central wall-clock.
const WINDOW_HOURS: Record<string, [number, number]> = {
  "8am": [8, 9],
  "10am": [10, 11],
  "11am": [11, 12],
  "1pm": [13, 14],
  "2pm": [14, 15],
  "4pm": [16, 17],
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Deterministic "unavailability" so the calendar feels real: hide a few
// windows per day based on the day-of-month, mirroring the storefront.
function hiddenWindowIndexes(dayOfMonth: number, count: number): Set<number> {
  const hidden = new Set<number>();
  if (count === 0) return hidden;
  hidden.add(dayOfMonth % count);
  hidden.add((dayOfMonth + 2) % count);
  hidden.add((dayOfMonth + 5) % count);
  return hidden;
}

function generateAvailability(windows: TimeWindow[]): AgentSlot[] {
  const slots: AgentSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= CALENDAR_DAYS; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue; // skip weekends

    const y = day.getFullYear();
    const m = day.getMonth() + 1;
    const d = day.getDate();
    const hidden = hiddenWindowIndexes(d, windows.length);

    windows.forEach((w, idx) => {
      if (hidden.has(idx)) return;
      const hours = WINDOW_HOURS[w.value];
      if (!hours) return;
      const [sh, eh] = hours;
      const date = `${y}-${pad(m)}-${pad(d)}`;
      slots.push({
        start: `${date}T${pad(sh)}:00:00${CENTRAL_OFFSET}`,
        end: `${date}T${pad(eh)}:00:00${CENTRAL_OFFSET}`,
      });
    });
  }
  return slots;
}

export function parseAgentMd(raw: string): AgentData {
  const servicesMatch = raw.match(/```json services\n([\s\S]*?)```/);
  const availabilityMatch = raw.match(/```json availability\n([\s\S]*?)```/);

  if (!servicesMatch || !availabilityMatch) {
    throw new Error("agent.md is missing expected JSON blocks");
  }

  const servicesJson = JSON.parse(servicesMatch[1]) as {
    services: unknown[];
    tax_rate?: number;
  };
  const availabilityJson = JSON.parse(availabilityMatch[1]) as {
    time_windows?: TimeWindow[];
    slots?: AgentSlot[];
  };

  const windows = availabilityJson.time_windows ?? [];
  const availability =
    availabilityJson.slots && availabilityJson.slots.length > 0
      ? availabilityJson.slots
      : generateAvailability(windows);

  return {
    raw,
    services: servicesJson.services,
    availability,
    meta: {
      name: "Dryer Vent Superheroes",
      phone: "(615) 632-2980",
      timezone: "America/Chicago",
      bookingUrl: "/checkout",
      taxRate: servicesJson.tax_rate ?? 0.0825,
    },
  };
}
