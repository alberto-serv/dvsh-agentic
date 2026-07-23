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
  // Slim format: the client owns the order, so the model sends only the picked
  // slot label. The review card is built from live order + customer state.
  slot?: string;

  // Legacy fields from older saved chats — when `summary` is present the card
  // renders in tolerant fallback mode from these instead of live state.
  summary?: {
    services: string;
    slot: string;
    total: number;
    // Optional itemized breakdown so the review card can show line items.
    lines?: QuoteLine[];
    // Optional annual-plan / renewal footnote.
    note?: string;
  };
  // Structured selection older chats wrote to localStorage("estimateData").
  order?: CheckoutOrder;
  booking_url?: string;
}

// Storefront-shaped estimate data the /estimate/payment page reads.
export interface CheckoutOrder {
  services: {
    selectedServices: string[];
    dryerVentAccessType?: string;
    ductCount?: number;
    bundleAccessType?: string;
    bundleVentCount?: number;
    bundlePrice?: number;
    specialAccessType?: string;
    wholeHomeDuctCount?: number;
    wholeHomePrice?: number;
    serviceFrequencies?: Record<string, "none" | "annual">;
    selectedCheckoutAddOns?: string[];
  };
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    preferredDate?: string;
    timeWindow?: string;
  };
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
  // Which order the picked tier maps onto. Defaults to the plain Dryer Vent
  // Cleaning access type; the bundle reuses this card for its own access field.
  service_id?: string;
  order_field?: "dryerVentAccessType" | "bundleAccessType";
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

export interface AddonOption {
  key: string;
  name: string;
  price: number;
  price_label?: string;
  description?: string;
}

export interface AddonPickerData {
  prompt?: string;
  options: AddonOption[];
}

export interface OrderBuilderData {
  service_id: string;
  // Present when the service is priced by access type (same option shape as the
  // tier picker). Omitted for flat- or duct-priced services.
  access_options?: TierOption[];
  // Seeds the access radio when the customer already said where the vent exits
  // (a stated fact). When absent nothing is preselected — the card must never
  // assert an access type the customer didn't choose.
  access_type?: string;
  // AC Duct Cleaning and the Whole-Home Air Package scale with duct count.
  needs_duct_count?: boolean;
  // Seeds the duct stepper when the customer already stated a count (a fact, not
  // a preference). Falls back to the default when omitted.
  duct_count?: number;
  // The checkout add-ons offered alongside a dryer-vent service.
  addons?: AddonOption[];
  // Flat-price services the model has already decided to bundle in (e.g. coil
  // cleaning alongside a vent cleaning). Rendered as pre-checked footer lines.
  add_services?: string[];
  // Complementary flat-price services offered as unchecked checkboxes the
  // customer can add on the card. Live pricing updates as they tick them.
  suggested_services?: string[];
}

export type UIMoment =
  | { component: "quote_summary"; data: QuoteSummaryData }
  | { component: "slot_picker"; data: SlotPickerData }
  | { component: "booking_handoff"; data: BookingHandoffData }
  | { component: "tier_picker"; data: TierPickerData }
  | { component: "date_picker"; data: DatePickerData }
  | { component: "contact_form"; data: ContactFormData }
  | { component: "recurrence_picker"; data: RecurrencePickerData }
  | { component: "addon_picker"; data: AddonPickerData }
  | { component: "order_builder"; data: OrderBuilderData };
