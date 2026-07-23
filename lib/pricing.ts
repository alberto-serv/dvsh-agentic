// Single source of truth for order pricing.
//
// Extracted verbatim from the logic that used to live inline in
// app/estimate/payment/page.tsx and the helpers in lib/service-frequency.ts.
// Every number here is cross-checked against the JSON in agent.md — if the two
// ever disagree, agent.md (the agent's pricing data) is authoritative.

import type { CheckoutOrder } from "./types"
import {
  frequencyMultiplier,
  hasSplitAnnualPricing,
  getAnnualFirstPayment,
  getAnnualRenewal,
  isRecurringEligible,
  type ServiceFrequency,
} from "./service-frequency"

type OrderServices = CheckoutOrder["services"]

export const TAX_RATE = 0.0825

export type CatalogService = { id: string; name: string; basePrice: number }
export type CatalogAddOn = {
  id: string
  name: string
  price: number
  priceLabel?: string
}

// The storefront service menu and checkout add-ons. ids/names/prices match
// agent.md's `services` and `checkout_addons` blocks exactly.
export const SERVICE_CATALOG: {
  availableServices: CatalogService[]
  checkoutAddOns: CatalogAddOn[]
} = {
  availableServices: [
    { id: "dryer-vent-cleaning", name: "Dryer Vent Cleaning", basePrice: 175 },
    { id: "dryer-vent-special", name: "Dryer Vent Cleaning Special", basePrice: 350 },
    { id: "dryer-vent-duct-bundle", name: "Dryer Vent + Air Duct Cleaning Bundle", basePrice: 0 },
    { id: "dryer-vent-duct-repair", name: "Dryer Vent Duct Repair", basePrice: 0 },
    { id: "bathroom-fan", name: "Bathroom Fan Cleaning", basePrice: 175 },
    { id: "coil-cleaning", name: "Coil Cleaning", basePrice: 385 },
    { id: "ac-duct-cleaning", name: "AC Duct Cleaning", basePrice: 500 },
    { id: "whole-home-air", name: "Whole-Home Air Package", basePrice: 0 },
  ],
  checkoutAddOns: [
    { id: "magnetic-vent-cover", name: "Magnetic Vent Cover", price: 110 },
    { id: "transition-hose", name: "Transition Hose Replacement", price: 75 },
    { id: "reroute", name: "Reroute", price: 189, priceLabel: "from $189" },
  ],
}

// Whole-Home Air Package: AC duct ($500 + $30/extra duct) + coil ($385) +
// bathroom fan ($175), then 15% off the whole bundle, rounded.
function computeWholeHome(ducts: number): number {
  const gross = 500 + Math.max(0, ducts - 10) * 30 + 385 + 175
  return Math.round(gross * 0.85)
}

export function getServiceBasePrice(order: OrderServices, serviceId: string): number {
  const service = SERVICE_CATALOG.availableServices.find((s) => s.id === serviceId)
  if (!service) return 0
  const s = order ?? ({} as OrderServices)
  if (serviceId === "ac-duct-cleaning") {
    const ductCount = s.ductCount ?? 10
    return 500 + Math.max(0, ductCount - 10) * 30
  }
  if (serviceId === "dryer-vent-cleaning") {
    const access = s.dryerVentAccessType
    if (access === "roof") return 249
    if (access === "second-floor") return 189
    return 175
  }
  if (serviceId === "dryer-vent-duct-bundle") return s.bundlePrice ?? 0
  if (serviceId === "whole-home-air") {
    return s.wholeHomePrice ?? computeWholeHome(s.wholeHomeDuctCount ?? 10)
  }
  if (serviceId === "dryer-vent-duct-repair") return 0
  return service.basePrice
}

export type OrderPricingLine = {
  serviceId?: string
  addonId?: string
  label: string
  amount: number
  frequency?: ServiceFrequency
  annualRenewal?: number
}

export interface OrderPricing {
  lines: OrderPricingLine[]
  subtotal: number
  subscriptionDiscount: number
  discountedSubtotal: number
  addonsTotal: number
  tax: number
  total: number
  notes: string[]
}

function getServiceFrequency(order: OrderServices, serviceId: string): ServiceFrequency {
  if (!isRecurringEligible(serviceId)) return "none"
  return order?.serviceFrequencies?.[serviceId] ?? "none"
}

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// The one pricing function the whole app calls. Given the order's `services`
// selection, returns itemized lines plus every rolled-up total the checkout
// summary needs. Promo codes are intentionally NOT applied here — they're a
// UI-layer concern the payment page layers on top of `discountedSubtotal`.
export function computeOrderPricing(order: OrderServices): OrderPricing {
  const selectedServices = order?.selectedServices ?? []
  const selectedCheckoutAddOns = order?.selectedCheckoutAddOns ?? []
  const notes: string[] = []

  const serviceDetails = selectedServices
    .map((serviceId) => {
      const service = SERVICE_CATALOG.availableServices.find((s) => s.id === serviceId)
      if (!service) return null
      const price = getServiceBasePrice(order, serviceId)
      const frequency = getServiceFrequency(order, serviceId)
      const splitPricing = hasSplitAnnualPricing(serviceId)
      const discountedPrice =
        frequency === "annual"
          ? getAnnualFirstPayment(serviceId, price)
          : price * frequencyMultiplier(frequency)
      const annualRenewal =
        frequency === "annual"
          ? getAnnualRenewal(serviceId, price, {
              specialAccessType: order?.specialAccessType,
            })
          : 0
      return { service, price, frequency, splitPricing, discountedPrice, annualRenewal }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)

  const serviceLines: OrderPricingLine[] = serviceDetails.map((d) => ({
    serviceId: d.service.id,
    label: d.service.name,
    amount: d.discountedPrice,
    frequency: d.frequency,
    annualRenewal: d.annualRenewal,
  }))

  // Renewal notes for split-pricing services on the annual plan.
  for (const d of serviceDetails) {
    if (d.frequency === "annual" && d.splitPricing) {
      if (d.service.id === "whole-home-air") {
        notes.push(
          `Whole-Home Air Package renews as a discounted annual coil cleaning ($${money(
            d.annualRenewal,
          )}/yr).`,
        )
      } else {
        notes.push(
          `Dryer Vent Cleaning Special: $${money(d.price)} today, then $${money(
            d.annualRenewal,
          )}/yr on the annual plan.`,
        )
      }
    }
  }

  const addonLines: OrderPricingLine[] = selectedCheckoutAddOns
    .map((id) => SERVICE_CATALOG.checkoutAddOns.find((a) => a.id === id))
    .filter((a): a is CatalogAddOn => !!a)
    .map((addon) => ({ addonId: addon.id, label: addon.name, amount: addon.price }))

  // Reroute is informational: its price shows on the line ("from $189") but it's
  // billed on-site, so it never enters any math total.
  if (selectedCheckoutAddOns.includes("reroute")) {
    notes.push("Reroute: from $189, final price confirmed on-site.")
  }

  const subtotal = serviceDetails.reduce((t, d) => t + d.price, 0)
  const discountedSubtotal = serviceDetails.reduce((t, d) => t + d.discountedPrice, 0)
  const subscriptionDiscount = Math.round(subtotal - discountedSubtotal)
  const addonsTotal = selectedCheckoutAddOns.reduce((sum, id) => {
    const addon = SERVICE_CATALOG.checkoutAddOns.find((a) => a.id === id)
    return addon && !addon.priceLabel ? sum + addon.price : sum
  }, 0)
  const tax = (discountedSubtotal + addonsTotal) * TAX_RATE
  const total = discountedSubtotal + addonsTotal + tax

  return {
    lines: [...serviceLines, ...addonLines],
    subtotal,
    subscriptionDiscount,
    discountedSubtotal,
    addonsTotal,
    tax,
    total,
    notes,
  }
}
