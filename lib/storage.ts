import type { ChatMessage, CheckoutOrder } from "./types";

const KEY = "dvsh-chat-v1";
const ORDER_KEY = "dvsh-order-v1";
const CUSTOMER_KEY = "dvsh-customer-v1";
const MAX_MESSAGES = 200;

type OrderServices = CheckoutOrder["services"];
type Customer = CheckoutOrder["customer"];

const EMPTY_ORDER: OrderServices = { selectedServices: [] };

export function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded or storage disabled — drop silently
  }
}

export function clearMessages(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function loadOrder(): OrderServices {
  if (typeof window === "undefined") return { ...EMPTY_ORDER };
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return { ...EMPTY_ORDER };
    const parsed = JSON.parse(raw) as OrderServices;
    return parsed && Array.isArray(parsed.selectedServices)
      ? parsed
      : { ...EMPTY_ORDER };
  } catch {
    return { ...EMPTY_ORDER };
  }
}

export function saveOrder(order: OrderServices): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // quota exceeded or storage disabled — drop silently
  }
}

export function clearOrder(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORDER_KEY);
  } catch {
    // ignore
  }
}

export function loadCustomer(): Customer {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOMER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Customer;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCustomer(customer: Customer): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch {
    // quota exceeded or storage disabled — drop silently
  }
}

export function clearCustomer(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CUSTOMER_KEY);
  } catch {
    // ignore
  }
}
