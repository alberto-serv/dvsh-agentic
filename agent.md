# Dryer Vent Superheroes — Agent Data

This file is the single source of truth for services, pricing, and availability.
The booking assistant reads the two JSON blocks below. All prices are in USD.

## Business

- **Name:** Dryer Vent Superheroes
- **Phone:** (615) 632-2980
- **Service area:** Houston, TX and surrounding areas
- **Timezone:** America/Chicago
- **Sales tax:** 8.25% (applied at checkout, after discounts)

## Pricing model notes (for the assistant)

- **Access type** applies to dryer-vent services: `side` (1st/2nd-floor side exit), `roof`, or `second-floor`.
- **AC Duct Cleaning** scales with duct count: `$500` base covers 10 ducts, then `+$30` per additional duct.
- **Annual plan** takes **15% off** recurring-eligible services. Two services have *split* pricing (full price today, discounted renewal next year): the Dryer Vent Special and the Whole-Home Air Package.
- **Checkout add-ons** are offered only when a dryer-vent service is in the order, and are hidden when the **Dryer Vent Cleaning Special** is selected (already bundled).

```json services
{
  "tax_rate": 0.0825,
  "annual_discount_pct": 15,
  "recurring_eligible": [
    "dryer-vent-cleaning",
    "dryer-vent-special",
    "coil-cleaning",
    "whole-home-air"
  ],
  "duct_pricing": { "base_price": 500, "base_ducts": 10, "per_extra_duct": 30 },
  "services": [
    {
      "id": "dryer-vent-cleaning",
      "name": "Dryer Vent Cleaning",
      "category": "Dryer Vent",
      "description": "Full deep cleaning of your dryer vent including a camera-scope vent inspection, professional tools, and a one-year guarantee.",
      "pricing_model": "access",
      "access_options": [
        { "key": "side", "label": "Side Access (1st or 2nd-floor side exit)", "price": 175 },
        { "key": "roof", "label": "Roof Access", "price": 249 },
        { "key": "second-floor", "label": "Second-Floor Cleaning", "price": 189 }
      ],
      "recurring": true,
      "annual_note": "15% off on the annual plan (Side $148.75/yr, Roof $211.65/yr, Second-floor $160.65/yr)."
    },
    {
      "id": "dryer-vent-special",
      "name": "Dryer Vent Cleaning Special",
      "category": "Dryer Vent",
      "best_value": true,
      "description": "Our full deep clean plus a fire-resistant high-flow transition hose, a magnetic bird-proof exterior vent door, and new braided washer hoses — save on upgrades with this bundle.",
      "pricing_model": "flat_with_access_renewal",
      "first_service_price": 350,
      "renewal_from_access": true,
      "renewal_note": "First service is $350 (one-time or annual). On the annual plan, next year renews as a standard cleaning at 15% off the chosen access type — Side $148.75/yr, Roof $211.65/yr.",
      "recurring": true,
      "bundles_addons": ["magnetic-vent-cover", "transition-hose"]
    },
    {
      "id": "dryer-vent-duct-bundle",
      "name": "Dryer Vent + Air Duct Cleaning Bundle",
      "category": "Dryer Vent",
      "description": "Bundle a dryer vent cleaning with full air-duct cleaning and save $50.",
      "pricing_model": "bundle_access_plus_vents",
      "formula": "access_base + (vent_count * 30) - 50",
      "access_options": [
        { "key": "side", "label": "Side Access", "price": 175 },
        { "key": "roof", "label": "Roof Access", "price": 249 }
      ],
      "per_vent": 30,
      "bundle_savings": 50,
      "recurring": false
    },
    {
      "id": "dryer-vent-duct-repair",
      "name": "Dryer Vent Duct Repair / Reroute",
      "category": "Dryer Vent",
      "description": "Free on-site estimate for dryer-vent duct repairs or reroutes. A technician assesses and quotes on-site — no charge today.",
      "pricing_model": "free_estimate",
      "price": 0,
      "recurring": false
    },
    {
      "id": "bathroom-fan",
      "name": "Bathroom Fan Cleaning",
      "category": "Air Quality",
      "description": "Remove dust and debris from bathroom exhaust fans for better ventilation and moisture control.",
      "pricing_model": "flat",
      "price": 175,
      "recurring": false
    },
    {
      "id": "coil-cleaning",
      "name": "Coil Cleaning",
      "category": "Air Quality",
      "description": "Deep cleaning of AC coils for maximum efficiency — improves cooling capacity and lowers energy costs.",
      "pricing_model": "flat",
      "price": 385,
      "recurring": true,
      "annual_note": "15% off on the annual plan → $327.25/yr."
    },
    {
      "id": "ac-duct-cleaning",
      "name": "AC Duct Cleaning",
      "category": "Air Quality",
      "description": "Full air-duct cleaning. Pricing scales with duct count — most single-family homes have 8–10 ducts.",
      "pricing_model": "per_duct",
      "base_price": 500,
      "base_ducts": 10,
      "per_extra_duct": 30,
      "recurring": false
    },
    {
      "id": "whole-home-air",
      "name": "Whole-Home Air Package",
      "category": "Air Quality",
      "description": "Complete air-quality bundle — AC duct cleaning, coil cleaning, and a bathroom fan cleaning, priced together to save 15% versus booking each separately.",
      "pricing_model": "whole_home_bundle",
      "components": ["ac-duct-cleaning", "coil-cleaning", "bathroom-fan"],
      "bundle_discount_pct": 15,
      "formula": "round((500 + max(0, ducts-10)*30 + 385 + 175) * 0.85)",
      "recurring": true,
      "renewal_note": "On the annual plan, renews as a discounted annual coil cleaning ($327.25/yr)."
    }
  ],
  "checkout_addons": [
    { "id": "magnetic-vent-cover", "name": "Magnetic Vent Cover", "price": 110 },
    { "id": "transition-hose", "name": "Transition Hose Replacement", "price": 75 },
    { "id": "reroute", "name": "Reroute", "price": 189, "price_label": "from $189", "note": "Final price confirmed on-site." }
  ]
}
```

```json availability
{
  "note": "Weekday appointment windows. Weekends and holidays are excluded. The client generates the rolling calendar of open days.",
  "time_windows": [
    { "value": "8am", "label": "8:00 AM – 9:00 AM" },
    { "value": "10am", "label": "10:00 AM – 11:00 AM" },
    { "value": "11am", "label": "11:00 AM – 12:00 PM" },
    { "value": "1pm", "label": "1:00 PM – 2:00 PM" },
    { "value": "2pm", "label": "2:00 PM – 3:00 PM" },
    { "value": "4pm", "label": "4:00 PM – 5:00 PM" }
  ],
  "slots": []
}
```
