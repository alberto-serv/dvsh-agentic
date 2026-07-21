export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

export interface AgentSlot {
  start: string;
  end: string;
}

export interface AgentMeta {
  name: string;
  phone: string;
  timezone: string;
  bookingUrl: string;
  taxRate: number;
}

export interface AgentData {
  raw: string;
  services: unknown[];
  availability: AgentSlot[];
  meta: AgentMeta;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface QuoteSummaryData {
  lines: QuoteLine[];
  subtotal: number;
  // Optional footnote, e.g. annual-renewal pricing or a bundle-savings note.
  note?: string;
}

export interface SlotPickerOption {
  id: string;
  start: string;
  label: string;
}

export interface SlotPickerData {
  slots: SlotPickerOption[];
}

export interface BookingHandoffData {
  summary: {
    services: string;
    slot: string;
    total: number;
    // Optional itemized breakdown so the checkout page can render line items.
    lines?: QuoteLine[];
    // Optional annual-plan / renewal footnote carried through to checkout.
    note?: string;
  };
  booking_url: string;
}

// Shape persisted to localStorage when the customer continues to /checkout.
export interface CheckoutHandoff {
  services: string;
  slot: string;
  total: number;
  lines?: QuoteLine[];
  note?: string;
  taxRate: number;
}

export interface TierOption {
  key: string;
  label: string;
  price_per_unit: number;
  unit: string;
  description?: string;
  includes?: string[];
  most_popular?: boolean;
}

export interface TierPickerData {
  service: string;
  units?: string;
  options: TierOption[];
}

export interface DatePickerData {
  prompt?: string;
}

export interface ContactFormData {
  prompt?: string;
}

export interface RecurrenceOption {
  key: string;
  label: string;
  discount_percent: number;
  description?: string;
  most_popular?: boolean;
}

export interface RecurrencePickerData {
  eligible_services?: string[];
  options: RecurrenceOption[];
}

export type UIMoment =
  | { component: "quote_summary"; data: QuoteSummaryData }
  | { component: "slot_picker"; data: SlotPickerData }
  | { component: "booking_handoff"; data: BookingHandoffData }
  | { component: "tier_picker"; data: TierPickerData }
  | { component: "date_picker"; data: DatePickerData }
  | { component: "contact_form"; data: ContactFormData }
  | { component: "recurrence_picker"; data: RecurrencePickerData };
