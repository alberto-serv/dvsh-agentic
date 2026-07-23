// Runnable pricing regression check: `npx tsx scripts/pricing-check.ts`
//
// Asserts the known-good totals from AGENT_SYSTEM_PROMPT.md against the single
// source of truth in lib/pricing.ts.

import { computeOrderPricing, getServiceBasePrice } from "../lib/pricing"
import type { CheckoutOrder } from "../lib/types"

type OrderServices = CheckoutOrder["services"]

let failures = 0

function assertEqual(label: string, actual: number, expected: number) {
  const pass = Math.abs(actual - expected) < 1e-6
  if (!pass) failures++
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}: got ${actual}, expected ${expected}`)
}

// whole-home-air, 12 ducts, one-time → discountedSubtotal 952
{
  const order: OrderServices = {
    selectedServices: ["whole-home-air"],
    wholeHomeDuctCount: 12,
    serviceFrequencies: { "whole-home-air": "none" },
  }
  assertEqual("whole-home-air 12 ducts one-time", computeOrderPricing(order).discountedSubtotal, 952)
}

// whole-home-air, 10 ducts → 901; 15 ducts → 1029 (base price of the service)
assertEqual(
  "whole-home-air 10 ducts base",
  getServiceBasePrice({ selectedServices: [], wholeHomeDuctCount: 10 }, "whole-home-air"),
  901,
)
assertEqual(
  "whole-home-air 15 ducts base",
  getServiceBasePrice({ selectedServices: [], wholeHomeDuctCount: 15 }, "whole-home-air"),
  1029,
)

// dryer-vent-cleaning roof, annual → 211.65 (first-payment discounted subtotal)
{
  const order: OrderServices = {
    selectedServices: ["dryer-vent-cleaning"],
    dryerVentAccessType: "roof",
    serviceFrequencies: { "dryer-vent-cleaning": "annual" },
  }
  assertEqual("dryer-vent-cleaning roof annual", computeOrderPricing(order).discountedSubtotal, 211.65)
}

// coil-cleaning annual → 327.25
{
  const order: OrderServices = {
    selectedServices: ["coil-cleaning"],
    serviceFrequencies: { "coil-cleaning": "annual" },
  }
  assertEqual("coil-cleaning annual", computeOrderPricing(order).discountedSubtotal, 327.25)
}

// dryer-vent-cleaning side + magnetic-vent-cover + transition-hose, one-time
//   → services 175, addons 185
{
  const order: OrderServices = {
    selectedServices: ["dryer-vent-cleaning"],
    dryerVentAccessType: "side",
    serviceFrequencies: { "dryer-vent-cleaning": "none" },
    selectedCheckoutAddOns: ["magnetic-vent-cover", "transition-hose"],
  }
  const pricing = computeOrderPricing(order)
  assertEqual("dvc side + addons: services", pricing.discountedSubtotal, 175)
  assertEqual("dvc side + addons: addons", pricing.addonsTotal, 185)
}

console.log(failures === 0 ? "\nAll pricing checks passed." : `\n${failures} check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
