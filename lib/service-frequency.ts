export type ServiceFrequency = "none" | "annual"

export const FREQUENCY_DISCOUNT_PCT: Record<ServiceFrequency, number> = {
  none: 0,
  annual: 15,
}

export const RECURRING_SERVICE_IDS = [
  "dryer-vent-cleaning",
  "dryer-vent-special",
  "coil-cleaning",
  "whole-home-air",
] as const

export type RecurringServiceId = (typeof RECURRING_SERVICE_IDS)[number]

export const isRecurringEligible = (serviceId: string): boolean =>
  (RECURRING_SERVICE_IDS as readonly string[]).includes(serviceId)

export const frequencyMultiplier = (f: ServiceFrequency): number =>
  1 - FREQUENCY_DISCOUNT_PCT[f] / 100

export const frequencyLongLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "Annual" : "One-Time"

export const frequencyShortLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "/yr" : ""

// Per-access-type cleaning prices used for the Special's renewal calculation.
export const SIDE_ACCESS_PRICE = 175
export const ROOF_ACCESS_PRICE = 249

// Standalone coil cleaning price — the Whole-Home Air Package renews as an
// annual coil cleaning after the first visit.
export const COIL_CLEANING_PRICE = 385

// Services with a distinct first-payment vs. renewal price on the annual plan.
// First payment = basePrice; renewal = next standard service with the annual discount.
export const hasSplitAnnualPricing = (serviceId: string): boolean =>
  serviceId === "dryer-vent-special" || serviceId === "whole-home-air"

export const getAnnualFirstPayment = (serviceId: string, basePrice: number): number => {
  if (hasSplitAnnualPricing(serviceId)) return basePrice
  return basePrice * frequencyMultiplier("annual")
}

export const getAnnualRenewal = (
  serviceId: string,
  basePrice: number,
  context?: { specialAccessType?: string },
): number => {
  if (hasSplitAnnualPricing(serviceId)) {
    // The Whole-Home Air Package renews as a discounted annual coil cleaning.
    if (serviceId === "whole-home-air") {
      return COIL_CLEANING_PRICE * frequencyMultiplier("annual")
    }
    const access = context?.specialAccessType ?? "side"
    const renewalBase = access === "roof" ? ROOF_ACCESS_PRICE : SIDE_ACCESS_PRICE
    return renewalBase * frequencyMultiplier("annual")
  }
  return basePrice * frequencyMultiplier("annual")
}
